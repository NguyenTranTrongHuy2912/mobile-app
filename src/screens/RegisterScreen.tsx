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
import { authApi } from '../api/authApi';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.session);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Đếm ngược thời gian được phép gửi lại mã
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    setLocalError(null);
    dispatch(clearError());
    setSending(true);
    try {
      const info = await authApi.requestOtp(account);
      setCooldown(info.resendAfterSeconds);
      setOtp('');
      setStep('otp');
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Không gửi được mã xác thực');
    } finally {
      setSending(false);
    }
  };

  const onSubmitForm = () => {
    if (!name.trim() || !account.trim() || !password) {
      setLocalError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!EMAIL_RE.test(account.trim())) {
      setLocalError('Vui lòng nhập email hợp lệ.');
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
    sendOtp();
  };

  const onConfirmOtp = () => {
    if (!otp.trim()) {
      setLocalError('Vui lòng nhập mã xác thực.');
      return;
    }
    setLocalError(null);
    dispatch(register({ name, account, password, otpCode: otp }));
  };

  const onBack = () => {
    if (step === 'otp') {
      setLocalError(null);
      dispatch(clearError());
      setStep('form');
    } else {
      navigation.goBack();
    }
  };

  const message = localError ?? error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </Pressable>

          {step === 'form' ? (
            <>
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>Nhanh chóng và miễn phí.</Text>

              <AuthInput
                placeholder="Họ và tên"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <AuthInput
                placeholder="Email"
                value={account}
                onChangeText={setAccount}
                keyboardType="email-address"
                autoCapitalize="none"
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

              <AuthButton title="Tiếp tục" onPress={onSubmitForm} loading={sending} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Xác thực email</Text>
              <Text style={styles.subtitle}>
                Chúng tôi đã gửi mã xác thực tới {account.trim()}. Kiểm tra cả mục thư rác.
              </Text>

              <AuthInput
                placeholder="Mã xác thực"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
              />

              {message ? <Text style={styles.error}>{message}</Text> : null}

              <AuthButton title="Đăng ký" onPress={onConfirmOtp} loading={loading} />

              <Pressable
                style={styles.already}
                onPress={sendOtp}
                disabled={cooldown > 0 || sending}
              >
                <Text style={[styles.link, (cooldown > 0 || sending) && styles.disabled]}>
                  {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
                </Text>
              </Pressable>
            </>
          )}

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
  disabled: { opacity: 0.5 },
});
