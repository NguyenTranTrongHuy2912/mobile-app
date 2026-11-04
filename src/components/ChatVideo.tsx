import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { Message } from '../types/chat';

interface Props {
  message: Message;
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return 'Video';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function ChatVideo({ message }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const videoUri = message.videoUrl || message.localUri || '';

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
  });

  if (!videoUri) {
    return (
      <View style={styles.placeholderContainer}>
        <ActivityIndicator color="#0084FF" />
        <Text style={styles.placeholderText}>Đang tải video…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.thumbnailContainer} onPress={() => setFullscreen(true)}>
        <VideoView
          player={player}
          style={styles.previewVideo}
          contentFit="cover"
          nativeControls={false}
        />
        {/* Lớp phủ nút Play và thời lượng Messenger style */}
        <View style={styles.overlay}>
          <View style={styles.playButtonCircle}>
            <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
          </View>
          <View style={styles.durationBadge}>
            <Ionicons name="videocam" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.durationText}>
              {formatDuration(message.videoDurationMs)}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Modal xem video toàn màn hình */}
      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={styles.fullscreenModal}>
          <Pressable style={styles.closeBtn} onPress={() => setFullscreen(false)} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <VideoView
            player={player}
            style={styles.fullscreenVideo}
            allowsPictureInPicture
            nativeControls
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 220,
    height: 160,
    backgroundColor: '#000',
  },
  thumbnailContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  placeholderContainer: {
    width: 200,
    height: 140,
    backgroundColor: '#E4E6EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#65676B',
    marginTop: 6,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '80%',
  },
});
