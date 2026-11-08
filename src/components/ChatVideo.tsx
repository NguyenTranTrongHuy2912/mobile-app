import React, { useState } from 'react';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Spinner, Text, View, XStack, YStack } from 'tamagui';
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

const fillStyle = { width: '100%', height: '100%' } as const;
const fullscreenStyle = { width: '100%', height: '80%' } as const;

export default function ChatVideo({ message }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const videoUri = message.videoUrl || message.localUri || '';

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
  });

  if (!videoUri) {
    return (
      <YStack
        backgroundColor="surface"
        style={{
          width: 200,
          height: 140,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spinner color="brand" />
        <Text color="muted" fontSize={12} style={{ marginTop: 6 }}>
          Đang tải video…
        </Text>
      </YStack>
    );
  }

  return (
    <View backgroundColor="#000" style={{ borderRadius: 14, overflow: 'hidden', width: 220, height: 160 }}>
      <View
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => setFullscreen(true)}
        aria-label="Phát video"
      >
        <VideoView player={player} style={fillStyle} contentFit="cover" nativeControls={false} />
        
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.25)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <View
            style={{
               width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: 'rgba(0,0,0,0.65)',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.85)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
          </View>
          <XStack
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(0,0,0,0.7)',
              paddingVertical: 3,
              paddingHorizontal: 7,
              borderRadius: 10,
            }}
          >
            <Ionicons name="videocam" size={12} color="#fff" />
            <Text color="#fff" fontSize={11} fontWeight="600">
              {formatDuration(message.videoDurationMs)}
            </Text>
          </XStack>
        </View>
      </View>

      <Modal
        visible={fullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
      >
        <YStack backgroundColor="#000" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
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
            }}
            onPress={() => setFullscreen(false)}
            hitSlop={12}
            aria-label="Đóng"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </View>
          <VideoView
            player={player}
            style={fullscreenStyle}
            allowsPictureInPicture
            nativeControls
          />
        </YStack>
      </Modal>
    </View>
  );
}