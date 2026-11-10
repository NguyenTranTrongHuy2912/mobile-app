import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, YStack } from 'tamagui';
import AppLogo from '../components/AppLogo';
import AuthButton from '../components/AuthButton';
import { useAuthColors } from '../components/AuthScreenLayout';

export default function WelcomeScreen() {
  const router = useRouter();
  const c = useAuthColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <YStack style={{ flex: 1, paddingHorizontal: 24, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        <YStack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppLogo size={112} />
          <Text
            style={{
              fontSize: 26,
              fontWeight: '700',
              textAlign: 'center',
              marginTop: 32,
              color: c.ink
            }}
          >
            Chào mừng bạn đến với ChatApp
          </Text>
          <Text
            style={{
              fontSize: 15,
              textAlign: 'center',
              marginTop: 12,
              color: c.muted
            }}
          >
            Nhắn tin và kết nối với bạn bè, người thân mọi lúc mọi nơi.
          </Text>
        </YStack>

        <YStack style={{ paddingBottom: 24 }}>
          <AuthButton title="Đăng nhập" onPress={() => router.push('/login')} />
          <YStack style={{ height: 12 }} />
          <AuthButton
            title="Tạo tài khoản mới"
            variant="outline"
            onPress={() => router.push('/register')}
          />
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
