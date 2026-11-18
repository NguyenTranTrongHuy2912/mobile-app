import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationMs);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const togglePlay = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPlaybackPos(status.positionMillis);
              if (status.durationMillis) {
                setTotalDuration(status.durationMillis);
              }
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPlaybackPos(0);
              }
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
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

  const progressPercent =
    totalDuration > 0 ? Math.min(100, (playbackPos / totalDuration) * 100) : 0;

  return (
    <View style={[styles.container, isMine ? styles.containerMine : styles.containerOther]}>
      <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={6}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
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
            {isPlaying || playbackPos > 0 ? formatMs(playbackPos) : 'Tin nhắn thoại'}
          </Text>
          {totalDuration > 0 && (
            <Text style={[styles.timeText, isMine && { color: 'rgba(255,255,255,0.85)' }]}>
              {formatMs(totalDuration)}
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
