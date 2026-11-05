import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScalePressable from './ScalePressable';

interface FloatingAiButtonProps {
  mode?: 'pill' | 'circle';
  bottom?: number;
  right?: number;
}

/**
 * Nút nổi Trợ lý Meta AI chuẩn Facebook Messenger (Ảnh 1, Ảnh 2, Ảnh 3)
 * Cho phép người dùng chạm để mở ngay màn hình Trợ lý Meta AI (Gemini 1.5 Flash).
 */
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
      <ScalePressable
        style={[styles.circleBtn, { bottom, right }]}
        onPress={handlePress}
      >
        <View style={styles.iconCircleGradient}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </View>
      </ScalePressable>
    );
  }

  return (
    <ScalePressable
      style={[styles.pillBtn, { bottom, right }]}
      onPress={handlePress}
    >
      <View style={styles.iconPill}>
        <Ionicons name="sparkles" size={16} color="#fff" />
      </View>
      <Text style={styles.pillText}>Hỏi Meta AI</Text>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  pillBtn: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    zIndex: 99,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#050505',
  },
  circleBtn: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    zIndex: 99,
  },
  iconCircleGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
