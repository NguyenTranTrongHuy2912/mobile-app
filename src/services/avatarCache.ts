import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';

const ASYNC_STORAGE_KEY = '@app_user_avatar_cache';

class AvatarCacheManager {
  private idToAvatar = new Map<string, string>();
  private nameToAvatar = new Map<string, string>();
  private listeners = new Set<() => void>();
  private pendingFetches = new Set<string>();
  private notifyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const raw = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.ids) {
          for (const [k, v] of Object.entries(parsed.ids)) {
            if (typeof v === 'string' && v.trim()) this.idToAvatar.set(k, v.trim());
          }
        }
        if (parsed.names) {
          for (const [k, v] of Object.entries(parsed.names)) {
            if (typeof v === 'string' && v.trim()) this.nameToAvatar.set(k, v.trim());
          }
        }
      }
    } catch {
      // Bỏ qua lỗi đọc cache local
    } finally {
      this.notify();
    }
  }

  private async persistToStorage() {
    try {
      const idsObj: Record<string, string> = {};
      const namesObj: Record<string, string> = {};
      this.idToAvatar.forEach((v, k) => {
        idsObj[k] = v;
      });
      this.nameToAvatar.forEach((v, k) => {
        namesObj[k] = v;
      });
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY,
        JSON.stringify({ ids: idsObj, names: namesObj })
      );
    } catch {
      // Bỏ qua lỗi lưu cache local
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Phát thông báo bất đồng bộ ra ngoài chu kỳ render của React
   */
  private notify() {
    if (this.notifyTimeout) return;
    this.notifyTimeout = setTimeout(() => {
      this.notifyTimeout = null;
      this.listeners.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    }, 0);
  }

  /**
   * Đăng ký avatar vào bộ nhớ đệm
   */
  public register(userId?: string | null, name?: string | null, avatarUrl?: string | null): void {
    if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.trim()) return;
    const url = avatarUrl.trim();
    let hasChange = false;

    if (userId && typeof userId === 'string' && userId.trim()) {
      const uid = userId.trim();
      if (this.idToAvatar.get(uid) !== url) {
        this.idToAvatar.set(uid, url);
        hasChange = true;
      }
    }

    if (name && typeof name === 'string' && name.trim()) {
      const normName = name.trim().toLowerCase();
      if (this.nameToAvatar.get(normName) !== url) {
        this.nameToAvatar.set(normName, url);
        hasChange = true;
      }
    }

    if (hasChange) {
      this.notify();
      this.persistToStorage();
    }
  }

  /**
   * Đọc avatar thuần túy (Pure read - tuyệt đối không gây side-effect hay gọi setState trong render)
   */
  public get(userId?: string | null, name?: string | null, fallbackUrl?: string | null): string | undefined {
    if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
      return fallbackUrl.trim();
    }

    if (userId && typeof userId === 'string' && userId.trim()) {
      const found = this.idToAvatar.get(userId.trim());
      if (found) return found;
    }

    if (name && typeof name === 'string' && name.trim()) {
      const found = this.nameToAvatar.get(name.trim().toLowerCase());
      if (found) return found;
    }

    return undefined;
  }

  /**
   * Kích hoạt truy vấn tìm kiếm ngầm (chỉ gọi trong useEffect)
   */
  public triggerBackgroundResolve(userId?: string | null, name?: string | null, token?: string): void {
    const query = name?.trim() || userId?.trim();
    if (!query || query.length < 2) return;
    if (this.pendingFetches.has(query)) return;

    this.pendingFetches.add(query);

    (async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/v1/users/search?q=${encodeURIComponent(query)}&limit=10`, {
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          const users = data?.users || [];
          for (const u of users) {
            const av = u.avatar_url || u.avatarUrl || u.avatar;
            if (av && typeof av === 'string' && av.trim()) {
              this.register(u.user_id, u.display_name, av);
            }
          }
        }
      } catch {
        // Tự động bỏ qua lỗi mạng
      } finally {
        setTimeout(() => {
          this.pendingFetches.delete(query);
        }, 15000); // 15s debounce
      }
    })();
  }
}

export const avatarCache = new AvatarCacheManager();

/**
 * React hook an toàn, lắng nghe cập nhật avatar mà không gây re-render loop
 */
export function useAvatar(
  userId?: string | null,
  name?: string | null,
  fallbackUrl?: string | null
): string | undefined {
  const [avatar, setAvatar] = useState<string | undefined>(() =>
    avatarCache.get(userId, name, fallbackUrl)
  );

  useEffect(() => {
    if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
      avatarCache.register(userId, name, fallbackUrl);
    } else {
      avatarCache.triggerBackgroundResolve(userId, name);
    }
  }, [userId, name, fallbackUrl]);

  useEffect(() => {
    const cur = avatarCache.get(userId, name, fallbackUrl);
    setAvatar(cur);

    const unsubscribe = avatarCache.subscribe(() => {
      const updated = avatarCache.get(userId, name, fallbackUrl);
      setAvatar((prev) => (prev !== updated ? updated : prev));
    });

    return unsubscribe;
  }, [userId, name, fallbackUrl]);

  return avatar || (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.trim() ? fallbackUrl.trim() : undefined);
}
