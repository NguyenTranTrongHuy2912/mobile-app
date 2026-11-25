/**
 * CallModal.tsx
 * Component điều phối chính cho cuộc gọi thoại và video WebRTC trong ứng dụng
 * Tách biệt hoàn toàn logic (useCallController) và giao diện thành các thành phần chuyên biệt
 */
import React from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useCallController } from '../../features/call/useCallController';
import { formatCallDuration } from '../../features/call/callEngine';
import { CallHeader } from './CallHeader';
import { AudioCallView } from './AudioCallView';
import { GroupCallView } from './GroupCallView';
import { CallControls } from './CallControls';
import { CallWebViewEngine } from './CallWebViewEngine';

export default function CallModal() {
  const c = useCallController();

  if (c.call.status === 'IDLE') return null;

  const isFullVideo = c.isVideo && c.isConnected && !c.call.isVideoOff && !c.isGroup;

  return (
    <Modal visible={true} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={styles.container}>
        {/* Động cơ đàm thoại âm thanh & video WebRTC */}
        <CallWebViewEngine
          webViewRef={c.webViewRef}
          jitsiUrl={c.jitsiEmbeddedUrl}
          isVideo={c.isVideo}
          isVideoOff={c.call.isVideoOff}
          isGroup={c.isGroup}
          isConnected={c.isConnected}
        />

        {/* Lớp hiển thị UI phủ lên trên (pointerEvents="box-none" khi đang xem video) */}
        <SafeAreaView
          style={[styles.safeArea, isFullVideo && styles.safeAreaOverlay]}
          pointerEvents="box-none"
        >
          <CallHeader isGroup={c.isGroup} isVideo={c.isVideo} />

          {/* Nội dung trung tâm */}
          {c.isGroup ? (
            <GroupCallView
              displayName={c.displayName}
              isCalling={c.isCalling}
              isConnected={c.isConnected}
              durationSeconds={c.call.durationSeconds}
              participants={c.call.participants}
            />
          ) : !c.isVideo || !c.isConnected || c.call.isVideoOff ? (
            <AudioCallView
              displayName={c.displayName}
              displayAvatar={c.displayAvatar}
              isCalling={c.isCalling}
              isIncoming={c.isIncoming}
              isConnected={c.isConnected}
              isEnded={c.isEnded}
              isVideo={c.isVideo}
              endReason={c.call.endReason}
              durationSeconds={c.call.durationSeconds}
              pulseAnim={c.pulseAnim}
              pulseOpacity={c.pulseOpacity}
            />
          ) : (
            <View style={styles.videoTimerWrap}>
              <Text style={styles.videoCallerName}>{c.displayName}</Text>
              <Text style={styles.videoTimerText}>
                {formatCallDuration(c.call.durationSeconds)}
              </Text>
            </View>
          )}

          {/* Bộ nút điều khiển cuộc gọi */}
          <CallControls
            isIncoming={c.isIncoming}
            isCalling={c.isCalling}
            isConnected={c.isConnected}
            isVideo={c.isVideo}
            isMuted={c.call.isMuted}
            isSpeakerOn={c.call.isSpeakerOn}
            isVideoOff={c.call.isVideoOff}
            onAccept={c.handleAccept}
            onDecline={c.handleDecline}
            onEndCall={c.handleEndCall}
            onToggleMute={c.handleToggleMute}
            onToggleVideo={c.handleToggleVideo}
            onToggleCamera={c.handleToggleCamera}
            onToggleSpeaker={c.handleToggleSpeaker}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F141C',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  safeAreaOverlay: {
    backgroundColor: 'transparent',
  },
  videoTimerWrap: {
    alignItems: 'center',
    paddingTop: 12,
  },
  videoCallerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  videoTimerText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginTop: 4,
  },
});
