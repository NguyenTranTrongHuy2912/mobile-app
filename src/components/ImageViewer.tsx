import React from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  uri: string | null; // null = đóng
  onClose: () => void;
}

// Xem ảnh toàn màn hình; chạm vào nền hoặc nút đóng để thoát
export default function ImageViewer({ uri, onClose }: Props) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : null}
        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={30} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  image: { width: '100%', height: '100%', pointerEvents: 'none' },
  close: { position: 'absolute', right: 16, top: Platform.OS === 'ios' ? 56 : 24 },
});
