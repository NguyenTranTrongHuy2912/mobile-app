import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { thumbUrl } from '../utils/imageUrl';
import type { Message } from '../types/chat';

const WIDTH = 220;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 300;

interface Props {
  message: Message;
  onPress: () => void;
}

export default function ChatImage({ message, onPress }: Props) {
  const uri = message.imageUrl ? thumbUrl(message.imageUrl, 600) : message.localUri;
  if (!uri) return null;

  const ratio =
    message.imageWidth && message.imageHeight ? message.imageWidth / message.imageHeight : 1;
  const height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, WIDTH / ratio));
  const uploading = message.status === 'sending' && (message.uploadProgress ?? 100) < 100;

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.box, { width: WIDTH, height }]}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.percent}>{message.uploadProgress ?? 0}%</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#ddd' },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 6 },
});
