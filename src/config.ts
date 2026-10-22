import { Platform } from 'react-native';

// Thứ tự ưu tiên:
// 1. Biến môi trường EXPO_PUBLIC_API_URL (đặt trong file .env hoặc khi chạy `expo start`)
// 2. Android Emulator: 10.0.2.2 trỏ về máy host
// 3. iOS Simulator / Web: localhost
// Điện thoại thật: đặt EXPO_PUBLIC_API_URL=http://<IP_LAN_CUA_MAY>:8000
//   và chạy gateway với --host 0.0.0.0
const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? defaultUrl;
