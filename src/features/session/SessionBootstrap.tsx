import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useAppDispatch } from '../../store/hooks';
import type { AuthUser } from '../../api/authApi';
import { SESSION_KEY, setUser, logout } from './sessionSlice';

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
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const user = JSON.parse(raw) as AuthUser;
          if (user?.userId && user?.token) {
            if (isTokenExpired(user.token)) {
              console.warn('[SessionBootstrap] Token đã hết hạn, xóa phiên cũ để đăng nhập lại');
              await AsyncStorage.removeItem(SESSION_KEY);
              dispatch(logout());
            } else {
              dispatch(setUser(user));
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
