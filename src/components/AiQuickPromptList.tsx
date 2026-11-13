import React from 'react';
import { ScrollView, Text, View, XStack, YStack } from 'tamagui';

interface AiQuickPromptListProps {
  onSelectPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  { id: '1', title: '🏛️ Kiến trúc 3 tầng ChatApp', prompt: 'Hãy giải thích kiến trúc 3 tầng FastAPI + gRPC + React Native của ChatApp' },
  { id: '2', title: '💻 Tối ưu React Native', prompt: 'Chia sẻ các best practices khi tối ưu hiệu năng app React Native và Redux' },
  { id: '3', title: '🧮 Tính toán & Chia tiền', prompt: 'Tính 15% của 2.500.000đ và chia đều cho 4 người' },
  { id: '4', title: '📝 Email xin nghỉ học', prompt: 'Soạn giúp tôi một mẫu email xin phép nghỉ ốm gửi Thầy/Cô giảng viên' },
  { id: '5', title: '🎉 Lời chúc sinh nhật', prompt: 'Viết cho tôi một lời chúc sinh nhật bạn bè hài hước và ý nghĩa' },
  { id: '6', title: '🌌 Khoa học: Bầu trời', prompt: 'Giải thích tại sao bầu trời có màu xanh lam theo cách dễ hiểu nhất' },
  { id: '7', title: '🇻🇳 Lịch sử: Bác Hồ', prompt: 'Bác Hồ sinh năm bao nhiêu và quê ở đâu?' },
  { id: '8', title: '🌐 Dịch thuật Anh - Việt', prompt: 'Dịch sang tiếng Anh tự nhiên: Cảm ơn bạn đã luôn đồng hành và hỗ trợ tôi' },
];

const SOFT_BG = '#EEF4FF';
const SOFT_BORDER = '#D6E4FF';
const SOFT_TEXT = '#005CE6';

export default function AiQuickPromptList({ onSelectPrompt }: AiQuickPromptListProps) {
  return (
    <YStack style={{ paddingVertical: 8 }}>
      <Text color="muted" fontSize={12} fontWeight="600" style={{ paddingHorizontal: 16, marginBottom: 6 }}>
        Gợi ý câu hỏi nhanh cho HQ AI:
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
