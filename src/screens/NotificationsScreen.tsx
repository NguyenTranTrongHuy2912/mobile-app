import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Chưa có nguồn thông báo nào; màn này sẽ hiển thị lời mời kết bạn và thông báo đẩy sau này.
export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="notifications-outline" size={56} color={colors.border} />
      <Text style={styles.title}>Chưa có thông báo</Text>
      <Text style={styles.subtitle}>Thông báo mới sẽ xuất hiện ở đây.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: colors.subtext, marginTop: 4, textAlign: 'center' },
});
