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
 * Đăng ký nhận push token từ Expo Push Service
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    // Cấu hình notification channel cho Android
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('chat-messages', {
          name: 'Tin nhắn trò chuyện',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0084FF',
        });
      } catch (channelError) {
        console.warn('[Push] Error creating Android notification channel:', channelError);
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

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch (error) {
    console.warn('[Push] Error registering push notifications:', error);
    return null;
  }
}
