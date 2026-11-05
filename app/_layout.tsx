import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
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
import { useRealtime } from '../src/features/realtime/useRealtime';

// Bỏ qua cảnh báo phát triển nội bộ của Expo Router / React Navigation khi cập nhật danh sách route
LogBox.ignoreLogs([
  "The action 'ROUTE_NAMES_CHANGED'",
]);

// Tách riêng vì useAppSelector phải nằm bên trong <Provider>
function Routes() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.session.isAuthenticated);

  // Kích hoạt kết nối realtime WebSocket toàn ứng dụng
  useRealtime();

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

function InnerRoot() {
  const isDark = useAppSelector((s) => s.theme?.isDark ?? false);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={isDark ? 'dark' : 'light'}>
      <SafeAreaProvider>
        <SessionBootstrap>
          <Routes />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </SessionBootstrap>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <InnerRoot />
    </Provider>
  );
}
