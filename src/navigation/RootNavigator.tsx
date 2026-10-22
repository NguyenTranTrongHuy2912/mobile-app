import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoomListScreen from '../screens/RoomListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="RoomList">
      <Stack.Screen name="RoomList" component={RoomListScreen} options={{ title: 'Tin nhắn' }} />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
