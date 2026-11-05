import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ScalePressable from './ScalePressable';

interface AiQuickPromptListProps {
  onSelectPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  { id: '1', title: '💡 Kiến trúc ChatApp', prompt: 'Hãy giải thích kiến trúc 3 tầng FastAPI + gRPC + React Native của ChatApp' },
  { id: '2', title: '💻 Code React Native', prompt: 'Chia sẻ các best practices khi tối ưu hiệu năng app React Native' },
  { id: '3', title: '🎉 Lời chúc sinh nhật', prompt: 'Viết cho tôi một lời chúc sinh nhật bạn bè hài hước và ý nghĩa' },
  { id: '4', title: '📝 Email xin nghỉ học', prompt: 'Soạn giúp tôi một mẫu email xin phép nghỉ ốm gửi thầy giáo' },
];

/**
 * Thanh gợi ý các câu hỏi nhanh cho Trợ lý AI
 */
export default function AiQuickPromptList({ onSelectPrompt }: AiQuickPromptListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Gợi ý câu hỏi nhanh:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {QUICK_PROMPTS.map((item) => (
          <ScalePressable
            key={item.id}
            style={styles.pill}
            onPress={() => onSelectPrompt(item.prompt)}
          >
            <Text style={styles.pillText}>{item.title}</Text>
          </ScalePressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#65676B',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    backgroundColor: '#E7F3FF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D0E6FF',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0064D1',
  },
});
