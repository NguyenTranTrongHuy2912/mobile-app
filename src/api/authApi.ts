import axios from 'axios';
import { API_URL } from '../config';

export interface AuthUser {
  userId: string;
  displayName: string;
  token: string; // JWT do gateway cấp, dùng cho /chat/*
}

export interface OtpInfo {
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

// Gateway gọi Java qua gRPC (mặc định timeout 5s) và gửi mail nằm trong lệnh gọi đó,
// nên timeout phía app để rộng hơn.
const http = axios.create({ baseURL: `${API_URL}/api/v1`, timeout: 20000 });

// Gateway trả lỗi dạng { detail: string } (hoặc mảng nếu sai định dạng body, mã 422)
function toError(e: unknown, fallback: string): Error {
  if (axios.isAxiosError(e)) {
    if (!e.response) {
      return new Error('Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API.');
    }
    const detail = e.response.data?.detail;
    if (typeof detail === 'string' && detail) return new Error(detail);
    if (Array.isArray(detail)) return new Error('Dữ liệu nhập chưa hợp lệ.');
  }
  return new Error(fallback);
}

interface AuthResponse {
  token: string;
  user_id: string;
  display_name: string;
}

const toUser = (d: AuthResponse): AuthUser => ({
  userId: d.user_id,
  displayName: d.display_name,
  token: d.token,
});

export const authApi = {
  async requestOtp(account: string): Promise<OtpInfo> {
    try {
      const { data } = await http.post('/auth/request-otp', { account: account.trim() });
      return {
        expiresInSeconds: data.expires_in_seconds,
        resendAfterSeconds: data.resend_after_seconds,
      };
    } catch (e) {
      throw toError(e, 'Không gửi được mã xác thực');
    }
  },

  async register(
    name: string,
    account: string,
    password: string,
    otpCode: string,
  ): Promise<AuthUser> {
    try {
      const { data } = await http.post<AuthResponse>('/auth/register', {
        account: account.trim(),
        password,
        display_name: name.trim(),
        otp_code: otpCode.trim(),
      });
      return toUser(data);
    } catch (e) {
      throw toError(e, 'Đăng ký thất bại');
    }
  },

  async login(account: string, password: string): Promise<AuthUser> {
    try {
      const { data } = await http.post<AuthResponse>('/auth/login', {
        account: account.trim(),
        password,
      });
      return toUser(data);
    } catch (e) {
      throw toError(e, 'Đăng nhập thất bại');
    }
  },
};