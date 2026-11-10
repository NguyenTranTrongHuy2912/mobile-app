import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, useTheme } from 'tamagui';

// Màu của theme dưới dạng chuỗi, cùng cách AuthInput / AuthButton đang dùng
export function useAuthColors() {
  const theme = useTheme();
  return {
    background: theme.background.get() as string,
    ink: theme.ink.get() as string,
    muted: theme.muted.get() as string,
    brand: theme.brand.get() as string,
    danger: theme.danger.get() as string,
  };
}

interface LayoutProps {
  onBack: () => void;
  children: React.ReactNode;
}

// Khung chung của các màn hình đăng nhập: vùng an toàn, bàn phím, cuộn, nút quay lại
export default function AuthScreenLayout({ onBack, children }: LayoutProps) {
  const c = useAuthColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 8,
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={{ width: 40, height: 40, justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={26} color={c.ink} />
          </Pressable>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthTitle({
  children,
  size = 24,
  center = false,
  marginTop = 16,
  marginBottom = 0,
}: {
  children: React.ReactNode;
  size?: number;
  center?: boolean;
  marginTop?: number;
  marginBottom?: number;
}) {
  const c = useAuthColors();
  return (
    <Text
      style={{
        fontSize: size,
        fontWeight: '700',
        textAlign: center ? 'center' : 'left',
        marginTop: marginTop,
        marginBottom: marginBottom,
        color: c.ink,
      }}
    >
      {children}
    </Text>
  );
}

export function AuthSubtitle({ children }: { children: React.ReactNode }) {
  const c = useAuthColors();
  return (
    <Text 
      style={{ 
        fontSize: 15, 
        marginTop: 4, 
        marginBottom: 24, 
        color: c.muted 
      }}
    >
      {children}
    </Text>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  const c = useAuthColors();
  if (!message) return null;
  return (
    <Text 
      style={{ 
        fontSize: 14, 
        marginBottom: 8, 
        color: c.danger 
      }}
    >
      {message}
    </Text>
  );
}

export function AuthLink({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useAuthColors();
  return (
    <Text
      onPress={disabled ? undefined : onPress}
      style={{
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 24,
        opacity: disabled ? 0.5 : 1,
        color: c.brand,
      }}
    >
      {title}
    </Text>
  );
}