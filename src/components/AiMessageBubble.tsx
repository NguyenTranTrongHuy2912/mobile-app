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
 */
export default function AiMessageBubble({ content, isAi, modelName = 'Gemini 1.5 Flash' }: AiMessageBubbleProps) {
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
        <View style={styles.modelTag}>
          <Ionicons name="hardware-chip-outline" size={11} color="#65676B" style={{ marginRight: 3 }} />
          <Text style={styles.modelTagText}>{modelName}</Text>
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
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubbleAiWrap: {
    flex: 1,
  },
  bubbleAi: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '82%',
  },
  textAi: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 22,
  },
  textUser: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
  },
  modelTagText: {
    fontSize: 11,
    color: '#65676B',
    fontWeight: '500',
  },
});
