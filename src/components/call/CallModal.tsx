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
import { webrtcService } from '../../services/webrtcService';

const { width } = Dimensions.get('window');

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
      webrtcService.endAll();
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
  const isGroup = !!call.isGroup;

  // Xác định thông tin người hiển thị
  const isCaller = call.callerId === currentUserId;
  const displayName = isGroup
    ? call.groupName || 'Cuộc gọi nhóm'
    : isCaller
    ? call.receiverName || 'Người nhận'
    : call.callerName || 'Người gọi';
  const displayAvatar = isCaller ? call.receiverAvatar : call.callerAvatar;

  // Thao tác chấp nhận cuộc gọi
  const handleAccept = () => {
    Vibration.cancel();
    dispatch(acceptCall());
    if (call.callerId && call.callId) {
      webrtcService.handleOffer(call.callerId, call.callId, call.callType, null, {
        accepted: true,
      });
    }
  };

  // Thao tác từ chối cuộc gọi đến
  const handleDecline = () => {
    Vibration.cancel();
    dispatch(setCallEnded({ reason: 'Đã từ chối cuộc gọi' }));
    webrtcService.endAll();
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
    webrtcService.endAll();
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

  const handleToggleMute = () => {
    webrtcService.toggleMute(!call.isMuted);
    dispatch(toggleMute());
  };

  const handleToggleVideo = () => {
    webrtcService.toggleVideo(!call.isVideoOff);
    dispatch(toggleVideoOff());
  };

  return (
    <Modal visible={true} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={styles.container}>
        {/* Nền mô phỏng video nếu là Video Call và đã CONNECTED */}
        {isVideo && isConnected && !call.isVideoOff && !isGroup ? (
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
              <Ionicons name="shield-checkmark" size={13} color="#48BB78" />
              <Text style={styles.securityText}>Mã hóa WebRTC · STUN Google</Text>
            </View>
            <Text style={styles.callTypeLabel}>
              {isGroup
                ? isVideo
                  ? 'GỌI VIDEO NHÓM'
                  : 'GỌI THOẠI NHÓM'
                : isVideo
                ? 'CUỘC GỌI VIDEO 2 CHIỀU'
                : 'CUỘC GỌI THOẠI 2 CHIỀU'}
            </Text>
          </View>

          {/* Phần giữa: Giao diện Gọi Nhóm (Group) hoặc Gọi 1-1 */}
          {isGroup ? (
            <View style={styles.groupCallContainer}>
              <Text style={styles.groupTitleText} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.groupStatusText}>
                {isConnected ? formatDuration(call.durationSeconds) : isCalling ? 'Đang gọi nhóm...' : 'Cuộc gọi nhóm đến...'}
              </Text>

              {/* Lưới thành viên trong nhóm (Participants Grid) */}
              <View style={styles.groupGrid}>
                {call.participants && call.participants.length > 0 ? (
                  call.participants.slice(0, 6).map((p, idx) => (
                    <View key={p.userId || idx} style={styles.groupMemberTile}>
                      <View style={styles.groupAvatarCircle}>
                        <Text style={styles.groupAvatarInit}>
                          {(p.displayName || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.groupMemberName} numberOfLines={1}>
                        {p.displayName}
                      </Text>
                      <View style={styles.groupAudioStatus}>
                        <Ionicons
                          name={p.isMuted ? 'mic-off' : 'mic'}
                          size={12}
                          color={p.isMuted ? '#E53E3E' : '#48BB78'}
                        />
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.groupMemberTile}>
                    <View style={styles.groupAvatarCircle}>
                      <Ionicons name="people" size={32} color="#0084FF" />
                    </View>
                    <Text style={styles.groupMemberName}>Thành viên nhóm</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            (!isVideo || !isConnected || call.isVideoOff) && (
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
            )
          )}

          {/* Nếu đang trong Video Call 1-1 đã kết nối: thanh thời lượng phía trên */}
          {!isGroup && isVideo && isConnected && !call.isVideoOff && (
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
                    <Ionicons
                      name="call"
                      size={28}
                      color="#fff"
                      style={{ transform: [{ rotate: '135deg' }] }}
                    />
                  </Pressable>
                  <Text style={styles.btnLabel}>Hủy</Text>
                </View>

                <View style={styles.actionCol}>
                  <Pressable
                    style={[styles.circleBtn, call.isMuted && styles.btnActive]}
                    onPress={handleToggleMute}
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
                      onPress={handleToggleMute}
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
                    <Text style={styles.btnLabel}>
                      {call.isSpeakerOn ? 'Loa ngoài' : 'Tai nghe'}
                    </Text>
                  </View>

                  {/* Nếu là Video Call: Nút tắt/bật Camera */}
                  {isVideo && (
                    <View style={styles.actionCol}>
                      <Pressable
                        style={[styles.circleBtn, call.isVideoOff && styles.btnActive]}
                        onPress={handleToggleVideo}
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
                      style={[
                        styles.circleBtn,
                        styles.btnHangup,
                        { width: 72, height: 72, borderRadius: 36 },
                      ]}
                      onPress={() => handleEndCall('ended')}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="call"
                        size={32}
                        color="#fff"
                        style={{ transform: [{ rotate: '135deg' }] }}
                      />
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
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  centerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 132, 255, 0.35)',
  },
  pulseGreen: {
    backgroundColor: 'rgba(46, 204, 113, 0.4)',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#334155',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0084FF',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '700',
  },
  callerName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  // Group Call Styles
  groupCallContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  groupStatusText: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 20,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  groupMemberTile: {
    width: (width - 72) / 2,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  groupAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  groupAvatarInit: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  groupMemberName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  groupAudioStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Video Background Styles
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteVideoText: {
    color: '#718096',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  localVideoPip: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 90,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2D3748',
    borderWidth: 2,
    borderColor: '#4A5568',
  },
  localPipContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localPipText: {
    color: '#A0AEC0',
    fontSize: 11,
    marginTop: 4,
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
  // Bottom Controls
  bottomControls: {
    paddingBottom: Platform.OS === 'android' ? 36 : 20,
    paddingHorizontal: 24,
  },
  incomingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  btnActive: {
    backgroundColor: '#fff',
  },
  btnAccept: {
    backgroundColor: '#2ECC71',
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  btnDecline: {
    backgroundColor: '#E74C3C',
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  btnHangup: {
    backgroundColor: '#E74C3C',
  },
  btnLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },
});
