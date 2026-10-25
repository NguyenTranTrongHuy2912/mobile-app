import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from './sessionSlice';

const KEY = 'chat_user_id';

// Mỗi thiết bị tự có một userId, lưu lại để lần sau mở app vẫn là người đó.
export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      let id: string | null = null;
      try {
        id = await AsyncStorage.getItem(KEY);
      } catch {}
      if (!id) {
        id = `user_${Math.random().toString(36).slice(2, 7)}`;
        try {
          await AsyncStorage.setItem(KEY, id);
        } catch {}
      }
      dispatch(setUser({ userId: id, displayName: id }));
      setReady(true);
    })();
  }, [dispatch]);

  return ready ? <>{children}</> : null;
}