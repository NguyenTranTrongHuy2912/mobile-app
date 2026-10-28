import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppLogo from '../components/AppLogo';
import AuthButton from '../components/AuthButton';
import AuthInput from '../components/AuthInput';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError, login } from '../features/session/sessionSlice';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.session);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Xóa lỗi cũ của màn hình khác khi vừa mở màn hình này
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = () => {
    if (!account.trim() || !password) {
      setLocalError('Vui lòng nhập email/số điện thoại và mật khẩu.');
      return;
    }
    setLocalError(null);
    // Đăng nhập thành công thì isAuthenticated = true, RootNavigator tự chuyển sang RoomList
    dispatch(login({ account, password }));
  };

  const message = localError ?? error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </Pressable>

          <View style={styles.logo}>
            <AppLogo size={72} />
          </View>
          <Text style={styles.title}>Đăng nhập vào ChatApp</Text>

          <AuthInput
            placeholder="Email hoặc số điện thoại"
            value={account}
            onChangeText={setAccount}
            keyboardType="email-address"
          />
          <AuthInput
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <View style={styles.submit}>
            <AuthButton title="Đăng nhập" onPress={onSubmit} loading={loading} />
          </View>

          <Pressable style={styles.forgot}>
            <Text style={styles.link}>Quên mật khẩu?</Text>
          </Pressable>

          <View style={styles.footer}>
            <AuthButton
              title="Tạo tài khoản mới"
              variant="outline"
              onPress={() => navigation.navigate('Register')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  logo: { alignItems: 'center', marginTop: 16, marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 28,
  },
  error: { color: colors.error, fontSize: 14, marginBottom: 8 },
  submit: { marginTop: 8 },
  forgot: { alignItems: 'center', marginTop: 16 },
  link: { color: colors.primary, fontSize: 15, fontWeight: '500' },
  footer: { flex: 1, justifyContent: 'flex-end', paddingTop: 32, paddingBottom: 16 },
});
