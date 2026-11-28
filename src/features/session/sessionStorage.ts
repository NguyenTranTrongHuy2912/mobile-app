/**
 * sessionStorage.ts
 * Lưu phiên đăng nhập an toàn:
 *  - token  -> expo-secure-store (Keychain / Keystore, được mã hóa)
 *  - hồ sơ  -> AsyncStorage (không nhạy cảm: userId, tên, avatar, role)
 * Trên web (không có SecureStore) token rơi về AsyncStorage.
 * Tự động chuyển dữ liệu cũ (token nằm trong AsyncStorage 'chat_session') sang cách lưu mới.
 *
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../../api/authApi';

export const SESSION_KEY = 'chat_session'; // giữ tên cũ để code đang import SESSION_KEY không vỡ
const TOKEN_KEY = 'chat_session_token';

const useSecure = Platform.OS !== 'web';

async function writeToken(token: string) {
  if (useSecure) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await AsyncStorage.setItem(TOKEN_KEY, token);
}

async function readToken(): Promise<string> {
  const t = useSecure
    ? await SecureStore.getItemAsync(TOKEN_KEY)
    : await AsyncStorage.getItem(TOKEN_KEY);
  return t ?? '';
}

async function deleteToken() {
  if (useSecure) await SecureStore.deleteItemAsync(TOKEN_KEY);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

/** Lưu phiên. Ném lỗi nếu không lưu được token (để UI biết, không nuốt lỗi). */
export async function saveSession(user: AuthUser): Promise<void> {
  const { token, ...profile } = user;
  await writeToken(token);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}

/** Đọc phiên đã lưu. Trả null nếu chưa đăng nhập. */
export async function loadSession(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<AuthUser>;

    let token = await readToken();

    // Di chuyển dữ liệu cũ: token từng nằm trong cùng JSON ở AsyncStorage
    if (!token && typeof stored.token === 'string' && stored.token) {
      token = stored.token;
      await writeToken(token);
      const { token: _drop, ...profile } = stored;
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    }

    if (!token || !stored.userId) return null;
    return { ...(stored as AuthUser), token };
  } catch {
    return null;
  }
}

/** Cập nhật phần hồ sơ (không đụng token), an toàn khi gọi nhiều lần. */
export async function patchSessionProfile(patch: { displayName?: string; avatarUrl?: string }) {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return;
  const profile = JSON.parse(raw);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...profile, ...patch }));
}

export async function clearSession(): Promise<void> {
  await Promise.allSettled([AsyncStorage.removeItem(SESSION_KEY), deleteToken()]);
}
