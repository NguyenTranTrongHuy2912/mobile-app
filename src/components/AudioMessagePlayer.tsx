import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

interface AudioMessagePlayerProps {
  uri: string;
  durationMs?: number;
  isMine?: boolean;
}

export default function AudioMessagePlayer({
  uri,
  durationMs = 0,
  isMine = false,
}: AudioMessagePlayerProps) {
  const player = useAudioPlayer(uri ? { uri } : null);
  const status = useAudioPlayerStatus(player);

  const togglePlay = () => {
    try {
      if (status.playing) {
        player.pause();
      } else {
        if (status.currentTime >= status.duration && status.duration > 0) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (e) {
      console.warn('Cannot play audio message:', e);
    }
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentMs = (status.currentTime || 0) * 1000;
  const durMs = (status.duration || 0) * 1000 || durationMs;
  const progressPercent = durMs > 0 ? Math.min(100, (currentMs / durMs) * 100) : 0;

  return (
    <View style={[styles.container, isMine ? styles.containerMine : styles.containerOther]}>
      <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={6}>
        <Ionicons
          name={status.playing ? 'pause' : 'play'}
          size={20}
          color={isMine ? '#fff' : '#0084FF'}
        />
      </Pressable>

      <View style={styles.waveformWrap}>
        <View style={styles.trackBackground}>
          <View
            style={[
              styles.trackProgress,
              {
                width: `${progressPercent}%`,
                backgroundColor: isMine ? '#fff' : '#0084FF',
              },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.85)' }]}>
            {status.playing || currentMs > 0 ? formatMs(currentMs) : 'Tin nhắn thoại'}
          </Text>
          {durMs > 0 && (
            <Text style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.85)' }]}>
              {formatMs(durMs)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    minWidth: 200,
    maxWidth: 260,
  },
  containerMine: {
    backgroundColor: 'transparent',
  },
  containerOther: {
    backgroundColor: 'transparent',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  waveformWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  trackProgress: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
