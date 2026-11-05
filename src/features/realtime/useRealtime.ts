import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  showLocalNotification,
} from '../../services/notificationService';
import { WS_URL } from '../../config';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { chatApi } from '../../api/chatApi';
import { setInitialPresence, setUserPresence } from '../presence/presenceSlice';
import type { Message } from '../../types/chat';

interface WsMessagePayload {
  message_id: string;
  room_id: string;
  sender_id: string;
  content: string;
  timestamp: number;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO';
  media_url?: string;
  media_width?: number;
  media_height?: number;
}

interface WsEvent {
  type: string;
  timestamp: number;
  message?: WsMessagePayload;
}

export function useRealtime() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.session.token);
  const userId = useAppSelector((s) => s.session.userId);
  const isAuthenticated = useAppSelector((s) => s.session.isAuthenticated);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const [registerPushToken] = chatApi.useRegisterPushTokenMutation();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    // Đăng ký Expo Push Token với backend
    registerForPushNotificationsAsync()
      .then((pushToken) => {
        if (pushToken && isSubscribed) {
          registerPushToken(pushToken).catch((err) => {
            console.warn('[Push] Register token error:', err);
          });
        }
      })
      .catch((err) => {
        console.warn('[Push] Register push error:', err);
      });

    // Lắng nghe khi người dùng bấm vào notification để điều hướng tới phòng chat
    const notificationResponseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.roomId) {
        router.push({
          pathname: '/chat/[roomId]',
          params: { roomId: String(data.roomId) },
        });
      }
    });

    const connect = () => {
      try {
        const url = `${WS_URL}/api/v1/ws?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          console.log('[Realtime] WebSocket connected');
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          if (event.data === 'pong') return;
          try {
            const data: WsEvent = JSON.parse(event.data);
            if (data.type === 'NEW_MESSAGE' && data.message) {
              const msg = data.message;
              const formatted: Message = {
                id: msg.message_id,
                roomId: msg.room_id,
                senderId: msg.sender_id,
                type: msg.type === 'IMAGE' ? 'image' : 'text',
                content: msg.content,
                timestamp: msg.timestamp,
                status: 'sent',
                imageUrl: msg.media_url,
                imageWidth: msg.media_width,
                imageHeight: msg.media_height,
              };

              // 1. Cập nhật cache của getMessages nếu phòng đó đang mở / có trong cache
              dispatch(
                chatApi.util.updateQueryData('getMessages', msg.room_id, (draft) => {
                  const existingIndex = draft.messages.findIndex((m) => m.id === msg.message_id);
                  if (existingIndex >= 0) {
                    draft.messages[existingIndex] = formatted;
                  } else {
                    draft.messages.push(formatted);
                  }
                }),
              );

              // 2. Cập nhật cache danh sách phòng (tin cuối & sắp xếp phòng lên đầu)
              dispatch(
                chatApi.util.updateQueryData('getRooms', undefined, (draft) => {
                  const room = draft.find((r) => r.id === msg.room_id);
                  if (room) {
                    room.lastMessage = msg.content || (msg.type === 'IMAGE' ? 'Đã gửi một ảnh' : '');
                    room.lastMessageSenderId = msg.sender_id;
                    room.lastMessageAt = msg.timestamp;
                    const idx = draft.indexOf(room);
                    if (idx > 0) {
                      draft.splice(idx, 1);
                      draft.unshift(room);
                    }
                  } else {
                    dispatch(chatApi.util.invalidateTags(['Room']));
                  }
                }),
              );

              // 3. Thông báo đẩy (Push Notification) khi nhận tin nhắn từ người khác
              if (msg.sender_id !== userId) {
                showLocalNotification(
                  'Tin nhắn mới',
                  msg.content || (msg.type === 'IMAGE' ? 'Đã gửi một hình ảnh' : 'Bạn có tin nhắn mới'),
                  { roomId: msg.room_id }
                );
              }
            } else if (data.type === 'ROOM_UPDATED') {
              dispatch(chatApi.util.invalidateTags(['Room']));
            } else if (data.type === 'FRIEND_REQUEST') {
              dispatch(chatApi.util.invalidateTags(['FriendRequest']));
              showLocalNotification(
                'Lời mời kết bạn',
                'Bạn vừa nhận được một lời mời kết bạn mới!'
              );
            } else if (data.type === 'FRIEND_ACCEPTED') {
              dispatch(chatApi.util.invalidateTags(['Friend', 'Room']));
              showLocalNotification(
                'Kết bạn thành công',
                'Lời mời kết bạn của bạn đã được chấp thuận!'
              );
            } else if (data.type === 'INITIAL_PRESENCE' && Array.isArray((data as any).online_user_ids)) {
              dispatch(setInitialPresence((data as any).online_user_ids));
            } else if (data.type === 'USER_PRESENCE') {
              const p = data as any;
              dispatch(setUserPresence({ userId: p.user_id, isOnline: !!p.is_online, lastSeen: p.last_seen }));
            }
          } catch (err) {
            console.warn('[Realtime] Parse message error:', err);
          }
        };

        ws.onclose = () => {
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          if (!isSubscribed) return;
          console.log('[Realtime] WebSocket closed, retrying in 3s...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isSubscribed) connect();
          }, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[Realtime] WebSocket error:', err);
          ws.close();
        };
      } catch (e) {
        console.warn('[Realtime] Connect failed:', e);
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      notificationResponseSub.remove();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [dispatch, isAuthenticated, token, userId]);
}
