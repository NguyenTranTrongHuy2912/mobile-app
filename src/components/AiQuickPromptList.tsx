import React from 'react';
import { ScrollView, Text, View, XStack, YStack } from 'tamagui';

interface AiQuickPromptListProps {
  onSelectPrompt: (prompt: string) => void;
}

const QUICK_PROMPTS = [
  { id: '1', title: '💡 Ý tưởng đồ án', prompt: 'Gợi ý cho mình 5 ý tưởng làm đồ án tốt nghiệp ngành CNTT mang tính ứng dụng thực tế cao' },
  { id: '2', title: '🥗 Lên thực đơn tuần', prompt: 'Gợi ý thực đơn các món ăn ngon, lành mạnh và dễ nấu cho cả tuần' },
  { id: '3', title: '🎉 Lời chúc sinh nhật', prompt: 'Viết cho mình một lời chúc sinh nhật bạn thân vừa hài hước vừa ý nghĩa' },
  { id: '4', title: '🧮 Tính tiền & Chia bill', prompt: 'Tính 15% của 2.500.000đ và chia đều cho 4 người' },
  { id: '5', title: '✈️ Kế hoạch du lịch', prompt: 'Lên lịch trình du lịch Đà Lạt 3 ngày 2 đêm tiết kiệm và khám phá nhiều cảnh đẹp' },
  { id: '6', title: '📝 Soạn tin xin phép', prompt: 'Soạn giúp mình một tin nhắn xin phép nghỉ học/nghỉ làm lịch sự và ngắn gọn gửi giáo viên hoặc sếp' },
  { id: '7', title: '🌌 Khoa học đời sống', prompt: 'Giải thích tại sao bầu trời có màu xanh lam theo cách dễ hiểu nhất' },
  { id: '8', title: '🌐 Dịch thuật tự nhiên', prompt: 'Dịch sang tiếng Anh tự nhiên: Cảm ơn bạn rất nhiều vì đã luôn đồng hành và hỗ trợ tôi' },
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
