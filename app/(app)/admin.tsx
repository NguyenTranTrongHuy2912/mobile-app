import React from 'react';
import { Stack } from 'expo-router';
import AdminDashboardScreen from '../../src/screens/AdminDashboardScreen';

export default function AdminRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Quản Trị Hệ Thống',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
        }}
      />
      <AdminDashboardScreen />
    </>
  );
}
