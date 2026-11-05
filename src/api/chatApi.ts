import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../config';
import type { RootState } from '../store';
import type {
  CreateRoomRequest,
  Friend,
  FriendRequest,
  HistoryItem,
  HistoryResponse,
  Message,
  MessagesState,
  MessageType,
  Room,
  RoomDto,
  RoomsResponse,
  RoomType,
  SearchUsersResponse,
  SendMessageRequest,
  SendMessageResponse,
  UploadSignature,
  UserSummary,
} from '../types/chat';


const toMessage = (m: HistoryItem): Message => ({
  id: m.message_id,
  roomId: m.room_id,
  senderId: m.sender_id,
  type: m.type === 'IMAGE' ? ('image' as const) : m.type === 'VIDEO' ? ('video' as const) : ('text' as const),
  content: m.content,
  timestamp: m.timestamp,
  status: 'sent' as const,
  imageUrl: m.type === 'IMAGE' ? (m.media_url || undefined) : undefined,
  videoUrl: m.type === 'VIDEO' ? (m.media_url || undefined) : undefined,
  imageWidth: m.media_width || undefined,
  imageHeight: m.media_height || undefined,
  videoDurationMs: m.media_duration_ms || undefined,
});

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
  tagTypes: ['Room', 'Message', 'Friend', 'FriendRequest'],
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

    getMessages: build.query<MessagesState, string>({
      query: (roomId) => `/api/v1/chat/history/${encodeURIComponent(roomId)}?limit=50`,
      // Gateway trả tin mới nhất trước, FlatList cần cũ nhất trước
      transformResponse: (res: HistoryResponse): MessagesState => ({
        messages: res.messages.map(toMessage).reverse(),
        hasMore: res.has_more,
      }),
      // Khi polling, giữ lại tin cũ đã tải thêm và tin đang gửi / gửi lỗi
      merge: (currentCache, incoming) => {
        const incomingIds = new Set(incoming.messages.map((m) => m.id));
        const oldestIncomingTs =
          incoming.messages.length > 0 ? incoming.messages[0].timestamp : Infinity;

        // Giữ lại các tin cũ hơn đợt polling (đã load qua loadEarlierMessages)
        const olderMessages = currentCache.messages.filter(
          (m) => m.timestamp < oldestIncomingTs && !incomingIds.has(m.id),
        );

        // Giữ lại các tin đang gửi / gửi lỗi chưa có trên server
        const pendingMessages = currentCache.messages.filter(
          (m) => m.status !== 'sent' && !incomingIds.has(m.id),
        );

        const merged = [...olderMessages, ...incoming.messages];
        for (const p of pendingMessages) {
          if (!merged.some((m) => m.id === p.id)) {
            merged.push(p);
          }
        }
        currentCache.messages = merged;
        if (incoming.hasMore !== undefined && olderMessages.length === 0) {
          currentCache.hasMore = incoming.hasMore;
        }
      },
      providesTags: (_result, _error, roomId) => [{ type: 'Message', id: roomId }],
    }),

    // Tải thêm tin nhắn cũ hơn trước beforeTimestamp
    loadEarlierMessages: build.mutation<
      HistoryResponse,
      { roomId: string; beforeTimestamp: number }
    >({
      query: ({ roomId, beforeTimestamp }) =>
        `/api/v1/chat/history/${encodeURIComponent(roomId)}?limit=50&before_timestamp=${beforeTimestamp}`,
      async onQueryStarted({ roomId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const earlierMessages: Message[] = data.messages.map(toMessage).reverse();

          dispatch(
            chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
              const existingIds = new Set(draft.messages.map((m) => m.id));
              const uniqueEarlier = earlierMessages.filter((m) => !existingIds.has(m.id));
              draft.messages.unshift(...uniqueEarlier);
              draft.hasMore = data.has_more;
            }),
          );
        } catch (e) {
          console.warn('Lỗi khi tải tin nhắn cũ:', e);
        }
      },
    }),

    // Xin chữ ký để upload ảnh/video thẳng lên Cloudinary
    getUploadSignature: build.mutation<UploadSignature, { resourceType?: 'image' | 'video' } | void>({
      query: (arg) => ({
        url: '/api/v1/uploads/sign',
        method: 'POST',
        params: { resource_type: arg && typeof arg === 'object' && arg.resourceType ? arg.resourceType : 'image' },
      }),
    }),

    sendMessage: build.mutation<
      SendMessageResponse,
      {
        roomId: string;
        senderId: string;
        content: string;
        localId: string;
        type?: MessageType;
        imageUrl?: string;
        videoUrl?: string;
        imageWidth?: number;
        imageHeight?: number;
        durationMs?: number;
      }
    >({
      query: ({ roomId, content, localId, type, imageUrl, videoUrl, imageWidth, imageHeight, durationMs }) => {
        // senderId chỉ dùng để hiện tin tạm trong cache; gateway lấy người gửi từ token
        const body: SendMessageRequest = {
          room_id: roomId,
          content,
          message_id: localId,
        };
        if (type === 'image') {
          body.type = 'IMAGE';
          body.media_url = imageUrl;
          body.media_width = imageWidth ?? 0;
          body.media_height = imageHeight ?? 0;
        } else if (type === 'video') {
          body.type = 'VIDEO';
          body.media_url = videoUrl;
          body.media_width = imageWidth ?? 0;
          body.media_height = imageHeight ?? 0;
          body.media_duration_ms = durationMs ?? 0;
        }
        return { url: '/api/v1/chat/send', method: 'POST', body };
      },
      // Gửi xong thì làm mới danh sách phòng để cập nhật tin cuối
      invalidatesTags: ['Room'],

      // Optimistic update: hiện tin nhắn ngay, sau đó cập nhật trạng thái theo kết quả server.
      async onQueryStarted(
        { roomId, senderId, content, localId, type, imageUrl, videoUrl, imageWidth, imageHeight, durationMs },
        { dispatch, queryFulfilled },
      ) {
        dispatch(
          chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
            const existing = draft.messages.find((m) => m.id === localId);
            if (existing) {
              existing.status = 'sending';
            } else {
              draft.messages.push({
                id: localId,
                roomId,
                senderId,
                type: type ?? 'text',
                content,
                timestamp: Date.now(),
                status: 'sending',
                imageUrl,
                videoUrl,
                imageWidth,
                imageHeight,
                videoDurationMs: durationMs,
              });
            }
          }),
        );

        const setStatus = (update: (m: Message) => void) =>
          dispatch(
            chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
              const msg = draft.messages.find((m) => m.id === localId);
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
    // --- Hệ thống kết bạn ---
    getFriends: build.query<Friend[], void>({
      query: () => '/api/v1/friends',
      transformResponse: (res: { friends: any[] }): Friend[] =>
        res.friends.map((f) => ({
          userId: f.user_id,
          displayName: f.display_name,
          email: f.email,
          avatarUrl: f.avatar_url || undefined,
        })),
      providesTags: ['Friend'],
    }),

    getFriendRequests: build.query<FriendRequest[], void>({
      query: () => '/api/v1/friends/requests',
      transformResponse: (res: { requests: any[] }): FriendRequest[] =>
        res.requests.map((r) => ({
          requestId: r.request_id,
          senderId: r.sender_id,
          senderName: r.sender_name,
          senderEmail: r.sender_email,
          createdAt: r.created_at,
        })),
      providesTags: ['FriendRequest'],
    }),

    sendFriendRequest: build.mutation<{ ok: boolean; message: string }, string>({
      query: (receiverId) => ({
        url: '/api/v1/friends/request',
        method: 'POST',
        body: { receiver_id: receiverId },
      }),
      invalidatesTags: ['FriendRequest'],
    }),

    respondFriendRequest: build.mutation<
      { ok: boolean; message: string },
      { requestId: string; accept: boolean }
    >({
      query: ({ requestId, accept }) => ({
        url: '/api/v1/friends/respond',
        method: 'POST',
        body: { request_id: requestId, accept },
      }),
      invalidatesTags: ['Friend', 'FriendRequest', 'Room'],
    }),

    // --- Tab Cá nhân ---
    updateProfile: build.mutation<
      { ok: boolean; display_name?: string; avatar_url?: string },
      { displayName?: string; avatarUrl?: string }
    >({
      query: (body) => ({
        url: '/api/v1/users/profile',
        method: 'PUT',
        body: {
          display_name: body.displayName,
          avatar_url: body.avatarUrl,
        },
      }),
      invalidatesTags: ['Room', 'Friend'],
    }),

    changePassword: build.mutation<
      { ok: boolean; message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: ({ currentPassword, newPassword }) => ({
        url: '/api/v1/users/change-password',
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      }),
    }),

    registerPushToken: build.mutation<{ ok: boolean }, string>({
      query: (pushToken) => ({
        url: '/api/v1/users/push-token',
        method: 'POST',
        body: { push_token: pushToken },
      }),
    }),

    getOnlineUsers: build.query<{ online_user_ids: string[] }, void>({
      query: () => '/api/v1/users/online',
    }),
    // --- Trợ lý ảo AI & Tóm tắt hội thoại ---
    askAi: build.mutation<{ ok: boolean; reply: string; model: string }, { prompt: string }>({
      query: (body) => ({
        url: '/api/v1/ai/chat',
        method: 'POST',
        body,
      }),
    }),

    summarizeRoom: build.mutation<
      { ok: boolean; room_name: string; summary: string; total_messages: number },
      { roomId: string; limit?: number }
    >({
      query: ({ roomId, limit }) => ({
        url: '/api/v1/ai/summarize',
        method: 'POST',
        body: { room_id: roomId, limit: limit ?? 30 },
      }),
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useLoadEarlierMessagesMutation,
  useSendMessageMutation,
  useGetUploadSignatureMutation,
  useGetFriendsQuery,
  useGetFriendRequestsQuery,
  useSendFriendRequestMutation,
  useRespondFriendRequestMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRegisterPushTokenMutation,
  useGetOnlineUsersQuery,
  useAskAiMutation,
  useSummarizeRoomMutation,
} = chatApi;