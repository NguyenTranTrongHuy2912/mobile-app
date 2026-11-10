import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';
import AppLogo from '../components/AppLogo';
import AuthButton from '../components/AuthButton';
import AuthInput from '../components/AuthInput';
import AuthScreenLayout, { AuthError, AuthLink, AuthTitle } from '../components/AuthScreenLayout';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError, login } from '../features/session/sessionSlice';

export default function LoginScreen() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.session);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = () => {
    if (!account.trim() || !password) {
      setLocalError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLocalError(null);
    dispatch(login({ account, password }));
  };

  return (
    <AuthScreenLayout onBack={goBack}>
      <YStack style={{ alignItems: 'center', marginTop: 16, marginBottom: 20 }}>
        <AppLogo size={72} />
      </YStack>
      <AuthTitle size={22} center marginTop={0} marginBottom={28}>
        Đăng nhập vào ChatApp
      </AuthTitle>

      <AuthInput
        placeholder="Email"
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

      <AuthError message={localError ?? error} />

      <YStack style={{ marginTop: 8 }}>
        <AuthButton title="Đăng nhập" onPress={onSubmit} loading={loading} />
      </YStack>

      <AuthLink title="Quên mật khẩu?" onPress={() => router.push('/forgot-password')} />

      <YStack style={{ flex: 1, justifyContent: 'flex-end', paddingTop: 32, paddingBottom: 16 }}>
        <AuthButton
          title="Tạo tài khoản mới"
          variant="outline"
          onPress={() => router.replace('/register')}
        />
      </YStack>
    </AuthScreenLayout>
  );
}