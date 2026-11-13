import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme } from 'tamagui'; // Thêm import Theme
import { store } from '../src/store';
import { tamaguiConfig } from '../tamagui.config';
import SessionBootstrap from '../src/features/session/SessionBootstrap';
import CallModal from '../src/components/call/CallModal';
import { chatApi } from '../src/api/chatApi';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { useRealtime } from '../src/features/realtime/useRealtime';

LogBox.ignoreLogs([
  "The action 'ROUTE_NAMES_CHANGED'",
]);

function Routes() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.session.isAuthenticated);

  useRealtime();

  useEffect(() => {
    if (!isAuthenticated) dispatch(chatApi.util.resetApiState());
  }, [isAuthenticated, dispatch]);

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
  const themeName = isDark ? 'dark' : 'light';

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
      <Theme name={themeName}>
        <SafeAreaProvider>
          <SessionBootstrap>
            <Routes />
            <CallModal />
            <StatusBar style={isDark ? 'light' : 'dark'} />
          </SessionBootstrap>
        </SafeAreaProvider>
      </Theme>
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