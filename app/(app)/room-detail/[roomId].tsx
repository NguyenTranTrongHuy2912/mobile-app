import React from 'react';
import { Stack } from 'expo-router';
import RoomDetailScreen from '../../../src/screens/RoomDetailScreen';

export default function RoomDetailRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chi tiết phòng',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontSize: 17, fontWeight: '700', color: '#050505' },
        }}
      />
      <RoomDetailScreen />
    </>
  );
}
