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
import { useRouter } from 'expo-router';
import AuthButton from '../components/AuthButton';
import AuthInput from '../components/AuthInput';
import { authApi } from '../api/authApi';
import { colors } from '../theme';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));
  const [step, setStep] = useState<Step>('email');
  const [account, setAccount] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Đếm ngược thời gian được phép gửi lại mã
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    setError(null);
    setSending(true);
    try {
      const info = await authApi.forgotPassword(account);
      setCooldown(info.resendAfterSeconds);
      setOtp('');
      setStep('reset');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được mã xác thực');
    } finally {
      setSending(false);
    }
  };

  const onSubmitEmail = () => {
    if (!account.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (!EMAIL_RE.test(account.trim())) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }
    sendOtp();
  };

  const onSubmitReset = async () => {
    if (!otp.trim()) {
      setError('Vui lòng nhập mã xác thực.');
      return;
    }
    if (password.length < 6 || password.length > 64) {
      setError('Mật khẩu cần từ 6 đến 64 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(account, otp, password);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không đổi được mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  const onBack = () => {
    if (step === 'reset') {
      setError(null);
      setStep('email');
    } else {
      goBack();
    }
  };

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

          {step === 'email' && (
            <>
              <Text style={styles.title}>Quên mật khẩu</Text>
              <Text style={styles.subtitle}>
                Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực để bạn đặt lại mật khẩu.
              </Text>

              <AuthInput
                placeholder="Email"
                value={account}
                onChangeText={setAccount}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <AuthButton title="Gửi mã xác thực" onPress={onSubmitEmail} loading={sending} />
            </>
          )}

          {step === 'reset' && (
            <>
              <Text style={styles.title}>Đặt lại mật khẩu</Text>
              <Text style={styles.subtitle}>
                Nếu {account.trim()} đã đăng ký, mã xác thực đã được gửi tới email này. Kiểm tra cả
                mục thư rác.
              </Text>

              <AuthInput
                placeholder="Mã xác thực"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
              />
              <AuthInput
                placeholder="Mật khẩu mới"
                value={password}
                onChangeText={setPassword}
                isPassword
              />
              <AuthInput
                placeholder="Nhập lại mật khẩu mới"
                value={confirm}
                onChangeText={setConfirm}
                isPassword
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <AuthButton title="Đổi mật khẩu" onPress={onSubmitReset} loading={submitting} />

              <Pressable
                style={styles.center}
                onPress={sendOtp}
                disabled={cooldown > 0 || sending}
              >
                <Text style={[styles.link, (cooldown > 0 || sending) && styles.disabled]}>
                  {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
                </Text>
              </Pressable>
            </>
          )}

          {step === 'done' && (
            <>
              <Text style={styles.title}>Đã đổi mật khẩu</Text>
              <Text style={styles.subtitle}>
                Bạn có thể đăng nhập bằng mật khẩu mới.
              </Text>
              <AuthButton title="Đăng nhập" onPress={() => router.replace('/login')} />
            </>
          )}

          {step !== 'done' && (
            <Pressable style={styles.center} onPress={() => router.replace('/login')}>
              <Text style={styles.link}>Quay lại đăng nhập</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1, paddingHorizontal: 24, paddingTop: 8,
    width: '100%', maxWidth: 480, alignSelf: 'center'
  },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16 },
  subtitle: { fontSize: 15, color: colors.subtext, marginTop: 4, marginBottom: 24 },
  error: { color: colors.error, fontSize: 14, marginBottom: 8 },
  center: { alignItems: 'center', marginTop: 24 },
  link: { color: colors.primary, fontSize: 15, fontWeight: '500' },
  disabled: { opacity: 0.5 },
});
