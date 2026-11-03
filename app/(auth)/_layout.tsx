import { Stack } from 'expo-router';

// Màn hình đầu tiên khi chưa đăng nhập
export const unstable_settings = { anchor: 'welcome' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
