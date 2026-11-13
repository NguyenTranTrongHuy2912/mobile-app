import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  acceptCall,
  incrementDuration,
  resetCall,
  setCallEnded,
  toggleCameraFacing,
  toggleMute,
  toggleSpeaker,
  toggleVideoOff,
} from '../../features/call/callSlice';
import { sendCallSignal } from '../../features/call/callSignalEmitter';
import { thumbUrl } from '../../utils/imageUrl';

const { width, height } = Dimensions.get('window');

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function CallModal() {
  const dispatch = useAppDispatch();
  const call = useAppSelector((s) => s.call);
  const currentUserId = useAppSelector((s) => s.session.userId);

  // Animation hiệu ứng sóng âm / nhịp đập avatar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  // Timer đếm giây cuộc gọi khi CONNECTED
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (call.status === 'CONNECTED') {
      timer = setInterval(() => {
        dispatch(incrementDuration());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [call.status, dispatch]);

  // Timeout tự ngắt nếu đổ chuông quá 45s không ai trả lời
  useEffect(() => {
    let ringTimeout: ReturnType<typeof setTimeout> | null = null;
    if (call.status === 'CALLING') {
      ringTimeout = setTimeout(() => {
        handleEndCall('timeout');
      }, 45000);
    }
    return () => {
      if (ringTimeout) clearTimeout(ringTimeout);
    };
  }, [call.status]);

  // Tự động đóng modal sau 1.5s khi ENDED
  useEffect(() => {
    let dismissTimeout: ReturnType<typeof setTimeout> | null = null;
    if (call.status === 'ENDED') {
      Vibration.cancel();
      dismissTimeout = setTimeout(() => {
        dispatch(resetCall());
      }, 1500);
    }
    return () => {
      if (dismissTimeout) clearTimeout(dismissTimeout);
    };
  }, [call.status, dispatch]);

  // Vòng lặp animation phát sóng khi đang đổ chuông / gọi
  useEffect(() => {
    if (call.status === 'CALLING' || call.status === 'INCOMING' || call.status === 'CONNECTED') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.25,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.6,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [call.status]);

  if (call.status === 'IDLE') return null;

  const isIncoming = call.status === 'INCOMING';
  const isCalling = call.status === 'CALLING';
  const isConnected = call.status === 'CONNECTED';
  const isEnded = call.status === 'ENDED';
  const isVideo = call.callType === 'video';

  // Xác định thông tin người hiển thị
  const isCaller = call.callerId === currentUserId;
  const displayName = isCaller
    ? call.receiverName || 'Người nhận'
    : call.callerName || 'Người gọi';
  const displayAvatar = isCaller ? call.receiverAvatar : call.callerAvatar;

  // Thao tác chấp nhận cuộc gọi
  const handleAccept = () => {
    Vibration.cancel();
    dispatch(acceptCall());
    sendCallSignal({
      type: 'CALL_ANSWER',
      call_id: call.callId,
      caller_id: call.callerId,
      accepted: true,
    });
  };

  // Thao tác từ chối cuộc gọi đến
  const handleDecline = () => {
    Vibration.cancel();
    dispatch(setCallEnded({ reason: 'Đã từ chối cuộc gọi' }));
    sendCallSignal({
      type: 'CALL_ANSWER',
      call_id: call.callId,
      caller_id: call.callerId,
      accepted: false,
    });
  };

  // Thao tác cúp máy / hủy cuộc gọi
  const handleEndCall = (reason = 'ended') => {
    Vibration.cancel();
    const otherUserId = isCaller ? call.receiverId : call.callerId;
    sendCallSignal({
      type: 'CALL_HANGUP',
      call_id: call.callId,
      target_id: otherUserId,
      room_id: call.roomId,
      call_type: call.callType,
      duration_seconds: call.durationSeconds,
      reason,
    });
    dispatch(
      setCallEnded({
        reason:
          reason === 'timeout'
            ? 'Người nhận không trả lời'
            : reason === 'declined'
            ? 'Cuộc gọi bị từ chối'
            : 'Cuộc gọi đã kết thúc',
      })
    );
  };

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Nền mô phỏng video nếu là Video Call và đã CONNECTED */}
        {isVideo && isConnected && !call.isVideoOff ? (
          <View style={styles.videoBackground}>
            <View style={styles.remoteVideoPlaceholder}>
              <Ionicons name="person" size={80} color="#4A5568" />
              <Text style={styles.remoteVideoText}>{displayName}</Text>
            </View>

            {/* Khung camera nhỏ của chính mình (Floating PIP) */}
            <View style={styles.localVideoPip}>
              <View style={styles.localPipContent}>
                <Ionicons name="videocam" size={24} color="#0084FF" />
                <Text style={styles.localPipText}>Bạn</Text>
              </View>
            </View>
          </View>
        ) : null}

        <SafeAreaView style={styles.safeArea}>
          {/* Header hiển thị loại cuộc gọi và bảo mật mã hóa */}
          <View style={styles.header}>
            <View style={styles.securityBadge}>
              <Ionicons name="lock-closed" size={13} color="#48BB78" />
              <Text style={styles.securityText}>Mã hóa đầu cuối</Text>
            </View>
            <Text style={styles.callTypeLabel}>
              {isVideo ? 'CUỘC GỌI VIDEO' : 'CUỘC GỌI THOẠI'}
            </Text>
          </View>

          {/* Phần giữa: Avatar, Tên và Trạng thái */}
          {(!isVideo || !isConnected || call.isVideoOff) && (
            <View style={styles.centerInfo}>
              <View style={styles.avatarWrapper}>
                {(isCalling || isIncoming || isConnected) && (
                  <Animated.View
                    style={[
                      styles.pulseCircle,
                      isIncoming && styles.pulseGreen,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  />
                )}
                <View style={styles.avatar}>
                  {displayAvatar ? (
                    <Animated.Image
                      source={{ uri: thumbUrl(displayAvatar, 300) }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.callerName} numberOfLines={1}>
                {displayName}
              </Text>

              <Text style={styles.statusText}>
                {isCalling
                  ? 'Đang đổ chuông...'
                  : isIncoming
                  ? isVideo
                    ? 'Đang gọi video cho bạn...'
                    : 'Cuộc gọi thoại đến...'
                  : isConnected
                  ? formatDuration(call.durationSeconds)
                  : isEnded
                  ? call.endReason || 'Cuộc gọi đã kết thúc'
                  : ''}
              </Text>
            </View>
          )}

          {/* Nếu đang trong Video Call đã kết nối: chỉ hiện thanh thời lượng phía trên */}
          {isVideo && isConnected && !call.isVideoOff && (
            <View style={styles.videoTimerWrap}>
              <Text style={styles.videoCallerName}>{displayName}</Text>
              <Text style={styles.videoTimerText}>
                {formatDuration(call.durationSeconds)}
              </Text>
            </View>
          )}

          {/* Thanh phím điều khiển phía dưới */}
          <View style={styles.bottomControls}>
            {isIncoming ? (
              /* Màn hình cuộc gọi đến: 2 nút Từ chối (Đỏ) và Trả lời (Xanh) */
              <View style={styles.incomingButtonsRow}>
                <View style={styles.actionCol}>
                  <Pressable
                    style={[styles.circleBtn, styles.btnDecline]}
                    onPress={handleDecline}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={32} color="#fff" />
                  </Pressable>
                  <Text style={styles.btnLabel}>Từ chối</Text>
                </View>

                <View style={styles.actionCol}>
                  <Pressable
                    style={[styles.circleBtn, styles.btnAccept]}
                    onPress={handleAccept}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={isVideo ? 'videocam' : 'call'}
                      size={30}
                      color="#fff"
                    />
                  </Pressable>
                  <Text style={styles.btnLabel}>Trả lời</Text>
                </View>
              </View>
            ) : isCalling ? (
              /* Màn hình đang gọi đi: Tắt mic, Loa ngoài, Nút Hủy (Đỏ) */
              <View style={styles.inCallButtonsRow}>
                <View style={styles.actionCol}>
                  <Pressable
                    style={[styles.circleBtn, call.isSpeakerOn && styles.btnActive]}
                    onPress={() => dispatch(toggleSpeaker())}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={call.isSpeakerOn ? 'volume-high' : 'volume-medium-outline'}
                      size={26}
                      color="#fff"
                    />
                  </Pressable>
                  <Text style={styles.btnLabel}>Loa ngoài</Text>
                </View>

                <View style={styles.actionCol}>
                  <Pressable
                    style={[styles.circleBtn, styles.btnHangup]}
                    onPress={() => handleEndCall('canceled')}
                    hitSlop={8}
                  >
                    <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                  </Pressable>
                  <Text style={styles.btnLabel}>Hủy</Text>
                </View>

                <View style={styles.actionCol}>
                  <Pressable
                    style={[styles.circleBtn, call.isMuted && styles.btnActive]}
                    onPress={() => dispatch(toggleMute())}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={call.isMuted ? 'mic-off' : 'mic-outline'}
                      size={26}
                      color="#fff"
                    />
                  </Pressable>
                  <Text style={styles.btnLabel}>Tắt tiếng</Text>
                </View>
              </View>
            ) : isConnected ? (
              /* Màn hình đang đàm thoại: Mic, Loa, Video On/Off, Đổi Cam, Nút Cúp máy (Đỏ) */
              <View style={styles.inCallButtonsGrid}>
                <View style={styles.controlsRow}>
                  {/* Bật/Tắt Mic */}
                  <View style={styles.actionCol}>
                    <Pressable
                      style={[styles.circleBtn, call.isMuted && styles.btnActive]}
                      onPress={() => dispatch(toggleMute())}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={call.isMuted ? 'mic-off' : 'mic'}
                        size={26}
                        color={call.isMuted ? '#000' : '#fff'}
                      />
                    </Pressable>
                    <Text style={styles.btnLabel}>{call.isMuted ? 'Bật mic' : 'Tắt mic'}</Text>
                  </View>

                  {/* Bật/Tắt Loa Ngoài */}
                  <View style={styles.actionCol}>
                    <Pressable
                      style={[styles.circleBtn, call.isSpeakerOn && styles.btnActive]}
                      onPress={() => dispatch(toggleSpeaker())}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={call.isSpeakerOn ? 'volume-high' : 'volume-medium'}
                        size={26}
                        color={call.isSpeakerOn ? '#000' : '#fff'}
                      />
                    </Pressable>
                    <Text style={styles.btnLabel}>{call.isSpeakerOn ? 'Loa ngoài' : 'Tai nghe'}</Text>
                  </View>

                  {/* Nếu là Video Call: Nút tắt/bật Camera */}
                  {isVideo && (
                    <View style={styles.actionCol}>
                      <Pressable
                        style={[styles.circleBtn, call.isVideoOff && styles.btnActive]}
                        onPress={() => dispatch(toggleVideoOff())}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={call.isVideoOff ? 'videocam-off' : 'videocam'}
                          size={26}
                          color={call.isVideoOff ? '#000' : '#fff'}
                        />
                      </Pressable>
                      <Text style={styles.btnLabel}>Camera</Text>
                    </View>
                  )}

                  {/* Đổi Camera trước/sau (chỉ hiện khi Video Call) */}
                  {isVideo && (
                    <View style={styles.actionCol}>
                      <Pressable
                        style={styles.circleBtn}
                        onPress={() => dispatch(toggleCameraFacing())}
                        hitSlop={8}
                      >
                        <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
                      </Pressable>
                      <Text style={styles.btnLabel}>Đổi chiều</Text>
                    </View>
                  )}
                </View>

                {/* Hàng nút cúp máy ở trung tâm */}
                <View style={[styles.controlsRow, { marginTop: 24, justifyContent: 'center' }]}>
                  <View style={styles.actionCol}>
                    <Pressable
                      style={[styles.circleBtn, styles.btnHangup, { width: 72, height: 72, borderRadius: 36 }]}
                      onPress={() => handleEndCall('ended')}
                      hitSlop={8}
                    >
                      <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                    </Pressable>
                    <Text style={styles.btnLabel}>Kết thúc</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
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
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 36 : 12,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  securityText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  callTypeLabel: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  centerInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 132, 255, 0.35)',
  },
  pulseGreen: {
    backgroundColor: 'rgba(72, 187, 120, 0.35)',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#2B6CB0',
    backgroundColor: '#1A202C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2B6CB0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
  },
  callerName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusText: {
    color: '#A0AEC0',
    fontSize: 16,
    fontWeight: '500',
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A202C',
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171923',
  },
  remoteVideoText: {
    color: '#718096',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  localVideoPip: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    right: 18,
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#2D3748',
    borderWidth: 2,
    borderColor: '#4A5568',
    overflow: 'hidden',
    zIndex: 10,
  },
  localPipContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D3748',
  },
  localPipText: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  videoTimerWrap: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 20,
    zIndex: 10,
  },
  videoCallerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoTimerText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
  },
  incomingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  inCallButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  inCallButtonsGrid: {
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionCol: {
    alignItems: 'center',
  },
  circleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnActive: {
    backgroundColor: '#fff',
  },
  btnAccept: {
    backgroundColor: '#38A169',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  btnDecline: {
    backgroundColor: '#E53E3E',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  btnHangup: {
    backgroundColor: '#E53E3E',
  },
  btnLabel: {
    color: '#CBD5E0',
    fontSize: 13,
    fontWeight: '500',
  },
});
