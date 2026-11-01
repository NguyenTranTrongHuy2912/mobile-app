import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../config';
import type { RootState } from '../store';
import type {
  CreateRoomRequest,
  HistoryResponse,
  Message,
  Room,
  RoomDto,
  RoomsResponse,
  RoomType,
  SearchUsersResponse,
  SendMessageRequest,
  SendMessageResponse,
  UserSummary,
} from '../types/chat';

const toRoom = (d: RoomDto): Room => ({
  id: d.room_id,
  type: d.type === 'GROUP' ? 'group' : 'direct',
  name: d.name,
  memberIds: d.member_ids,
  members: d.members.map((m) => ({ userId: m.user_id, displayName: m.display_name })),
  lastMessage: d.last_message?.content,
  lastMessageSenderId: d.last_message?.sender_id,
  lastMessageAt: d.last_message?.timestamp,
  unreadCount: d.unread_count,
});

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    // Mọi endpoint của gateway (trừ /auth/*) đều cần JWT
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).session.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Room', 'Message'],
  // Giữ lâu để tin đang gửi / gửi lỗi (chỉ nằm trong cache) không mất khi rời phòng
  keepUnusedDataFor: 3600,
  endpoints: (build) => ({
    getRooms: build.query<Room[], void>({
      query: () => '/api/v1/rooms',
      transformResponse: (res: RoomsResponse): Room[] => res.rooms.map(toRoom),
      providesTags: ['Room'],
    }),

    searchUsers: build.query<UserSummary[], string>({
      query: (q) => ({ url: '/api/v1/users/search', params: { q, limit: 20 } }),
      transformResponse: (res: SearchUsersResponse): UserSummary[] =>
        res.users.map((u) => ({ userId: u.user_id, displayName: u.display_name, email: u.email })),
      keepUnusedDataFor: 30,
    }),

    // direct: memberIds có đúng 1 người; group: cần name và ít nhất 2 người
    createRoom: build.mutation<Room, { type: RoomType; name?: string; memberIds: string[] }>({
      query: ({ type, name, memberIds }) => {
        const body: CreateRoomRequest = {
          type: type === 'group' ? 'GROUP' : 'DIRECT',
          name: name ?? '',
          member_ids: memberIds,
        };
        return { url: '/api/v1/rooms', method: 'POST', body };
      },
      transformResponse: (res: RoomDto): Room => toRoom(res),
      invalidatesTags: ['Room'],
    }),

    // Đánh dấu đã đọc đến tin mới nhất trong phòng
    markRoomRead: build.mutation<{ ok: boolean }, string>({
      query: (roomId) => ({
        url: `/api/v1/rooms/${encodeURIComponent(roomId)}/read`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Room'],
    }),

    getMessages: build.query<Message[], string>({
      query: (roomId) => `/api/v1/chat/history/${encodeURIComponent(roomId)}?limit=50`,
      // Gateway trả tin mới nhất trước, FlatList cần cũ nhất trước
      transformResponse: (res: HistoryResponse): Message[] =>
        res.messages
          .map((m) => ({
            id: m.message_id,
            roomId: m.room_id,
            senderId: m.sender_id,
            content: m.content,
            timestamp: m.timestamp,
            status: 'sent' as const,
          }))
          .reverse(),
      // Khi polling, giữ lại tin đang gửi / gửi lỗi mà server chưa có
      merge: (currentCache, newItems) => {
        const pending = currentCache.filter(
          (m) => m.status !== 'sent' && !newItems.some((n) => n.id === m.id),
        );
        currentCache.splice(0, currentCache.length, ...newItems, ...pending);
      },
      providesTags: (_result, _error, roomId) => [{ type: 'Message', id: roomId }],
    }),

    sendMessage: build.mutation<
      SendMessageResponse,
      { roomId: string; senderId: string; content: string; localId: string }
    >({
      query: ({ roomId, content, localId }) => {
        // senderId chỉ dùng để hiện tin tạm trong cache; gateway lấy người gửi từ token
        const body: SendMessageRequest = {
          room_id: roomId,
          content,
          message_id: localId,
        };
        return { url: '/api/v1/chat/send', method: 'POST', body };
      },
      // Gửi xong thì làm mới danh sách phòng để cập nhật tin cuối
      invalidatesTags: ['Room'],

      // Optimistic update: hiện tin nhắn ngay, sau đó cập nhật trạng thái theo kết quả server.
      async onQueryStarted({ roomId, senderId, content, localId }, { dispatch, queryFulfilled }) {
        dispatch(
          chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
            const existing = draft.find((m) => m.id === localId);
            if (existing) {
              existing.status = 'sending';
            } else {
              draft.push({
                id: localId,
                roomId,
                senderId,
                content,
                timestamp: Date.now(),
                status: 'sending',
              });
            }
          }),
        );

        const setStatus = (update: (m: Message) => void) =>
          dispatch(
            chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
              const msg = draft.find((m) => m.id === localId);
              if (msg) update(msg);
            }),
          );

        try {
          const { data } = await queryFulfilled;
          if (data.is_success) {
            setStatus((m) => {
              m.id = data.message_id;
              m.timestamp = data.timestamp;
              m.status = 'sent';
            });
          } else {
            setStatus((m) => {
              m.status = 'failed';
            });
          }
        } catch {
          // Giữ lại tin nhắn với trạng thái lỗi để người dùng thấy và gửi lại
          setStatus((m) => {
            m.status = 'failed';
          });
        }
      },
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;