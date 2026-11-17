import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Switch } from 'react-native';
import { Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleSound, toggleTheme } from '../features/theme/themeSlice';
import ScalePressable from '../components/ScalePressable';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const isDark = useAppSelector((s) => s.theme.isDark);
  const soundEnabled = useAppSelector((s) => s.theme.soundEnabled);
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

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
          <View style={{ ...styles.iconWrap, backgroundColor: C.isDark ? '#3A3B3C' : '#18191A' }}>
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
            onValueChange={() => {
              dispatch(toggleTheme());
            }}
            trackColor={{ false: C.line, true: C.brand }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 2. Nhóm Thông báo */}
      <Text style={styles.sectionHeader}>THÔNG BÁO & ÂM THANH</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ ...styles.iconWrap, backgroundColor: C.brandSoft }}>
            <Ionicons name="volume-high" size={18} color={C.brand} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Âm thanh thông báo</Text>
            <Text style={styles.rowSubtitle}>Phát chuông khi có tin nhắn hoặc lời mời mới</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={() => {
              dispatch(toggleSound());
            }}
            trackColor={{ false: C.line, true: C.brand }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 3. Thông tin Nền tảng HQ ChatApp */}
      <Text style={styles.sectionHeader}>VỀ CHÚNG TÔI</Text>
      <View style={styles.card}>
        <ScalePressable style={[styles.pressableRow, styles.rowBorder]} onPress={showPrivacyPolicy}>
          <View style={[styles.iconWrap, { backgroundColor: C.brandSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={C.brand} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Chính sách quyền riêng tư</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </ScalePressable>

        <ScalePressable style={styles.pressableRow} onPress={showTerms}>
          <View style={[styles.iconWrap, { backgroundColor: C.inputBg }]}>
            <Ionicons name="document-text-outline" size={18} color={C.ink} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Điều khoản dịch vụ</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </ScalePressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.screen },
    content: { padding: 16, paddingBottom: 40 },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: C.muted,
      marginTop: 16,
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: C.card,
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
    rowTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
    rowSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
  });