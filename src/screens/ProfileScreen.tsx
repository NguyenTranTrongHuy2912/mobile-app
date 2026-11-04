import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../features/session/sessionSlice';
import { colors } from '../theme';

// Alert.alert nhiều nút không chạy trên web nên dùng confirm của trình duyệt
function confirmLogout(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const w = globalThis as unknown as { confirm?: (message: string) => boolean };
    if (w.confirm?.('Bạn có chắc muốn đăng xuất?')) onConfirm();
    return;
  }
  Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const displayName = useAppSelector((s) => s.session.displayName);
  const version = Constants.expoConfig?.version;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
      </View>

      <View style={styles.card}>
        {version ? (
          <View style={[styles.row, styles.rowBorder]}>
            <Ionicons name="information-circle-outline" size={22} color={colors.subtext} />
            <Text style={styles.rowLabel}>Phiên bản</Text>
            <Text style={styles.rowValue}>{version}</Text>
          </View>
        ) : null}
        <Pressable
          style={styles.row}
          onPress={() => confirmLogout(() => dispatch(logout()))}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.rowLabel, styles.logout]}>Đăng xuất</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screen },
  content: { padding: 16, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  card: { backgroundColor: colors.background, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 12 },
  rowValue: { fontSize: 15, color: colors.subtext },
  logout: { color: colors.error, fontWeight: '600' },
});
