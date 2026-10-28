import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLogo from '../components/AppLogo';
import AuthButton from '../components/AuthButton';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <AppLogo size={112} />
        <Text style={styles.title}>Chào mừng bạn đến với ChatApp</Text>
        <Text style={styles.subtitle}>
          Nhắn tin và kết nối với bạn bè, người thân mọi lúc mọi nơi.
        </Text>
      </View>

      <View style={styles.actions}>
        <AuthButton title="Đăng nhập" onPress={() => navigation.navigate('Login')} />
        <View style={styles.gap} />
        <AuthButton
          title="Tạo tài khoản mới"
          variant="outline"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: 32,
  },
  subtitle: {
    fontSize: 15,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  actions: { paddingBottom: 24 },
  gap: { height: 12 },
});
