import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, XStack, YStack } from 'tamagui';

interface AiMessageBubbleProps {
  content: string;
  isAi: boolean;
  modelName?: string;
}

/**
 * Bubble hiển thị tin nhắn trong màn hình Trợ lý AI
 */
export default function AiMessageBubble({ content, isAi, modelName = 'Gemini 1.5 Flash' }: AiMessageBubbleProps) {
  if (!isAi) {
    return (
      <YStack style={{ marginVertical: 6, paddingHorizontal: 12, alignItems: 'flex-end' }}>
        <View
          backgroundColor="brand"
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomRightRadius: 4,
            maxWidth: '82%',
          }}
        >
          <Text color="#fff" fontSize={15} lineHeight="21px">
            {content}
          </Text>
        </View>
      </YStack>
    );
  }

  return (
    <XStack style={{ marginVertical: 6, paddingHorizontal: 12, alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '92%' }}>
      <View
        backgroundColor="brand"
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8,
          marginTop: 2,
        }}
      >
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>
      <YStack style={{ flexShrink: 1, flexGrow: 0, flexBasis: 'auto', alignItems: 'flex-start' }}>
        <View
          backgroundColor="surface"
          style={{
            flexGrow: 0,
            flexShrink: 1,
            flexBasis: 'auto',
            alignSelf: 'flex-start',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderTopLeftRadius: 4,
          }}
        >
          <Text color="ink" fontSize={15} lineHeight="22px">
            {content}
          </Text>
        </View>
        <XStack style={{ alignItems: 'center', marginTop: 4, marginLeft: 4 }}>
          <Ionicons name="hardware-chip-outline" size={11} color="#65676B" style={{ marginRight: 3 }} />
          <Text color="muted" fontSize={11} fontWeight="500">
            {modelName}
          </Text>
        </XStack>
      </YStack>
    </XStack>
  );
}
