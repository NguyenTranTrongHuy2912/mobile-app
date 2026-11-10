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
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError, register } from '../features/session/sessionSlice';
import { authApi } from '../api/authApi';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));
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
    // Backend yêu cầu mật khẩu 6 đến 64 ký tự, tên hiển thị tối đa 50 ký tự
    if (password.length < 6 || password.length > 64) {
      setLocalError('Mật khẩu cần từ 6 đến 64 ký tự.');
      return;
    }
    if (name.trim().length > 50) {
      setLocalError('Tên hiển thị tối đa 50 ký tự.');
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
      goBack();
    }
  };

  const message = localError ?? error;

  return (
    <AuthScreenLayout onBack={onBack}>
      {step === 'form' ? (
        <>
          <AuthTitle>Tạo tài khoản</AuthTitle>
          <AuthSubtitle>Nhanh chóng và miễn phí.</AuthSubtitle>

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

          <AuthError message={message} />

          <AuthButton title="Tiếp tục" onPress={onSubmitForm} loading={sending} />
        </>
      ) : (
        <>
          <AuthTitle>Xác thực email</AuthTitle>
          <AuthSubtitle>
            Chúng tôi đã gửi mã xác thực tới {account.trim()}. Kiểm tra cả mục thư rác.
          </AuthSubtitle>

          <AuthInput
            placeholder="Mã xác thực"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />

          <AuthError message={message} />

          <AuthButton title="Đăng ký" onPress={onConfirmOtp} loading={loading} />

          <AuthLink
            title={cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
            onPress={sendOtp}
            disabled={cooldown > 0 || sending}
          />
        </>
      )}

      <AuthLink title="Bạn đã có tài khoản rồi?" onPress={() => router.replace('/login')} />
    </AuthScreenLayout>
  );
}
