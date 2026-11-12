import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleSound, toggleTheme } from '../features/theme/themeSlice';
import { logout } from '../features/session/sessionSlice';
import ScalePressable from '../components/ScalePressable';

/**
 * Màn hình Cài đặt ứng dụng
 * Đáp ứng tiêu chí "Theme Dark/Light" và "SettingsScreen" theo yêu cầu của Giảng viên.
 */
export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isDark = useAppSelector((s) => s.theme.isDark);
  const soundEnabled = useAppSelector((s) => s.theme.soundEnabled);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Nhóm Giao diện */}
      <Text style={styles.sectionHeader}>GIAO DIỆN & HIỂN THỊ</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: '#18191A' }]}>
            <Ionicons name="moon" size={18} color="#fff" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Chế độ nền tối (Dark Mode)</Text>
            <Text style={styles.rowSubtitle}>
              {isDark ? 'Đang bật nền đen Messenger' : 'Đang sử dụng nền sáng chuẩn'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={() => { dispatch(toggleTheme()); }}
            trackColor={{ false: '#E4E6EB', true: '#0084FF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 2. Nhóm Thông báo */}
      <Text style={styles.sectionHeader}>THÔNG BÁO & ÂM THANH</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: '#E7F3FF' }]}>
            <Ionicons name="volume-high" size={18} color="#0084FF" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Âm thanh thông báo</Text>
            <Text style={styles.rowSubtitle}>Phát chuông khi có tin nhắn hoặc lời mời mới</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={() => { dispatch(toggleSound()); }}
            trackColor={{ false: '#E4E6EB', true: '#0084FF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 3. Nhóm Tiện ích & AI */}
      <Text style={styles.sectionHeader}>TÍNH NĂNG NỔI BẬT</Text>
      <View style={styles.card}>
        <ScalePressable style={styles.pressableRow} onPress={() => router.push('/(app)/ai-assistant')}>
          <View style={[styles.iconWrap, { backgroundColor: '#F0F2F5' }]}>
            <Ionicons name="sparkles" size={18} color="#0084FF" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Trợ lý HQ AI</Text>
            <Text style={styles.rowSubtitle}>Trò chuyện và tóm tắt cuộc trò chuyện thông minh</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8A8D91" />
        </ScalePressable>
      </View>

      {/* 4. Thông tin Đồ án & Giảng viên */}
      <Text style={styles.sectionHeader}>THÔNG TIN ĐỒ ÁN</Text>
      <View style={styles.card}>
        <View style={[styles.infoRow, styles.rowBorder]}>
          <Text style={styles.infoLabel}>Tên đề tài</Text>
          <Text style={styles.infoValue}>Ứng dụng nhắn tin ChatApp thời gian thực</Text>
        </View>
        <View style={[styles.infoRow, styles.rowBorder]}>
          <Text style={styles.infoLabel}>Công nghệ</Text>
          <Text style={styles.infoValue}>FastAPI + Java gRPC + Expo SDK 58</Text>
        </View>
        <View style={[styles.infoRow, styles.rowBorder]}>
          <Text style={styles.infoLabel}>Trợ lý HQ AI</Text>
          <Text style={styles.infoValue}>Google Gemini 1.5 Flash</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phiên bản</Text>
          <Text style={styles.infoValue}>1.0.0 (Production)</Text>
        </View>
      </View>

      {/* Đăng xuất */}
      <View style={[styles.card, { marginTop: 24 }]}>
        <ScalePressable style={styles.pressableRow} onPress={handleLogout}>
          <View style={[styles.iconWrap, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="log-out-outline" size={18} color="#FA383E" />
          </View>
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </ScalePressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#65676B',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  pressableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#050505' },
  rowSubtitle: { fontSize: 12, color: '#65676B', marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E6EB',
  },
  infoLabel: { fontSize: 14, color: '#65676B' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#050505' },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#FA383E' },
});
