import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RoomListScreen from '../screens/RoomListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import NewChatScreen from '../screens/NewChatScreen';
import NewGroupScreen from '../screens/NewGroupScreen';
import { chatApi } from '../api/chatApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../features/session/sessionSlice';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.session.isAuthenticated);

  // Khi đăng xuất, xóa cache API (phòng, tin nhắn) để người đăng nhập sau không thấy dữ liệu
  // của người trước. Effect chạy sau khi các màn hình đã gỡ và hủy đăng ký truy vấn, nên
  // việc reset không kích hoạt tải lại.
  useEffect(() => {
    if (!isAuthenticated) dispatch(chatApi.util.resetApiState());
  }, [isAuthenticated, dispatch]);

  // Đổi isAuthenticated thì React Navigation tự chuyển sang nhóm màn hình tương ứng,
  // không cần gọi navigation.navigate sau khi đăng nhập/đăng xuất.
  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="RoomList"
            component={RoomListScreen}
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
            name="ChatRoom"
            component={ChatRoomScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
          <Stack.Screen name="NewChat" component={NewChatScreen} options={{ title: 'Chat mới' }} />
          <Stack.Screen name="NewGroup" component={NewGroupScreen} options={{ title: 'Tạo nhóm' }} />
        </>
      ) : (
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
