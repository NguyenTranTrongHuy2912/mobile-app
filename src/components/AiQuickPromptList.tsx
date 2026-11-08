import React from 'react';
import { ScrollView, Text, View, XStack, YStack } from 'tamagui';

interface AiQuickPromptListProps {
  onSelectPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  { id: '1', title: '💡 Kiến trúc ChatApp', prompt: 'Hãy giải thích kiến trúc 3 tầng FastAPI + gRPC + React Native của ChatApp' },
  { id: '2', title: '💻 Code React Native', prompt: 'Chia sẻ các best practices khi tối ưu hiệu năng app React Native' },
  { id: '3', title: '🎉 Lời chúc sinh nhật', prompt: 'Viết cho tôi một lời chúc sinh nhật bạn bè hài hước và ý nghĩa' },
  { id: '4', title: '📝 Email xin nghỉ học', prompt: 'Soạn giúp tôi một mẫu email xin phép nghỉ ốm gửi thầy giáo' },
];

const SOFT_BG = '#E7F3FF';
const SOFT_BORDER = '#D0E6FF';
const SOFT_TEXT = '#0064D1';

export default function AiQuickPromptList({ onSelectPrompt }: AiQuickPromptListProps) {
  return (
    <YStack style={{ paddingVertical: 8 }}>
      <Text color="muted" fontSize={12} fontWeight="600" style={{ paddingHorizontal: 16, marginBottom: 6 }}>
        Gợi ý câu hỏi nhanh:
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack style={{ paddingHorizontal: 16, gap: 8 }}>
          {QUICK_PROMPTS.map((item) => (
            <View
              key={item.id}
              backgroundColor={SOFT_BG}
              borderColor={SOFT_BORDER}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 16,
                borderWidth: 1,
              }}
              scale={"1 press:0.96" as any}
              onPress={() => onSelectPrompt(item.prompt)}
              role="button"
            >
              <Text color={SOFT_TEXT} fontSize={13} fontWeight="600">
                {item.title}
              </Text>
            </View>
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
}