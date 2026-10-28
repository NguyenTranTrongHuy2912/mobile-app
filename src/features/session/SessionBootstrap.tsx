import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch } from '../../store/hooks';
import type { AuthUser } from '../../api/authApi';
import { SESSION_KEY, setUser } from './sessionSlice';

// Mở app: nếu máy đã lưu phiên đăng nhập thì khôi phục, không thì để người dùng
// đi qua Welcome/Login. Chờ đọc xong mới render để không nháy màn hình đăng nhập.
export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const user = JSON.parse(raw) as AuthUser;
          if (user?.userId) dispatch(setUser(user));
        }
      } catch {}
      setReady(true);
    })();
  }, [dispatch]);

  return ready ? <>{children}</> : null;
}
