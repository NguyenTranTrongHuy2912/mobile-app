/**
 * useCallController.ts
 * Custom hook quản lý toàn bộ trạng thái, vòng đời, timer và thao tác đàm thoại WebRTC
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Vibration } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
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
} from './callSlice';
import { sendCallSignal } from './callSignalEmitter';
import { webrtcService } from '../../services/webrtcService';
import { buildJitsiRoomUrl, requestAndroidCallPermissions } from './callEngine';

export function useCallController() {
  const dispatch = useAppDispatch();
  const call = useAppSelector((s) => s.call);
  const currentUserId = useAppSelector((s) => s.session.userId);

  // Animation hiệu ứng sóng âm / nhịp đập avatar & ref WebView WebRTC
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const webViewRef = useRef<any>(null);

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
  const myParticipantName = (isCaller ? call.callerName : call.receiverName) || 'Thành viên';

  // URL WebRTC nhúng trong WebView
  const jitsiEmbeddedUrl = useMemo(() => {
    return buildJitsiRoomUrl({
      roomId: call.roomId,
      participantName: myParticipantName,
      isVideo,
      isMuted: call.isMuted,
      isVideoOff: call.isVideoOff,
    });
  }, [call.roomId, myParticipantName, isVideo, call.isMuted, call.isVideoOff]);

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

  // 1. Tự động xin quyền Android & kích hoạt Audio Mode
  useEffect(() => {
    if (call.status === 'CALLING' || call.status === 'INCOMING') {
      requestAndroidCallPermissions(isVideo).catch(() => {});
    }
    if (call.status === 'CONNECTED') {
      try {
        setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        }).catch(() => {});
      } catch {}
    }
  }, [call.status, isVideo]);

  // 2. Timer đếm giây cuộc gọi khi CONNECTED
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

  // 3. Timeout tự ngắt nếu đổ chuông quá 45s không ai trả lời
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

  // 4. Tự động đóng modal sau 1.5s khi ENDED
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

  // 5. Vòng lặp animation phát sóng khi đang đổ chuông / gọi
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

  // Thao tác chấp nhận cuộc gọi
  const handleAccept = async () => {
    await requestAndroidCallPermissions(isVideo);
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

  const handleToggleMute = () => {
    const nextMuted = !call.isMuted;
    webrtcService.toggleMute(nextMuted);
    dispatch(toggleMute());
    try {
      webViewRef.current?.injectJavaScript(`
        try {
          if (window.APP && window.APP.conference) {
            window.APP.conference.muteAudio(${nextMuted});
          }
        } catch(e) {}
        true;
      `);
    } catch {}
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !call.isVideoOff;
    webrtcService.toggleVideo(nextVideoOff);
    dispatch(toggleVideoOff());
    try {
      webViewRef.current?.injectJavaScript(`
        try {
          if (window.APP && window.APP.conference) {
            window.APP.conference.muteVideo(${nextVideoOff});
          }
        } catch(e) {}
        true;
      `);
    } catch {}
  };

  const handleToggleCamera = () => {
    dispatch(toggleCameraFacing());
    try {
      webViewRef.current?.injectJavaScript(`
        try {
          if (window.APP && window.APP.conference && window.APP.conference.deviceManager) {
            window.APP.conference.deviceManager.changeCamera();
          }
        } catch(e) {}
        true;
      `);
    } catch {}
  };

  const handleToggleSpeaker = () => {
    dispatch(toggleSpeaker());
    try {
      setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      }).catch(() => {});
    } catch {}
  };

  return {
    call,
    isIncoming,
    isCalling,
    isConnected,
    isEnded,
    isVideo,
    isGroup,
    displayName,
    displayAvatar,
    jitsiEmbeddedUrl,
    pulseAnim,
    pulseOpacity,
    webViewRef,
    handleAccept,
    handleDecline,
    handleEndCall,
    handleToggleMute,
    handleToggleVideo,
    handleToggleCamera,
    handleToggleSpeaker,
  };
}
