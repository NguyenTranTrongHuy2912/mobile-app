import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';

const ASYNC_STORAGE_KEY = '@app_user_avatar_cache';

class AvatarCacheManager {
  private idToAvatar = new Map<string, string>();
  private nameToAvatar = new Map<string, string>();
  private listeners = new Set<() => void>();
  private pendingFetches = new Set<string>();
  private isLoadedFromStorage = false;

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
      this.isLoadedFromStorage = true;
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

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  }

  /**
   * Đăng ký avatar vào bộ nhớ đệm và lưu trữ local
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
   * Lấy avatar đồng bộ: kiểm tra fallback -> id -> name
   */
  public get(userId?: string | null, name?: string | null, fallbackUrl?: string | null): string | undefined {
    if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
      const url = fallbackUrl.trim();
      this.register(userId, name, url);
      return url;
    }

    if (userId && typeof userId === 'string' && userId.trim()) {
      const found = this.idToAvatar.get(userId.trim());
      if (found) return found;
    }

    if (name && typeof name === 'string' && name.trim()) {
      const found = this.nameToAvatar.get(name.trim().toLowerCase());
      if (found) return found;
    }

    // Nếu chưa có, kích hoạt tìm kiếm ngầm nếu có query hợp lệ
    this.triggerBackgroundResolve(userId, name);
    return undefined;
  }

  /**
   * Kích hoạt truy vấn tìm kiếm ngầm thông qua searchUsers để tự động cập nhật avatar mới nhất
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
 * React hook tự động lắng nghe và cập nhật avatar theo thời gian thực
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
    // Cập nhật giá trị ngay khi props thay đổi
    const cur = avatarCache.get(userId, name, fallbackUrl);
    setAvatar(cur);

    // Đăng ký nhận thông báo khi có avatar mới từ server / background search
    const unsubscribe = avatarCache.subscribe(() => {
      const updated = avatarCache.get(userId, name, fallbackUrl);
      setAvatar((prev) => (prev !== updated ? updated : prev));
    });

    return unsubscribe;
  }, [userId, name, fallbackUrl]);

  return avatar;
}
