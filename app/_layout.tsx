import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { store } from '../src/store';
import { tamaguiConfig } from '../tamagui.config';
import SessionBootstrap from '../src/features/session/SessionBootstrap';
import { chatApi } from '../src/api/chatApi';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';

// Tách riêng vì useAppSelector phải nằm bên trong <Provider>
function Routes() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.session.isAuthenticated);

  // Khi đăng xuất, xóa cache API để người đăng nhập sau không thấy dữ liệu của người trước.
  useEffect(() => {
    if (!isAuthenticated) dispatch(chatApi.util.resetApiState());
  }, [isAuthenticated, dispatch]);

  // Đổi isAuthenticated thì Expo Router tự chuyển nhóm; không cần router.replace sau login/logout.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Provider store={store}>
        <SafeAreaProvider>
          <SessionBootstrap>
            <Routes />
            <StatusBar style="auto" />
          </SessionBootstrap>
        </SafeAreaProvider>
      </Provider>
    </TamaguiProvider>
  );
}
