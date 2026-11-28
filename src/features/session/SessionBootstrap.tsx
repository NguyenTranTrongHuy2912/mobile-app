import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAppDispatch } from '../../store/hooks';
import type { AuthUser } from '../../api/authApi';
import { setUser, logout, persistProfile } from './sessionSlice';
import { loadSession, saveSession } from './sessionStorage';
import { API_URL } from '../../config';
import { avatarCache } from '../../services/avatarCache';

SplashScreen.preventAutoHideAsync();

function decodeBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const str = input.replace(/=+$/, '');
  let output = '';
  for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++)); ) {
    const charIndex = chars.indexOf(buffer);
    if (~charIndex) {
      bs = bc % 4 ? bs * 64 + charIndex : charIndex;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
  }
  return output;
}

function isTokenExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeBase64(base64);
    const payload = JSON.parse(decoded);
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Token nằm trong SecureStore; loadSession tự chuyển dữ liệu cũ từ AsyncStorage sang
        const user = await loadSession();
        if (user) {
          if (user.userId && user.token) {
            if (isTokenExpired(user.token)) {
              console.warn('[SessionBootstrap] Token đã hết hạn, xóa phiên cũ để đăng nhập lại');
              await dispatch(logout());
            } else {
              // Khôi phục phiên ngay lập tức
              dispatch(setUser(user));
              if (user.avatarUrl) {
                avatarCache.register(user.userId, user.displayName, user.avatarUrl);
              }

              // Tự động đồng bộ quyền Role và trạng thái tài khoản thực tế từ máy chủ
              fetch(`${API_URL}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${user.token}` },
              })
                .then(async (res) => {
                  if (res.ok) {
                    const data = await res.json();
                    if (data && data.role && data.role !== user.role) {
                      const updatedUser: AuthUser = { ...user, role: data.role };
                      await saveSession(updatedUser).catch(() => {});
                      dispatch(setUser(updatedUser));
                    }
                  } else if (res.status === 401) {
                    dispatch(logout());
                  }
                })
                .catch(() => {});

              // Tự động đồng bộ danh sách bạn bè và avatar mới nhất vào cache
              fetch(`${API_URL}/api/v1/friends`, {
                headers: { Authorization: `Bearer ${user.token}` },
              })
                .then(async (res) => {
                  if (res.ok) {
                    const data = await res.json();
                    const friends = data?.friends || [];
                    for (const f of friends) {
                      const av = f.avatar_url || f.avatarUrl || f.avatar;
                      if (av) avatarCache.register(f.user_id, f.display_name, av);
                    }
                  }
                })
                .catch(() => {});

              // Đồng bộ avatar của chính mình nếu chưa có trong session
              if (!user.avatarUrl && user.displayName) {
                fetch(`${API_URL}/api/v1/users/search?q=${encodeURIComponent(user.displayName)}&limit=5`, {
                  headers: { Authorization: `Bearer ${user.token}` },
                })
                  .then(async (res) => {
                    if (res.ok) {
                      const data = await res.json();
                      const me = (data?.users || []).find((u: any) => u.user_id === user.userId);
                      const myAv = me?.avatar_url || me?.avatarUrl;
                      if (myAv) {
                        dispatch(persistProfile({ avatarUrl: myAv }));
                        avatarCache.register(user.userId, user.displayName, myAv);
                      }
                    }
                  })
                  .catch(() => {});
              }
            }
          }
        }
      } catch {}
      setReady(true);
    })();
  }, [dispatch]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  return ready ? <>{children}</> : null;
}
