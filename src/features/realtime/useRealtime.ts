import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
import { logout } from '../session/sessionSlice';
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
  media_duration_ms?: number;
}

interface WsEvent {
  type: string;
  timestamp: number;
  message?: WsMessagePayload;
}

const PING_INTERVAL_MS = 25000;
// Quá ngần này mà không nhận được gì (kể cả pong) thì coi như socket đã chết và nối lại
const DEAD_AFTER_MS = 60000;
const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 15000;
// Kết nối sống được lâu hơn mức này mới tính là "ổn định" và reset bộ đếm backoff
const STABLE_AFTER_MS = 5000;

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
    let attempt = 0;
    let openedAt = 0;
    let lastActivityAt = 0;
    let hasConnectedBefore = false;

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

    const scheduleReconnect = () => {
      if (!isSubscribed || reconnectTimeoutRef.current) return;
      // Lùi dần 1s, 2s, 4s ... tối đa 15s để không dội liên tục lên server
      const delay = Math.min(BASE_RETRY_MS * 2 ** attempt, MAX_RETRY_MS);
      attempt += 1;
      console.log(`[Realtime] Retrying in ${delay}ms`);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (isSubscribed) connect();
      }, delay);
    };

    const connect = () => {
      const current = wsRef.current;
      if (
        current &&
        (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }
      try {
        const url = `${WS_URL}/api/v1/ws?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          console.log('[Realtime] WebSocket connected');
          openedAt = Date.now();
          lastActivityAt = openedAt;
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState !== WebSocket.OPEN) return;
            // Không nhận được gì trong thời gian dài: socket "treo", đóng để nối lại
            if (Date.now() - lastActivityAt > DEAD_AFTER_MS) {
              console.warn('[Realtime] No activity, reconnecting');
              ws.close();
              return;
            }
            ws.send('ping');
          }, PING_INTERVAL_MS);

          // Nối lại sau khi rớt: có thể đã lỡ tin, làm mới danh sách phòng (tin cuối, số chưa đọc)
          if (hasConnectedBefore) {
            dispatch(chatApi.util.invalidateTags(['Room']));
          }
          hasConnectedBefore = true;
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          lastActivityAt = Date.now();
          if (event.data === 'pong') return;
          try {
            const data: WsEvent = JSON.parse(event.data);
            if (data.type === 'NEW_MESSAGE' && data.message) {
              const msg = data.message;
              const kind: Message['type'] =
                msg.type === 'IMAGE' ? 'image' : msg.type === 'VIDEO' ? 'video' : 'text';
              const formatted: Message = {
                id: msg.message_id,
                roomId: msg.room_id,
                senderId: msg.sender_id,
                type: kind,
                content: msg.content,
                timestamp: msg.timestamp,
                status: 'sent',
                imageUrl: kind === 'image' ? msg.media_url : undefined,
                videoUrl: kind === 'video' ? msg.media_url : undefined,
                videoDurationMs: kind === 'video' ? msg.media_duration_ms : undefined,
                imageWidth: msg.media_width,
                imageHeight: msg.media_height,
              };
              const preview =
                msg.content ||
                (msg.type === 'IMAGE' ? 'Đã gửi một ảnh' : msg.type === 'VIDEO' ? 'Đã gửi một video' : '');

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
                    room.lastMessage = preview;
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
                  msg.content ||
                    (msg.type === 'IMAGE'
                      ? 'Đã gửi một hình ảnh'
                      : msg.type === 'VIDEO'
                        ? 'Đã gửi một video'
                        : 'Bạn có tin nhắn mới'),
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

        ws.onclose = (e: any) => {
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          if (wsRef.current === ws) wsRef.current = null;
          if (!isSubscribed) return;
          // Chỉ reset backoff khi kết nối đã sống đủ lâu; nếu mở lên là đóng ngay thì tiếp tục lùi dần
          if (openedAt && Date.now() - openedAt >= STABLE_AFTER_MS) attempt = 0;
          openedAt = 0;
          console.log('[Realtime] WebSocket closed', e?.code, e?.reason);
          if (e?.code === 1008 || e?.code === 4003 || e?.code === 4403 || e?.code === 403 || (e?.reason && e.reason.includes('token'))) {
            console.warn('[Realtime] Token rejected by server, auto logging out');
            dispatch(logout());
            return;
          }
          scheduleReconnect();
        };

        ws.onerror = (err) => {
          console.warn('[Realtime] WebSocket error:', err);
          ws.close();
        };
      } catch (e) {
        console.warn('[Realtime] Connect failed:', e);
        scheduleReconnect();
      }
    };

    // Quay lại app từ nền (ví dụ sau khi chọn ảnh/chụp ảnh): nối lại ngay nếu socket đã rớt
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !isSubscribed) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        attempt = 0;
        connect();
      }
    });

    connect();

    return () => {
      isSubscribed = false;
      notificationResponseSub.remove();
      appStateSub.remove();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [dispatch, isAuthenticated, token, userId]);
}