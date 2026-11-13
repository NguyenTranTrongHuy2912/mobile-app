import React from 'react';
import { Image, Modal, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'tamagui';

interface Props {
  uri: string | null; // null = đóng
  onClose: () => void;
}

// Xem ảnh toàn màn hình; chạm vào nền hoặc nút đóng để thoát.
// Nền luôn đen (giống mọi trình xem ảnh) nên không cần đổi theo Dark Mode.
export default function ImageViewer({ uri, onClose }: Props) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={StyleSheet.absoluteFill} onPress={onClose} role="button" aria-label="Đóng" />
        {uri ? <Image source={{ uri }} style={styles.image} resizeMode="contain" /> : null}
        <View style={styles.close} onPress={onClose} role="button" aria-label="Đóng">
          <Ionicons name="close" size={30} color="#fff" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  image: { width: '100%', height: '100%', pointerEvents: 'none' },
  close: { position: 'absolute', right: 16, top: Platform.OS === 'ios' ? 56 : 24, padding: 12 },
});
