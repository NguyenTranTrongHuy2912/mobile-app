import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store/hooks';

// "/" luôn tồn tại (không nằm trong nhóm bị guard), chỉ làm nhiệm vụ chuyển hướng.
// Đăng nhập tài khoản ADMIN -> tự động chuyển vào Admin Dashboard Portal
// Đăng nhập người dùng thường -> chuyển vào phòng chat
export default function Index() {
  const { isAuthenticated, role } = useAppSelector((s) => s.session);
  if (!isAuthenticated) return <Redirect href="/welcome" />;
  if (role === 'ADMIN') return <Redirect href="/admin" />;
  return <Redirect href="/rooms" />;
}
