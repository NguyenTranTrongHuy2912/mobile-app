import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AuthButton from '../components/AuthButton';
import AuthInput from '../components/AuthInput';
import AuthScreenLayout, {
  AuthError,
  AuthLink,
  AuthSubtitle,
  AuthTitle,
} from '../components/AuthScreenLayout';
import { authApi } from '../api/authApi';

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
    <AuthScreenLayout onBack={onBack}>
      {step === 'email' && (
        <>
          <AuthTitle>Quên mật khẩu</AuthTitle>
          <AuthSubtitle>
            Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực để bạn đặt lại mật khẩu.
          </AuthSubtitle>

          <AuthInput
            placeholder="Email"
            value={account}
            onChangeText={setAccount}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AuthError message={error} />

          <AuthButton title="Gửi mã xác thực" onPress={onSubmitEmail} loading={sending} />
        </>
      )}

      {step === 'reset' && (
        <>
          <AuthTitle>Đặt lại mật khẩu</AuthTitle>
          <AuthSubtitle>
            Nếu {account.trim()} đã đăng ký, mã xác thực đã được gửi tới email này. Kiểm tra cả
            mục thư rác.
          </AuthSubtitle>

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

          <AuthError message={error} />

          <AuthButton title="Đổi mật khẩu" onPress={onSubmitReset} loading={submitting} />

          <AuthLink
            title={cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
            onPress={sendOtp}
            disabled={cooldown > 0 || sending}
          />
        </>
      )}

      {step === 'done' && (
        <>
          <AuthTitle>Đã đổi mật khẩu</AuthTitle>
          <AuthSubtitle>Bạn có thể đăng nhập bằng mật khẩu mới.</AuthSubtitle>
          <AuthButton title="Đăng nhập" onPress={() => router.replace('/login')} />
        </>
      )}

      {step !== 'done' && (
        <AuthLink title="Quay lại đăng nhập" onPress={() => router.replace('/login')} />
      )}
    </AuthScreenLayout>
  );
}
