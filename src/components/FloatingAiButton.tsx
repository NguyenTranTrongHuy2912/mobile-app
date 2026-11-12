import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View, XStack } from 'tamagui';

interface FloatingAiButtonProps {
  mode?: 'pill' | 'circle';
  bottom?: number;
  right?: number;
}

export default function FloatingAiButton({
  mode = 'pill',
  bottom = 20,
  right = 16,
}: FloatingAiButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push('/(app)/ai-assistant');
  };

  if (mode === 'circle') {
    return (
      <View
        backgroundColor="background"
        borderColor="line"
        style={{
          position: 'absolute',
          bottom: bottom,
          right: right,
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          zIndex: 99,
        }}
        scale={"1 press:0.94" as any}
        onPress={handlePress}
        role="button"
        aria-label="Hỏi HQ AI"
      >
        <View
          backgroundColor="brand"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={20} color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <XStack
      backgroundColor="background"
      borderColor="line"
      style={{
        position: 'absolute',
        bottom: bottom,
        right: right,
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
        zIndex: 99,
      }}
      scale={"1 press:0.96" as any}
      onPress={handlePress}
      role="button"
      aria-label="Hỏi HQ AI"
    >
      <View
        backgroundColor="brand"
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
        }}
      >
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>
      <Text color="ink" fontSize={14} fontWeight="700">
        Hỏi HQ AI
      </Text>
    </XStack>
  );
}