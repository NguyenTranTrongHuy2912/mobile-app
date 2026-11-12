import { Platform } from 'react-native';

// URL Backend API Gateway trên Render Cloud (mặc định luôn chạy mọi nơi, không cần chung Wi-Fi)
export const CLOUD_API_URL = 'https://api-gateway-66ws.onrender.com';

// IPv4 của máy tính host nếu muốn chạy local qua cùng mạng Wi-Fi
export const DEV_LAN_IP = '192.168.1.233';

// Thứ tự ưu tiên:
// 1. Biến môi trường EXPO_PUBLIC_API_URL
// 2. Mặc định Render Cloud URL
const defaultUrl = process.env.EXPO_PUBLIC_API_URL || CLOUD_API_URL;

let rawUrl = defaultUrl.trim().replace(/\/+$/, '');
if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

export const API_URL: string = rawUrl;
export const WS_URL: string = API_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
