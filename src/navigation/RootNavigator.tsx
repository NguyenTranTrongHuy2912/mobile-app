import React from 'react';
import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RoomListScreen from '../screens/RoomListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../features/session/sessionSlice';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.session.isAuthenticated);

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
