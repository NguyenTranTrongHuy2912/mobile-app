import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store/hooks';

// "/" luôn tồn tại (không nằm trong nhóm bị guard), chỉ làm nhiệm vụ chuyển hướng.
// Đăng xuất/đăng nhập xong, Router cũng quay về đây rồi chuyển đúng nhóm.
export default function Index() {
  const isAuthenticated = useAppSelector((s) => s.session.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/rooms' : '/welcome'} />;
}
