import { Stack } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat/[roomId]"
        options={({ route }) => ({
          title: (route.params as { title?: string } | undefined)?.title ?? 'Chat',
        })}
      />
      <Stack.Screen name="new-chat" options={{ title: 'Chat mới' }} />
      <Stack.Screen name="new-group" options={{ title: 'Tạo nhóm' }} />
    </Stack>
  );
}
