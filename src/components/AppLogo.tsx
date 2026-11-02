import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { YStack } from 'tamagui';
import { colors } from '../theme';

export default function AppLogo({ size = 96 }: { size?: number }) {
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor={colors.primary}
      alignItems="center"
      justifyContent="center"
    >
      <Ionicons name="chatbubble-ellipses" size={size * 0.56} color="#fff" />
    </YStack>
  );
}