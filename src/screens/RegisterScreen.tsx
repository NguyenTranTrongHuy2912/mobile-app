import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthButton from '../components/AuthButton';
import AuthInput from '../components/AuthInput';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError, register } from '../features/session/sessionSlice';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.session);
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = () => {
    if (!name.trim() || !account.trim() || !password) {
      setLocalError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setLocalError(null);
    dispatch(register({ name, account, password }));
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

          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Nhanh chóng và miễn phí.</Text>

          <AuthInput
            placeholder="Họ và tên"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
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
          <AuthInput
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChangeText={setConfirm}
            isPassword
          />

          {message ? <Text style={styles.error}>{message}</Text> : null}

          <AuthButton title="Đăng ký" onPress={onSubmit} loading={loading} />

          <Pressable style={styles.already} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Bạn đã có tài khoản rồi?</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16 },
  subtitle: { fontSize: 15, color: colors.subtext, marginTop: 4, marginBottom: 24 },
  error: { color: colors.error, fontSize: 14, marginBottom: 8 },
  already: { alignItems: 'center', marginTop: 24 },
  link: { color: colors.primary, fontSize: 15, fontWeight: '500' },
});
