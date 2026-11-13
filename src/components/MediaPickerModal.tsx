import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'tamagui';
import ScalePressable from './ScalePressable';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';

interface MediaPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => void;
  onPickFolder: () => void;
  onTakePhoto: () => void;
}

/**
 * Modal lựa chọn nguồn tải ảnh chuẩn Messenger:
 * 1. Thư viện ảnh & Album thiết bị
 * 2. Duyệt tìm trong thư mục tệp máy (File Manager / Folders)
 * 3. Chụp ảnh nhanh từ Camera trước (Front Camera)
 */
export default function MediaPickerModal({
  visible,
  onClose,
  onPickGallery,
  onPickFolder,
  onTakePhoto,
}: MediaPickerModalProps) {
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  // Nền icon: sáng dùng màu pastel, tối dùng nền nhạt tối hơn
  const galleryBg = C.isDark ? C.brandSoft : '#E7F3FF';
  const folderBg = C.isDark ? C.brandSoft : '#EBF5FB';
  const cameraBg = C.isDark ? '#1E3A28' : '#E8F5E9';
  const galleryIcon = C.isDark ? '#4DA3FF' : '#0084FF';
  const folderIcon = C.isDark ? '#4DA3FF' : '#007AFF';
  const cameraIcon = C.isDark ? '#66BB6A' : '#2E7D32';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Giữ Pressable của RN cho lớp phủ + sheet: chạm vào sheet không được đóng modal */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header Bar */}
          <View style={styles.handle} />
          <Text style={styles.title}>Chọn hình ảnh & tệp</Text>
          <Text style={styles.subtitle}>Gửi hình ảnh hoặc duyệt tìm từ thư mục của bạn</Text>

          {/* Option 1: Thư viện ảnh / Album */}
          <ScalePressable
            style={styles.optionRow}
            onPress={() => {
              onClose();
              onPickGallery();
            }}
          >
            <View style={{ ...styles.iconWrap, backgroundColor: galleryBg }}>
              <Ionicons name="images" size={24} color={galleryIcon} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.optionTitle}>Thư viện ảnh & Album</Text>
              <Text style={styles.optionDesc}>Chọn ảnh hoặc video từ bộ sưu tập của thiết bị</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </ScalePressable>

          {/* Option 2: Duyệt thư mục tệp (Folder / Files) */}
          <ScalePressable
            style={styles.optionRow}
            onPress={() => {
              onClose();
              onPickFolder();
            }}
          >
            <View style={{ ...styles.iconWrap, backgroundColor: folderBg }}>
              <Ionicons name="folder-open" size={24} color={folderIcon} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.optionTitle}>Duyệt thư mục tệp máy (Folder)</Text>
              <Text style={styles.optionDesc}>Mở trình quản lý tệp để tìm ảnh từ các thư mục khác</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </ScalePressable>

          {/* Option 3: Camera trước (Selfie) */}
          <ScalePressable
            style={styles.optionRow}
            onPress={() => {
              onClose();
              onTakePhoto();
            }}
          >
            <View style={{ ...styles.iconWrap, backgroundColor: cameraBg }}>
              <Ionicons name="camera" size={24} color={cameraIcon} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.optionTitle}>Chụp ảnh Camera trước</Text>
              <Text style={styles.optionDesc}>Sử dụng camera trước trực tiếp từ máy để chụp ảnh</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </ScalePressable>

          {/* Close button */}
          <View style={styles.cancelBtn} onPress={onClose} role="button">
            <Text style={styles.cancelText}>Đóng</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: -3 },
      shadowRadius: 10,
      elevation: 10,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.isDark ? C.chip : '#CCD0D5',
      alignSelf: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: C.ink,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: C.muted,
      marginBottom: 16,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    textWrap: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: C.ink,
      marginBottom: 2,
    },
    optionDesc: {
      fontSize: 12,
      color: C.muted,
    },
    cancelBtn: {
      marginTop: 18,
      backgroundColor: C.inputBg,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: C.ink,
    },
  });
