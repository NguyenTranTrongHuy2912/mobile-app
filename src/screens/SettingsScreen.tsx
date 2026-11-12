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

  const showPrivacyPolicy = () => {
    Alert.alert(
      'Chính sách quyền riêng tư',
      'HQ ChatApp cam kết bảo vệ dữ liệu cá nhân của bạn theo chuẩn mã hóa đường truyền an toàn (TLS 1.3) và bộ lọc bảo vệ quyền riêng tư PII. Tin nhắn của bạn luôn được bảo mật tuyệt đối.',
      [{ text: 'Đã hiểu' }]
    );
  };

  const showTerms = () => {
    Alert.alert(
      'Điều khoản dịch vụ',
      'Chào mừng bạn đến với HQ ChatApp. Việc sử dụng dịch vụ đồng nghĩa bạn tuân thủ các quy tắc ứng xử văn minh, tôn trọng bản quyền và không phát tán nội dung độc hại.',
      [{ text: 'Đã hiểu' }]
    );
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
              {isDark ? 'Đang bật nền tối sang trọng' : 'Đang sử dụng nền sáng chuẩn'}
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
          <View style={[styles.iconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="sparkles" size={18} color="#4F46E5" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Trợ lý HQ AI</Text>
            <Text style={styles.rowSubtitle}>Trò chuyện, phân tích và tóm tắt cuộc trò chuyện thông minh</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8A8D91" />
        </ScalePressable>
      </View>

      {/* 4. Thông tin Nền tảng HQ ChatApp */}
      <Text style={styles.sectionHeader}>VỀ HQ CHATAPP</Text>
      <View style={styles.card}>
        <View style={[styles.infoRow, styles.rowBorder]}>
          <Text style={styles.infoLabel}>Nền tảng</Text>
          <Text style={styles.infoValue}>HQ ChatApp Messenger</Text>
        </View>
        <View style={[styles.infoRow, styles.rowBorder]}>
          <Text style={styles.infoLabel}>Trợ lý thông minh</Text>
          <Text style={styles.infoValue}>HQ AI Assistant Core</Text>
        </View>
        <View style={[styles.infoRow, styles.rowBorder]}>
          <Text style={styles.infoLabel}>Chuẩn bảo mật</Text>
          <Text style={styles.infoValue}>TLS 1.3 / PII Shield Protection</Text>
        </View>
        <View style={[styles.infoRow, styles.rowBorder]}>
          <Text style={styles.infoLabel}>Phiên bản</Text>
          <Text style={styles.infoValue}>2.4.0 (Enterprise Pro)</Text>
        </View>
        <ScalePressable style={[styles.pressableRow, styles.rowBorder]} onPress={showPrivacyPolicy}>
          <View style={[styles.iconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#0284C7" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Chính sách quyền riêng tư</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8A8D91" />
        </ScalePressable>
        <ScalePressable style={styles.pressableRow} onPress={showTerms}>
          <View style={[styles.iconWrap, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="document-text-outline" size={18} color="#4B5563" />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Điều khoản dịch vụ</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8A8D91" />
        </ScalePressable>
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
