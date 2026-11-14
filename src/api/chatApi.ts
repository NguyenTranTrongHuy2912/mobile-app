import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../config';
import type { RootState } from '../store';
import { logout } from '../features/session/sessionSlice';
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
  StarredMessageItem,
  UploadSignature,
  UserSummary,
} from '../types/chat';


const toMessage = (m: HistoryItem): Message => ({
  id: m.message_id,
  roomId: m.room_id,
  senderId: m.sender_id,
  type: m.type === 'IMAGE' ? ('image' as const) : m.type === 'VIDEO' ? ('video' as const) : m.type === 'FILE' ? ('file' as const) : ('text' as const),
  content: m.content,
  timestamp: m.timestamp,
  status: 'sent' as const,
  imageUrl: m.type === 'IMAGE' ? (m.media_url || undefined) : undefined,
  videoUrl: m.type === 'VIDEO' ? (m.media_url || undefined) : undefined,
  fileUrl: m.type === 'FILE' ? (m.media_url || undefined) : undefined,
  fileName: m.file_name,
  fileSize: m.file_size,
  imageWidth: m.media_width || undefined,
  imageHeight: m.media_height || undefined,
  videoDurationMs: m.media_duration_ms || undefined,
  isRevoked: m.is_revoked,
  reactions: m.reactions,
  isForwarded: m.is_forwarded,
  isStarred: m.is_starred,
  replyTo: m.reply_to
    ? {
        messageId: m.reply_to.message_id,
        senderName: m.reply_to.sender_name,
        content: m.reply_to.content,
      }
    : null,
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
  pinnedMessage: d.pinned_message
    ? {
        id: d.pinned_message.id,
        content: d.pinned_message.content,
        senderId: d.pinned_message.sender_id,
        senderName: d.pinned_message.sender_name,
        timestamp: d.pinned_message.timestamp,
      }
    : null,
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

    getSuggestedUsers: build.query<UserSummary[], void>({
      query: () => '/api/v1/users/suggestions',
      transformResponse: (res: SearchUsersResponse): UserSummary[] =>
        res.users.map((u) => ({ userId: u.user_id, displayName: u.display_name, email: u.email })),
      providesTags: ['Friend'],
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

    // Rời khỏi phòng chat nhóm (xử lý dữ liệu thật trên MongoDB Atlas)
    leaveRoom: build.mutation<{ ok: boolean; message: string }, string>({
      query: (roomId) => ({
        url: `/api/v1/rooms/${encodeURIComponent(roomId)}/leave`,
        method: 'POST',
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

    // Xin chữ ký để upload ảnh/video/tài liệu thẳng lên Cloudinary
    getUploadSignature: build.mutation<UploadSignature, { resourceType?: 'image' | 'video' | 'raw' } | void>({
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
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        imageWidth?: number;
        imageHeight?: number;
        durationMs?: number;
        isForwarded?: boolean;
        replyTo?: {
          messageId: string;
          senderName: string;
          content: string;
        } | null;
      }
    >({
      query: ({ roomId, content, localId, type, imageUrl, videoUrl, fileUrl, fileName, fileSize, imageWidth, imageHeight, durationMs, isForwarded, replyTo }) => {
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
        } else if (type === 'file') {
          body.type = 'FILE';
          body.media_url = fileUrl;
          body.file_name = fileName;
          body.file_size = fileSize;
        }
        if (isForwarded) {
          body.is_forwarded = true;
        }
        if (replyTo) {
          body.reply_to = {
            message_id: replyTo.messageId,
            sender_name: replyTo.senderName,
            content: replyTo.content,
          };
        }
        return { url: '/api/v1/chat/send', method: 'POST', body };
      },
      // Gửi xong thì làm mới danh sách phòng để cập nhật tin cuối
      invalidatesTags: ['Room'],

      // Optimistic update: hiện tin nhắn ngay, sau đó cập nhật trạng thái theo kết quả server.
      async onQueryStarted(
        { roomId, senderId, content, localId, type, imageUrl, videoUrl, fileUrl, fileName, fileSize, imageWidth, imageHeight, durationMs, isForwarded, replyTo },
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
                fileUrl,
                fileName,
                fileSize,
                imageWidth,
                imageHeight,
                videoDurationMs: durationMs,
                isForwarded,
                replyTo,
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
    askAi: build.mutation<
      { ok: boolean; reply: string; model: string },
      { prompt: string; history?: { role: string; content: string }[] }
    >({
      query: (body) => ({
        url: '/api/v1/ai/chat',
        method: 'POST',
        body,
      }),
    }),
    rewriteText: build.mutation<
      { ok: boolean; original: string; rewritten: string; tone: string },
      { text: string; tone?: 'formal' | 'friendly' | 'short' | 'english' }
    >({
      query: (body) => ({
        url: '/api/v1/ai/rewrite',
        method: 'POST',
        body: { text: body.text, tone: body.tone ?? 'formal' },
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
    // --- Thuật toán Vector Database & Semantic Search & RAG ---
    semanticSearch: build.mutation<
      {
        ok: boolean;
        query: string;
        results: Array<{
          message_id: string;
          content: string;
          sender_id: string;
          sender_name: string;
          timestamp: number;
          similarity_score: number;
          match_percent: number;
        }>;
        total: number;
        algorithm: string;
      },
      { roomId: string; query: string; topK?: number }
    >({
      query: ({ roomId, query, topK }) => ({
        url: '/api/v1/ai/semantic-search',
        method: 'POST',
        body: { room_id: roomId, query, top_k: topK ?? 5 },
      }),
    }),

    ragChat: build.mutation<
      {
        ok: boolean;
        room_name: string;
        question: string;
        answer: string;
        matched_messages: Array<{
          message_id: string;
          content: string;
          sender_name: string;
          similarity_score: number;
          match_percent: number;
        }>;
        total_matches: number;
        algorithm: string;
      },
      { roomId: string; question: string }
    >({
      query: (body) => ({
        url: '/api/v1/ai/rag-chat',
        method: 'POST',
        body: { room_id: body.roomId, question: body.question },
      }),
    }),

    revokeMessage: build.mutation<
      { ok: boolean; message_id: string; content: string },
      { roomId: string; messageId: string }
    >({
      query: ({ roomId, messageId }) => ({
        url: `/api/v1/rooms/${roomId}/messages/${messageId}/revoke`,
        method: 'POST',
      }),
      async onQueryStarted({ roomId, messageId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
              const m = draft.messages.find((item) => item.id === messageId);
              if (m) {
                m.content = data.content || 'Tin nhắn đã được thu hồi';
                m.isRevoked = true;
              }
            }),
          );
        } catch {}
      },
    }),

    reactMessage: build.mutation<
      { ok: boolean; message_id: string; reactions: Record<string, string[]> },
      { roomId: string; messageId: string; emoji: string }
    >({
      query: ({ roomId, messageId, emoji }) => ({
        url: `/api/v1/rooms/${roomId}/messages/${messageId}/react`,
        method: 'POST',
        body: { emoji },
      }),
      async onQueryStarted({ roomId, messageId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
              const m = draft.messages.find((item) => item.id === messageId);
              if (m) {
                m.reactions = data.reactions;
              }
            }),
          );
        } catch {}
      },
    }),

    pinMessage: build.mutation<
      { ok: boolean; room_id: string; pinned_message: any },
      { roomId: string; messageId: string }
    >({
      query: ({ roomId, messageId }) => ({
        url: `/api/v1/rooms/${roomId}/pin`,
        method: 'POST',
        body: { message_id: messageId },
      }),
      invalidatesTags: ['Room'],
    }),

    unpinMessage: build.mutation<{ ok: boolean; room_id: string }, { roomId: string }>({
      query: ({ roomId }) => ({
        url: `/api/v1/rooms/${roomId}/pin`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Room'],
    }),

    toggleStarMessage: build.mutation<
      { ok: boolean; message_id: string; starred: boolean },
      { messageId: string; roomId?: string }
    >({
      query: ({ messageId }) => ({
        url: `/api/v1/chat/messages/${messageId}/star`,
        method: 'POST',
      }),
      async onQueryStarted({ messageId, roomId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (roomId) {
            dispatch(
              chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
                const m = draft.messages.find((item) => item.id === messageId);
                if (m) {
                  m.isStarred = data.starred;
                }
              }),
            );
          }
        } catch {}
      },
    }),

    getStarredMessages: build.query<StarredMessageItem[], { roomId?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/chat/starred',
        params: arg && typeof arg === 'object' && arg.roomId ? { room_id: arg.roomId } : undefined,
      }),
      transformResponse: (res: { messages: StarredMessageItem[] }) => res.messages || [],
      providesTags: ['Message'],
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useSearchUsersQuery,
  useGetSuggestedUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useLeaveRoomMutation,
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
  useRewriteTextMutation,
  useSummarizeRoomMutation,
  useSemanticSearchMutation,
  useRagChatMutation,
  useRevokeMessageMutation,
  useReactMessageMutation,
  usePinMessageMutation,
  useUnpinMessageMutation,
  useToggleStarMessageMutation,
  useGetStarredMessagesQuery,
} = chatApi;