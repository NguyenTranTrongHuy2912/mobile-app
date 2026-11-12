import { Platform } from 'react-native';

// IPv4 của máy tính host để thiết bị thật (Expo Go) kết nối qua cùng mạng Wi-Fi:
export const DEV_LAN_IP = '10.10.58.121';

// Thứ tự ưu tiên:
// 1. Biến môi trường EXPO_PUBLIC_API_URL (đặt trong file .env hoặc khi chạy expo start)
// 2. IP LAN máy tính: http://10.10.58.121:8000 (dành cho điện thoại thật Expo Go)
// 3. Android Emulator: 10.0.2.2 trỏ về máy host
// 4. iOS Simulator / Web: localhost
const defaultUrl = DEV_LAN_IP
  ? `http://${DEV_LAN_IP}:8000`
  : (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

let rawUrl = (process.env.EXPO_PUBLIC_API_URL || defaultUrl).trim().replace(/\/+$/, '');
if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `http://${rawUrl}`;
}

export const API_URL: string = rawUrl;
export const WS_URL: string = API_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
