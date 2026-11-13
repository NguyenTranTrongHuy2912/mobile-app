import { Stack } from 'expo-router';
import { useScreenColors } from '../../src/features/theme/useScreenColors';

export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout() {
  const C = useScreenColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.card },
        headerTintColor: C.ink,
        headerTitleStyle: { color: C.ink },
        contentStyle: { backgroundColor: C.screen },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat/[roomId]"
        options={({ route }) => ({
          title: (route.params as { title?: string } | undefined)?.title ?? 'Chat',
        })}
      />
      <Stack.Screen name="new-chat" options={{ title: 'Chat mới' }} />
      <Stack.Screen name="new-group" options={{ title: 'Tạo nhóm' }} />
      <Stack.Screen name="room-detail/[roomId]" options={{ title: 'Thông tin nhóm' }} />
      <Stack.Screen name="ai-assistant" options={{ title: 'HQ AI' }} />
      <Stack.Screen name="settings" options={{ title: 'Cài đặt' }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}
