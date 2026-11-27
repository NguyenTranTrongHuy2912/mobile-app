/**
 * GroupCallView.tsx
 * Hiển thị giao diện cuộc gọi nhóm dạng lưới (grid) với các ô thành viên
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCallDuration } from '../../features/call/callEngine';

interface Participant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface GroupCallViewProps {
  displayName: string;
  isCalling: boolean;
  isConnected: boolean;
  durationSeconds: number;
  participants?: Participant[];
}

export function GroupCallView({
  displayName,
  isCalling,
  isConnected,
  durationSeconds,
  participants = [],
}: GroupCallViewProps) {
  return (
    <View style={styles.groupContainer}>
      <Text style={styles.groupTitle} numberOfLines={1}>
        {displayName}
      </Text>
      <Text style={styles.groupSubtitle}>
        {isCalling ? 'Đang gọi nhóm...' : isConnected ? formatCallDuration(durationSeconds) : ''}
      </Text>

      <View style={styles.groupGrid}>
        {participants.length > 0 ? (
          participants.map((m) => (
            <View key={m.userId} style={styles.groupMemberTile}>
              <View style={styles.groupAvatarCircle}>
                {m.avatarUrl ? (
                  <Image source={{ uri: m.avatarUrl }} style={styles.groupAvatarImg} />
                ) : (
                  <Text style={styles.groupAvatarInit}>
                    {m.displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.groupMemberName} numberOfLines={1}>
                {m.displayName}
              </Text>
              {m.isMuted && (
                <View style={styles.muteIndicator}>
                  <Ionicons name="mic-off" size={10} color="#fff" />
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.groupEmptyWrap}>
            <View style={styles.groupAvatarCircle}>
              <Ionicons name="people" size={28} color="#fff" />
            </View>
            <Text style={styles.groupEmptyText}>Đang kết nối các thành viên...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  groupTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  groupSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 20,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  groupMemberTile: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  groupAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  groupAvatarImg: {
    width: '100%',
    height: '100%',
  },
  groupAvatarInit: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  groupMemberName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  muteIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    padding: 4,
    borderRadius: 10,
  },
  groupEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  groupEmptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
  },
});
