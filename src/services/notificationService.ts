import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Cấu hình cách hiển thị thông báo khi app đang mở (Foreground)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('[Push] Error setting notification handler:', e);
}

/**
 * Đăng ký nhận push token từ Expo Push Service một cách an toàn, không ném exception
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    // Cấu hình notification channel cho Android an toàn
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Tin nhắn & Thông báo',
          importance: Notifications.AndroidImportance.HIGH,
        });
      } catch (channelError) {
        // Channel đã tồn tại hoặc môi trường dev
      }
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permission not granted');
      return null;
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      return tokenData?.data ?? null;
    } catch (tokenErr) {
      // Trong môi trường Expo Go không có EAS project ID
      console.log('[Push] getExpoPushTokenAsync dev note:', tokenErr);
      return null;
    }
  } catch (error) {
    console.log('[Push] Note during registerForPushNotificationsAsync:', error);
    return null;
  }
}

/**
 * Gửi thông báo đẩy cục bộ (Local Notification) ngay lập tức lên thanh thông báo của điện thoại.
 * Hoạt động hoàn hảo cả khi app đang chạy hoặc thu nhỏ (Background) mà không phụ thuộc remote server.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: data || {},
      },
      trigger: null, // Hiển thị ngay lập tức
    });
  } catch (e) {
    console.log('[Push] Show local notification note:', e);
  }
}
