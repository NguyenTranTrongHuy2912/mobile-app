import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../config';
import type { HistoryResponse, Message, Room, SendMessageRequest, SendMessageResponse } from '../types/chat';
import { mockRooms } from './mockData';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['Room', 'Message'],
  // Dữ liệu giả nằm trong cache nên giữ lâu để không bị reset khi rời màn hình
  keepUnusedDataFor: 3600,
  endpoints: (build) => ({
    // TODO: chưa có backend. Đổi thành `query: () => '/api/v1/rooms'` khi gateway có endpoint.
    getRooms: build.query<Room[], void>({
      queryFn: async () => ({ data: mockRooms }),
      providesTags: ['Room'],
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
      query: ({ roomId, senderId, content, localId }) => {
        const body: SendMessageRequest = {
          room_id: roomId,
          sender_id: senderId,
          content,
          message_id: localId,
        };
        return { url: '/api/v1/chat/send', method: 'POST', body };
      },

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

export const { useGetRoomsQuery, useGetMessagesQuery, useSendMessageMutation } = chatApi;
