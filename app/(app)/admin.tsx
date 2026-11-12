import React from 'react';
import { Stack } from 'expo-router';
import AdminDashboardScreen from '../../src/screens/AdminDashboardScreen';

export default function AdminRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <AdminDashboardScreen />
    </>
  );
}
