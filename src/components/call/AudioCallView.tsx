/**
 * AudioCallView.tsx
 * Hiển thị giao diện avatar sóng âm, tên người gọi, thời lượng và trạng thái đàm thoại
 */
import React from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCallDuration } from '../../features/call/callEngine';

interface AudioCallViewProps {
  displayName: string;
  displayAvatar?: string;
  isCalling: boolean;
  isIncoming: boolean;
  isConnected: boolean;
  isEnded: boolean;
  isVideo: boolean;
  endReason?: string;
  durationSeconds: number;
  pulseAnim: Animated.Value;
  pulseOpacity: Animated.Value;
}

export function AudioCallView({
  displayName,
  displayAvatar,
  isCalling,
  isIncoming,
  isConnected,
  isEnded,
  isVideo,
  endReason,
  durationSeconds,
  pulseAnim,
  pulseOpacity,
}: AudioCallViewProps) {
  return (
    <View style={styles.centerArea}>
      <View style={styles.avatarWrapper}>
        {(isCalling || isConnected) && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
        )}
        <View style={styles.avatar}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>

      <Text style={styles.status}>
        {isIncoming
          ? `Cuộc gọi ${isVideo ? 'video' : 'thoại'} đến...`
          : isCalling
          ? 'Đang đổ chuông...'
          : isConnected
          ? formatCallDuration(durationSeconds)
          : isEnded
          ? endReason || 'Cuộc gọi kết thúc'
          : ''}
      </Text>

      {/* Huy hiệu thông báo chế độ đàm thoại trực tiếp trong app */}
      {isConnected && (
        <View style={styles.inAppCallBadge}>
          <Ionicons name="mic-outline" size={13} color="#22c55e" style={{ marginRight: 4 }} />
          <Text style={styles.inAppCallBadgeText}>Đàm thoại WebRTC trực tiếp trong ứng dụng</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3b82f6',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '700',
  },
  name: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  status: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  inAppCallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  inAppCallBadgeText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
});
