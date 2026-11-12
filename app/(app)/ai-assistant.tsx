import React from 'react';
import { Stack } from 'expo-router';
import AiAssistantScreen from '../../src/screens/AiAssistantScreen';

export default function AiAssistantRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'HQ AI',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontSize: 18, fontWeight: '700', color: '#050505' },
        }}
      />
      <AiAssistantScreen />
    </>
  );
}
