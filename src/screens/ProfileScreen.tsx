import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  useChangePasswordMutation,
  useGetUploadSignatureMutation,
  useUpdateProfileMutation,
} from '../api/chatApi';
import { uploadImage } from '../api/uploadApi';
import { logout, persistProfile } from '../features/session/sessionSlice';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { errorMessage } from '../utils/errorMessage';

function confirmLogout(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const w = globalThis as unknown as { confirm?: (message: string) => boolean };
    if (w.confirm?.('Bạn có chắc muốn đăng xuất?')) onConfirm();
    return;
  }
  Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const rawDisplayName = useAppSelector((s) => s.session.displayName);
  const displayName = (rawDisplayName ?? '').trim() || 'Người dùng';
  const avatarUrl = useAppSelector((s) => s.session.avatarUrl);
  const userId = useAppSelector((s) => s.session.userId) || 'Chưa xác định';
  const role = useAppSelector((s) => s.session.role) || 'USER';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // API Mutations
  const [getUploadSignature] = useGetUploadSignatureMutation();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

  // State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 1. Chọn và đổi Avatar (Upload Cloudinary)
  const handlePickAvatar = async () => {
    if (isUploadingAvatar || updatingProfile) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để đổi ảnh đại diện.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      setIsUploadingAvatar(true);

      const sig = await getUploadSignature().unwrap();
      const uploaded = await uploadImage(sig, {
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });

      await updateProfile({ avatarUrl: uploaded.url }).unwrap();
      dispatch(persistProfile({ avatarUrl: uploaded.url }));
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện thành công!');
    } catch (e) {
      Alert.alert('Lỗi', errorMessage(e, 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 2. Đổi tên hiển thị
  const handleOpenNameModal = () => {
    setNewName(rawDisplayName ?? '');
    setNameError(null);
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNameError('Tên hiển thị không được để trống.');
      return;
    }
    if (trimmed === displayName) {
      setShowNameModal(false);
      return;
    }
    try {
      await updateProfile({ displayName: trimmed }).unwrap();
      dispatch(persistProfile({ displayName: trimmed }));
      setShowNameModal(false);
      Alert.alert('Thành công', 'Đã cập nhật tên hiển thị!');
    } catch (e) {
      setNameError(errorMessage(e, 'Không thể cập nhật tên hiển thị.'));
    }
  };

  // 3. Đổi mật khẩu
  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu nhập lại không trùng khớp.');
      return;
    }
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', res.message || 'Đổi mật khẩu thành công!');
    } catch (e) {
      setPasswordError(errorMessage(e, 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ.'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile */}
      <View style={styles.menuHeaderCard}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          {/* Nút camera đổi ảnh đại diện */}
          <Pressable
            style={styles.cameraBadge}
            onPress={handlePickAvatar}
            disabled={isUploadingAvatar}
            hitSlop={6}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={14} color="#fff" />
            )}
          </Pressable>
        </View>

        <View style={styles.menuHeaderText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Pressable onPress={handleOpenNameModal} hitSlop={8} style={styles.editNameBtn}>
              <Ionicons name="pencil" size={15} color={C.brand} />
            </Pressable>
          </View>

          <View style={styles.subRow}>
            <Text style={styles.subtext} numberOfLines={1}>
              @{displayName.toLowerCase().replace(/\s+/g, '')}
            </Text>
            {role === 'ADMIN' && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={11} color="#fff" />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Danh sách chức năng chính */}
      <View style={styles.card}>
        {role === 'ADMIN' && (
          <Pressable
            style={[
              styles.row,
              styles.rowBorder,
              { backgroundColor: C.isDark ? 'rgba(79, 70, 229, 0.16)' : '#F0F5FF' },
            ]}
            onPress={() => router.push('/(app)/admin' as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#4F46E5' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: C.isDark ? '#818CF8' : '#4F46E5', fontWeight: '700' }]}>
                Bảng điều khiển Quản trị (Admin)
              </Text>
              <Text style={styles.rowSub}>Thống kê hệ thống, quản lý tài khoản & phân quyền</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.isDark ? '#818CF8' : '#4F46E5'} />
          </Pressable>
        )}

        <Pressable style={[styles.row, styles.rowBorder]} onPress={() => router.push('/(app)/settings')}>
          <View style={[styles.iconCircle, { backgroundColor: C.inputBg }]}>
            <Ionicons name="settings-outline" size={20} color={C.ink} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Cài đặt</Text>
            <Text style={styles.rowSub}>Giao diện tối, âm thanh & điều khoản</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </Pressable>

        <Pressable
          style={[styles.row, styles.rowBorder]}
          onPress={() => router.push('/(app)/(tabs)/notifications')}
        >
          <View style={[styles.iconCircle, { backgroundColor: C.inputBg }]}>
            <Ionicons name="people-outline" size={20} color={C.ink} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Lời mời kết bạn</Text>
            <Text style={styles.rowSub}>Xem và xác nhận kết nối mới</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </Pressable>

        <Pressable
          style={[styles.row, styles.rowBorder]}
          onPress={() => router.push('/(app)/ai-assistant')}
        >
          <View style={[styles.iconCircle, { backgroundColor: C.brandSoft }]}>
            <Ionicons name="sparkles-outline" size={20} color={C.brand} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Chat với AI</Text>
            <Text style={styles.rowSub}>Hỏi đáp thông minh cùng AI Assistant</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </Pressable>

        <Pressable style={styles.row} onPress={handleOpenPasswordModal}>
          <View style={[styles.iconCircle, { backgroundColor: C.inputBg }]}>
            <Ionicons name="key-outline" size={20} color={C.ink} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Đổi mật khẩu</Text>
            <Text style={styles.rowSub}>Bảo mật tài khoản của bạn</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.muted} />
        </Pressable>
      </View>

      {/* Nhóm Thông tin */}
      <Text style={styles.sectionHeader}>THÔNG TIN</Text>
      <View style={styles.card}>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={[styles.iconCircle, { backgroundColor: C.inputBg }]}>
            <Ionicons name="id-card-outline" size={20} color={C.muted} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Mã người dùng</Text>
            <Text style={styles.rowSub} numberOfLines={1}>
              {userId}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: C.inputBg }]}>
            <Ionicons name="information-circle-outline" size={20} color={C.muted} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Phiên bản ứng dụng</Text>
            <Text style={styles.rowSub}>{version}</Text>
          </View>
        </View>
      </View>

      {/* Đăng xuất */}
      <View style={[styles.card, { marginTop: 24 }]}>
        <Pressable
          style={styles.row}
          onPress={() => confirmLogout(() => dispatch(logout()))}
          accessibilityRole="button"
        >
          <View style={[styles.iconCircle, { backgroundColor: C.dangerSoft }]}>
            <Ionicons name="log-out-outline" size={20} color={C.danger} />
          </View>
          <Text style={[styles.rowLabel, styles.logout]}>Đăng xuất</Text>
        </Pressable>
      </View>

      {/* Modal Đổi tên hiển thị */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
  if (!updatingProfile) setShowNameModal(false);
}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi tên hiển thị</Text>
            <Text style={styles.modalDesc}>
              Tên này sẽ hiển thị cho bạn bè và trong các cuộc trò chuyện.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={(t) => {
                setNewName(t);
                setNameError(null);
              }}
              placeholder="Nhập tên mới..."
              placeholderTextColor={C.muted}
              autoFocus
              maxLength={50}
            />

            {nameError ? <Text style={styles.modalError}>{nameError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowNameModal(false)}
                disabled={updatingProfile}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleSaveName}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Lưu</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Đổi mật khẩu */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
  if (!changingPassword) setShowPasswordModal(false);
}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <Text style={styles.modalDesc}>
              Nhập mật khẩu hiện tại và mật khẩu mới của bạn.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={currentPassword}
              onChangeText={(t) => {
                setCurrentPassword(t);
                setPasswordError(null);
              }}
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor={C.muted}
              secureTextEntry
            />

            <TextInput
              style={[styles.modalInput, { marginTop: 10 }]}
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                setPasswordError(null);
              }}
              placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
              placeholderTextColor={C.muted}
              secureTextEntry
            />

            <TextInput
              style={[styles.modalInput, { marginTop: 10 }]}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setPasswordError(null);
              }}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={C.muted}
              secureTextEntry
            />

            {passwordError ? <Text style={styles.modalError}>{passwordError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowPasswordModal(false)}
                disabled={changingPassword}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleSavePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Đổi mật khẩu</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.screen },
    content: { padding: 16, width: '100%', maxWidth: 500, alignSelf: 'center', paddingBottom: 40 },
    menuHeaderCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: C.isDark ? 0.2 : 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
    menuHeaderText: {
      flex: 1,
      marginLeft: 14,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editNameBtn: {
      padding: 4,
      borderRadius: 12,
      backgroundColor: C.brandSoft,
    },
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    avatarContainer: { position: 'relative' },
    avatarPlaceholder: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: C.brand,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.card,
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    avatarImage: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 2,
      borderColor: C.card,
    },
    avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
    cameraBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.brand,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.card,
      elevation: 4,
    },
    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4F46E5',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 12,
      gap: 3,
    },
    adminBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    userBadge: {
      backgroundColor: C.inputBg,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.line,
    },
    userBadgeText: {
      color: C.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    name: { fontSize: 20, fontWeight: '700', color: C.ink, flexShrink: 1 },
    subtext: { fontSize: 13, color: C.muted },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: C.muted,
      marginLeft: 12,
      marginBottom: 6,
      marginTop: 18,
      letterSpacing: 0.5,
    },
    card: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '600', color: C.ink },
    rowSub: { fontSize: 13, color: C.muted, marginTop: 2 },
    logout: { color: C.danger, fontWeight: '600', flex: 1, marginLeft: 2 },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: C.card,
      borderRadius: 18,
      padding: 22,
      elevation: 8,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 6 },
    modalDesc: { fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 18 },
    modalInput: {
      backgroundColor: C.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: C.ink,
    },
    modalError: { color: C.danger, fontSize: 13, marginTop: 8 },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 20,
    },
    modalBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 10,
      minWidth: 80,
      alignItems: 'center',
    },
    modalBtnCancel: { backgroundColor: C.inputBg },
    modalBtnCancelText: { color: C.ink, fontWeight: '600', fontSize: 14 },
    modalBtnConfirm: { backgroundColor: C.brand },
    modalBtnConfirmText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  });