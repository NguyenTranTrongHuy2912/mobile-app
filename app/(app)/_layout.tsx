import { Pressable, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAppDispatch } from '../../src/store/hooks';
import { logout } from '../../src/features/session/sessionSlice';
import { colors } from '../../src/theme';

export default function AppLayout() {
  const dispatch = useAppDispatch();
  return (
    <Stack>
      <Stack.Screen
        name="rooms"
        options={{
          title: 'Tin nhắn',
          headerRight: () => (
            <Pressable onPress={() => dispatch(logout())} hitSlop={8}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Đăng xuất</Text>
            </Pressable>
          ),
        }}
      />
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
