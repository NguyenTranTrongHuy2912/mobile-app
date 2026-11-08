import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AiMessageBubbleProps {
  content: string;
  isAi: boolean;
  modelName?: string;
}

/**
 * Bubble hiển thị tin nhắn trong màn hình Trợ lý AI
 * Tinh gọn, chỉ tập trung vào nội dung tin nhắn, không hiển thị tag phiên bản thừa thãi.
 */
export default function AiMessageBubble({ content, isAi }: AiMessageBubbleProps) {
  if (!isAi) {
    return (
      <View style={[styles.container, styles.containerUser]}>
        <View style={styles.bubbleUser}>
          <Text style={styles.textUser}>{content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.containerAi]}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>
      <View style={styles.bubbleAiWrap}>
        <View style={styles.bubbleAi}>
          <Text style={styles.textAi}>{content}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 12,
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  containerAi: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '92%',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5', // Indigo hiện đại
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubbleAiWrap: {
    flex: 1,
  },
  bubbleAi: {
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textAi: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleUser: {
    backgroundColor: '#4F46E5', // Indigo
    borderRadius: 18,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  textUser: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
});
