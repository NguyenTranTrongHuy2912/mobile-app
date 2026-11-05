import React from 'react';
import { Stack } from 'expo-router';
import SettingsScreen from '../../src/screens/SettingsScreen';

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cài đặt',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F0F2F5' },
          headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#050505' },
        }}
      />
      <SettingsScreen />
    </>
  );
}
