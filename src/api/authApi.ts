// Đăng nhập/đăng ký giả lập vì gateway chưa có endpoint xác thực.
// Khi backend có, thay phần thân hai hàm bằng fetch tới
// `${API_URL}/api/v1/auth/login` và `/api/v1/auth/register`,
// rồi trả thêm `token` (JWT) để lưu vào session.

export interface AuthUser {
  userId: string;
  displayName: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Biến email/số điện thoại thành userId ổn định, vd "An@gmail.com" -> "user_an_gmail_com"
const toUserId = (account: string) =>
  `user_${account.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

export const authApi = {
  async login(account: string, _password: string): Promise<AuthUser> {
    await wait(500);
    return { userId: toUserId(account), displayName: account.trim() };
  },

  async register(name: string, account: string, _password: string): Promise<AuthUser> {
    await wait(500);
    return { userId: toUserId(account), displayName: name.trim() };
  },
};
