/**
 * CallControls.tsx
 * Bộ nút điều khiển cuộc gọi: Trả lời / Từ chối (khi có chuông đến) hoặc Tắt mic / Loa / Camera / Cúp máy (khi đang gọi)
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallControlsProps {
  isIncoming: boolean;
  isCalling: boolean;
  isConnected: boolean;
  isVideo: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isVideoOff: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
}

export function CallControls({
  isIncoming,
  isCalling,
  isConnected,
  isVideo,
  isMuted,
  isSpeakerOn,
  isVideoOff,
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleCamera,
  onToggleSpeaker,
}: CallControlsProps) {
  if (isIncoming) {
    return (
      <View style={styles.incomingControls}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.declineBtn]}
          onPress={onDecline}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={32} color="#fff" />
          <Text style={styles.btnLabel}>Từ chối</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Ionicons name={isVideo ? 'videocam' : 'call'} size={32} color="#fff" />
          <Text style={styles.btnLabel}>Trả lời</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.inCallControlsWrapper}>
      {/* Hàng các nút tính năng: Mic, Loa, Video, Đổi camera */}
      <View style={styles.inCallSecondaryRow}>
        <TouchableOpacity
          style={[styles.roundControlBtn, isMuted && styles.controlBtnActive]}
          onPress={onToggleMute}
          activeOpacity={0.7}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
          <Text style={styles.controlBtnText}>{isMuted ? 'Bật mic' : 'Tắt mic'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roundControlBtn, isSpeakerOn && styles.controlBtnActive]}
          onPress={onToggleSpeaker}
          activeOpacity={0.7}
        >
          <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-medium'} size={24} color="#fff" />
          <Text style={styles.controlBtnText}>{isSpeakerOn ? 'Loa ngoài' : 'Loa trong'}</Text>
        </TouchableOpacity>

        {isVideo && (
          <>
            <TouchableOpacity
              style={[styles.roundControlBtn, isVideoOff && styles.controlBtnActive]}
              onPress={onToggleVideo}
              activeOpacity={0.7}
            >
              <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
              <Text style={styles.controlBtnText}>{isVideoOff ? 'Mở cam' : 'Tắt cam'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roundControlBtn}
              onPress={onToggleCamera}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-reverse" size={24} color="#fff" />
              <Text style={styles.controlBtnText}>Đổi chiều</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Nút Cúp máy / Hủy gọi to tròn màu đỏ ở giữa */}
      <View style={styles.hangupRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.hangupBtn]}
          onPress={onEndCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={32} color="#fff" style={styles.hangupIcon} />
        </TouchableOpacity>
        <Text style={styles.hangupLabel}>
          {isCalling ? 'Hủy cuộc gọi' : isConnected ? 'Kết thúc' : 'Đóng'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  inCallControlsWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 32,
  },
  inCallSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  roundControlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: '#ef4444',
  },
  controlBtnText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  hangupRow: {
    alignItems: 'center',
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  acceptBtn: {
    backgroundColor: '#22c55e',
  },
  declineBtn: {
    backgroundColor: '#ef4444',
  },
  hangupBtn: {
    backgroundColor: '#ef4444',
  },
  hangupIcon: {
    transform: [{ rotate: '135deg' }],
  },
  btnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  hangupLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});
