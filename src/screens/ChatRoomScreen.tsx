import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Spinner, Text, View } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import MediaPickerModal from '../components/MediaPickerModal';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ActiveBadge } from '../components/ActiveBadge';
import dayjs from 'dayjs';
import { formatChatDivider } from '../utils/dateFormatter';
import AnimatedMessageItem from '../components/AnimatedMessageItem';
import ScalePressable from '../components/ScalePressable';
import * as Clipboard from 'expo-clipboard';
import AiSummarizeModal from '../components/AiSummarizeModal';
import SemanticSearchModal from '../components/SemanticSearchModal';
import {
  useGetMessagesQuery,
  useGetRoomsQuery,
  useLoadEarlierMessagesMutation,
  useMarkRoomReadMutation,
  useSendMessageMutation,
  useSummarizeRoomMutation,
  useRewriteTextMutation,
} from '../api/chatApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearDraft, setDraft } from '../features/chat/chatSlice';
import { startOutgoingCall } from '../features/call/callSlice';
import { sendCallSignal } from '../features/call/callSignalEmitter';
import { newId } from '../utils/newId';
import { useSendImage, type PickedImage } from '../features/chat/useSendImage';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import ChatImage from '../components/ChatImage';
import ChatVideo from '../components/ChatVideo';
import ImageViewer from '../components/ImageViewer';
import type { Message } from '../types/chat';

const MAX_IMAGES_PER_PICK = 5;
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉'];

const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D){1,8}$/u;

function isOnlyEmoji(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (/[a-zA-Z0-9\.,!\?@#\$%\^&\*\(\)_+\-=\[\]\{\};':"\\|<>\/~`]/.test(trimmed)) {
    return false;
  }
  return EMOJI_REGEX.test(trimmed);
}

const toPicked = (a: ImagePicker.ImagePickerAsset): PickedImage => ({
  uri: a.uri,
  type: a.type === 'video' ? 'video' : 'image',
  width: a.width,
  height: a.height,
  mimeType: a.mimeType,
  duration: a.duration ? Math.round(a.duration * 1000) : undefined,
});

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.session.userId);
  const draft = useAppSelector((s) => s.chat.drafts[roomId] ?? '');

  const C = useScreenColors();
  const isDark = C.isDark;
  const styles = useMemo(() => makeStyles(C), [C]);

  const { data, isLoading } = useGetMessagesQuery(roomId, {
    pollingInterval: 15000, // Realtime qua WebSocket cập nhật tức thì, polling chỉ là fallback
  });
  const messages = data?.messages ?? [];
  const hasMore = data?.hasMore ?? false;

  const [sendMessage] = useSendMessageMutation();
  const [markRoomRead] = useMarkRoomReadMutation();
  const [loadEarlier, { isLoading: isLoadingEarlier }] = useLoadEarlierMessagesMutation();

  const listRef = useRef<FlatList<Message>>(null);
  const prevMessagesRef = useRef<Message[]>([]);
  const isInitialLoadRef = useRef(true);

  // "Ghim đáy": FlatList chỉ vẽ một phần tin lúc đầu và chưa biết chiều cao thật của phần còn lại
  // (ảnh, ngày phân cách...), nên một lần scrollToEnd duy nhất sẽ dừng ở giữa. Trong lúc ghim, mỗi khi
  // nội dung đổi kích thước ta cuộn xuống đáy lại. Ghim tự thả sau một lúc, hoặc ngay khi người dùng kéo.
  const stickToBottomRef = useRef(true);
  const stickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pinToBottom = useCallback((ms: number) => {
    stickToBottomRef.current = true;
    if (stickTimerRef.current) clearTimeout(stickTimerRef.current);
    stickTimerRef.current = setTimeout(() => {
      stickToBottomRef.current = false;
    }, ms);
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (stickToBottomRef.current) listRef.current?.scrollToEnd({ animated: false });
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    // Người dùng tự cuộn: không kéo họ về đáy nữa (cũng tránh giật khi tải tin cũ ở đầu danh sách)
    stickToBottomRef.current = false;
  }, []);

  useEffect(
    () => () => {
      if (stickTimerRef.current) clearTimeout(stickTimerRef.current);
    },
    [],
  );

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const router = useRouter();
  const [summarizeRoom, { isLoading: isSummarizing }] = useSummarizeRoomMutation();
  const [rewriteText, { isLoading: isRewriting }] = useRewriteTextMutation();
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAiToolModal, setShowAiToolModal] = useState(false);

  const handleRewriteDraft = async (tone: 'formal' | 'friendly' | 'short' | 'english') => {
    if (!draft.trim()) return;
    try {
      const res = await rewriteText({ text: draft, tone }).unwrap();
      if (res.rewritten) {
        dispatch(setDraft({ roomId, text: res.rewritten }));
        setShowAiToolModal(false);
      }
    } catch {
      Alert.alert('HQ AI', 'Không thể viết lại tin nhắn lúc này.');
    }
  };
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [reactionTargetMsg, setReactionTargetMsg] = useState<Message | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
    // Quản lý trạng thái thu gọn / mở rộng các nút hành động (Camera, Ảnh, Mic, Thêm)
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });
    return () => sub.remove();
  }, []);

  const isCollapsed = draft.trim().length > 0 && !isActionsExpanded;

  const toggleActions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsActionsExpanded((prev) => !prev);
  };

  const handleLongPress = (msg: Message) => {
    setReactionTargetMsg(msg);
    setShowActionModal(true);
  };

  const handleSelectReaction = (emoji: string) => {
    if (reactionTargetMsg) {
      setReactions((prev) => ({
        ...prev,
        [reactionTargetMsg.id]: prev[reactionTargetMsg.id] === emoji ? '' : emoji,
      }));
    }
    setShowActionModal(false);
    setReactionTargetMsg(null);
  };

  const handleCopyContent = async () => {
    if (reactionTargetMsg?.content) {
      await Clipboard.setStringAsync(reactionTargetMsg.content);
      Alert.alert('Thành công', 'Đã sao chép nội dung tin nhắn.');
    }
    setShowActionModal(false);
    setReactionTargetMsg(null);
  };

  const handleTextChange = (text: string) => {
    dispatch(setDraft({ roomId, text }));
    if (text.trim().length > 0 && isActionsExpanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsActionsExpanded(false);
    }
  };

  const [summaryData, setSummaryData] = useState<{ summary: string; totalMessages: number }>({
    summary: '',
    totalMessages: 0,
  });

  const handleOpenAiSummarize = async () => {
    if (!roomId) return;
    setShowAiModal(true);
    try {
      const res = await summarizeRoom({ roomId }).unwrap();
      setSummaryData({
        summary: res.summary,
        totalMessages: res.total_messages,
      });
    } catch (e) {
      setSummaryData({
        summary: 'Không thể tóm tắt cuộc trò chuyện lúc này. Vui lòng thử lại sau.',
        totalMessages: 0,
      });
    }
  };

  const navigation = useNavigation();
  const onlineUserIds = useAppSelector((s) => s.presence.onlineUserIds);
  const { data: rooms } = useGetRoomsQuery();
  const currentRoom = rooms?.find((r) => r.id === roomId);
  const isDirect = currentRoom?.type === 'direct';
  const otherMember = isDirect ? currentRoom?.members.find((m) => m.userId !== userId) : undefined;
  const otherUserId = otherMember?.userId;
  const isOtherOnline = otherUserId ? !!onlineUserIds[otherUserId] : false;
  const headerTitle = currentRoom?.name || 'Chat';

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: C.card },
      headerTintColor: C.ink,
      headerTitle: () => (
        <View
          style={styles.headerContainer}
          onPress={() => router.push({ pathname: '/(app)/room-detail/[roomId]', params: { roomId } })}
        >
          <View style={styles.headerAvatarWrap}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarInitial}>
                {headerTitle.charAt(0).toUpperCase()}
              </Text>
            </View>
            {isDirect && isOtherOnline ? (
              <ActiveBadge size={12} style={{ bottom: -2, right: -2 }} />
            ) : null}
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {headerTitle}
            </Text>
            {isDirect ? (
              <Text style={{ ...styles.headerSubtitleText, ...(isOtherOnline ? styles.headerActiveText : null) }}>
                {isOtherOnline ? 'Đang hoạt động' : 'Hoạt động gần đây'}
              </Text>
            ) : currentRoom?.members.length ? (
              <Text style={styles.headerSubtitleText}>
                {currentRoom.members.length} thành viên · Chi tiết
              </Text>
            ) : null}
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRightActions}>
          {isDirect && (
            <>
              {/* Nút Gọi Thoại (Audio Call) */}
              <Pressable
                onPress={() => handleStartCall('audio')}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Ionicons name="call" size={21} color="#0084FF" />
              </Pressable>

              {/* Nút Gọi Video (Video Call) */}
              <Pressable
                onPress={() => handleStartCall('video')}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Ionicons name="videocam" size={23} color="#0084FF" />
              </Pressable>
            </>
          )}

          {!isDirect && (
            <ScalePressable
              style={styles.summarizeHeaderBtn}
              onPress={handleOpenAiSummarize}
            >
              <Ionicons name="sparkles" size={15} color={C.brand} />
              <Text style={styles.summarizeHeaderBtnText}>Tóm tắt</Text>
            </ScalePressable>
          )}
                    <View
            onPress={() => setShowSearchModal(true)}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <Ionicons name="search-outline" size={22} color={C.brand} />
          </View>
          <View
            onPress={() => router.push({ pathname: '/(app)/room-detail/[roomId]', params: { roomId } })}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <Ionicons name="information-circle-outline" size={24} color={C.brand} />
          </View>
        </View>
      ),
    });
  }, [navigation, headerTitle, isDirect, isOtherOnline, currentRoom?.members.length, C, styles]);

  // Cuộn thông minh: chỉ tự cuộn xuống cuối khi vào phòng lần đầu hoặc có tin mới ở cuối
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        pinToBottom(1500);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
      } else {
        const prev = prevMessagesRef.current;
        const lastOld = prev[prev.length - 1];
        const lastNew = messages[messages.length - 1];
        if (!lastOld || lastNew?.id !== lastOld?.id) {
          // Tin mới (nhất là ảnh) có thể đổi chiều cao sau khi vẽ: ghim đáy thêm một lúc
          pinToBottom(800);
          listRef.current?.scrollToEnd({ animated: true });
        }
      }
      prevMessagesRef.current = messages;
    }
  }, [messages, pinToBottom]);

  const handleLoadEarlier = useCallback(async () => {
    if (isLoadingEarlier || !hasMore || messages.length === 0) return;
    const oldestTimestamp = messages[0].timestamp;
    await loadEarlier({ roomId, beforeTimestamp: oldestTimestamp });
  }, [isLoadingEarlier, hasMore, messages, loadEarlier, roomId]);

  const { sendImages, retryImage } = useSendImage(roomId);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Thông báo ngắn (ví dụ chưa cấp quyền camera) tự ẩn sau vài giây
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Tra tên người gửi từ danh sách thành viên của phòng
  const names = useMemo(
    () => new Map((currentRoom?.members ?? []).map((m) => [m.userId, m.displayName] as const)),
    [currentRoom],
  );

  const myDisplayName = useAppSelector((s) => s.session.displayName) || 'Tôi';

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!isDirect) {
      Alert.alert('Thông báo', 'Tính năng gọi nhóm đang được phát triển. Vui lòng gọi trong cuộc trò chuyện 1-1.');
      return;
    }
    if (!otherMember) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người nhận cuộc gọi.');
      return;
    }
    if (otherMember.userId === 'hq_ai_bot') {
      Alert.alert('Thông báo', 'Không thể gọi điện cho Trợ lý ảo HQ AI.');
      return;
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    dispatch(
      startOutgoingCall({
        callId,
        roomId,
        receiverId: otherMember.userId,
        receiverName: otherMember.displayName,
        callerId: userId,
        callerName: myDisplayName,
        callType: type,
      }),
    );
    sendCallSignal({
      type: 'CALL_OFFER',
      call_id: callId,
      room_id: roomId,
      caller_id: userId,
      caller_name: myDisplayName,
      receiver_id: otherMember.userId,
      call_type: type,
    });
  };

  // Đánh dấu đã đọc khi mở phòng và mỗi khi có tin mới từ người khác
  const lastIncomingId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId !== userId) return messages[i].id;
    }
    return null;
  }, [messages, userId]);

  useEffect(() => {
    if (lastIncomingId) markRoomRead(roomId);
  }, [roomId, lastIncomingId, markRoomRead]);

  const send = useCallback(
    (content: string, localId?: string) => {
      const text = content.trim();
      if (!text) return;
      sendMessage({
        roomId,
        senderId: userId,
        content: text,
        localId: localId ?? newId(),
      });
    },
    [roomId, sendMessage, userId],
  );

  const onPressSend = () => {
    send(draft);
    dispatch(clearDraft(roomId));
  };

  const handlePickEmoji = (emoji: string) => {
    if (!draft.trim()) {
      send(emoji);
    } else {
      dispatch(setDraft({ roomId, text: draft + emoji }));
    }
  };

  // Mở thư viện ảnh & album thiết bị
  const pickFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền truy cập Thư viện', 'Vui lòng cho phép truy cập ảnh trong cài đặt.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES_PER_PICK,
      });
      if (res.canceled || res.assets.length === 0) return;
      sendImages(res.assets.slice(0, MAX_IMAGES_PER_PICK).map(toPicked));
    } catch (e) {
      console.warn('[Picker] Error picking from library:', e);
    }
  };

  // Duyệt trực tiếp thư mục tệp máy (Folder / Files)
  const pickFromFolder = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const picked: PickedImage[] = res.assets.slice(0, MAX_IMAGES_PER_PICK).map((doc) => {
        const isVideo = doc.mimeType?.startsWith('video/') || false;
        return {
          uri: doc.uri,
          type: isVideo ? 'video' : 'image',
          mimeType: doc.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          width: 800,
          height: 800,
        };
      });
      sendImages(picked);
    } catch (e) {
      console.warn('[Picker] Error picking from folder:', e);
    }
  };

  // Chụp ảnh trực tiếp từ Camera trước (Front Camera)
  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền truy cập Camera', 'Cần cho phép dùng camera trong cài đặt để chụp ảnh.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.front, // Mở trực tiếp Camera trước
        quality: 0.8,
        allowsEditing: true,
      });
      if (res.canceled || res.assets.length === 0) return;
      sendImages([toPicked(res.assets[0])]);
    } catch (e) {
      console.warn('[Camera] Error taking photo:', e);
    }
  };

  const renderHeader = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadEarlierContainer}>
        {isLoadingEarlier ? (
          <View style={styles.loadEarlierLoading}>
            <Spinner size="small" color="$brand" />
            <Text style={styles.loadEarlierText}>Đang tải tin nhắn cũ hơn...</Text>
          </View>
        ) : (
          <View
            style={styles.loadEarlierBtn}
            onPress={handleLoadEarlier}
            hitSlop={8}
          >
            <Ionicons name="time-outline" size={16} color={C.brand} style={{ marginRight: 6 }} />
            <Text style={styles.loadEarlierBtnText}>Tải tin nhắn cũ hơn</Text>
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isHqAi = item.senderId === 'hq_ai_bot' || item.content.startsWith('🤖 [HQ AI]');
    const mine = !isHqAi && item.senderId === userId;
    const isImage = item.type === 'image';
    const isVideo = item.type === 'video';
    const isMedia = isImage || isVideo;
    const isBigEmoji = !isMedia && isOnlyEmoji(item.content);
    const isSelected = selectedMsgId === item.id;
    const displayContent = isHqAi ? item.content.replace(/^🤖\s*\[HQ AI\]:\s*/, '') : item.content;

    // Tính toán Date Divider giữa các đoạn hội thoại (chuẩn Messenger Ảnh 4)
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateDivider =
      !prevMsg ||
      !dayjs(item.timestamp).isSame(dayjs(prevMsg.timestamp), 'day') ||
      item.timestamp - prevMsg.timestamp > 30 * 60 * 1000;

    const dateLabel = formatChatDivider(item.timestamp);

    return (
      <View key={item.id}>
        {showDateDivider && (
          <View style={styles.dateDividerWrap}>
            <Text style={styles.dateDividerText}>{dateLabel}</Text>
          </View>
        )}
        <AnimatedMessageItem style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
          <Pressable
            onPress={() => setSelectedMsgId(isSelected ? null : item.id)}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={250}
            style={{
              ...styles.bubble,
              ...(mine ? styles.bubbleMine : isHqAi ? styles.bubbleAi : styles.bubbleOther),
              ...(isMedia ? styles.bubbleImage : null),
              ...(isBigEmoji ? styles.bubbleBigEmoji : null),
            }}
          >
            {!mine && (
              <View style={styles.senderRow}>
                {isHqAi && (
                  <View style={styles.aiBadgeAvatar}>
                    <Ionicons name="sparkles" size={10} color="#fff" />
                  </View>
                )}
                <Text style={{ ...styles.sender, ...(isHqAi ? styles.aiSenderText : null), ...(isMedia || isBigEmoji ? styles.imagePad : null) }}>
                  {isHqAi ? 'HQ AI 🤖' : (names.get(item.senderId) ?? 'Người dùng')}
                </Text>
              </View>
            )}
            {isImage ? (
              <ChatImage
                message={item}
                onPress={() => setViewerUri(item.imageUrl ?? item.localUri ?? null)}
              />
            ) : isVideo ? (
              <ChatVideo message={item} />
            ) : isBigEmoji ? (
              <Text style={styles.textBigEmoji}>{item.content}</Text>
            ) : item.content.startsWith('📞') || item.content.startsWith('📹') || item.content.startsWith('❌') || item.content.startsWith('🚫') ? (
              <View style={styles.callBubbleContent}>
                <View style={[styles.callIconBadge, (item.content.startsWith('❌') || item.content.startsWith('🚫')) && styles.callIconMissed]}>
                  <Ionicons
                    name={item.content.includes('video') ? 'videocam' : 'call'}
                    size={18}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.callTitleText, mine && { color: '#fff' }]}>
                    {item.content.includes('video') ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
                  </Text>
                  <Text style={[styles.callSubText, mine && { color: 'rgba(255,255,255,0.85)' }]}>
                    {item.content}
                  </Text>
                </View>
                {isDirect && (
                  <Pressable
                    style={[styles.callBackBtn, mine && { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                    onPress={() => handleStartCall(item.content.includes('video') ? 'video' : 'audio')}
                    hitSlop={6}
                  >
                    <Text style={[styles.callBackBtnText, mine && { color: '#fff' }]}>Gọi lại</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text style={mine ? styles.textMine : isHqAi ? styles.textAi : styles.textOther}>{displayContent}</Text>
            )}

            {isSelected && (
              <Text
                style={{
                  ...styles.meta,
                  ...(mine ? styles.metaMine : styles.metaOther),
                  ...(isMedia || isBigEmoji ? styles.imagePad : null),
                  ...(isBigEmoji ? styles.metaBigEmoji : null),
                }}
              >
                {dayjs(item.timestamp).format('HH:mm · DD/MM/YYYY')}
              </Text>
            )}
            {mine && item.status === 'sending' && (
              <Text style={styles.sendingMeta}>Đang gửi…</Text>
            )}
            {reactions[item.id] ? (
              <View style={[styles.reactionBadge, mine ? styles.reactionBadgeMine : styles.reactionBadgeOther]}>
                <Text style={styles.reactionBadgeText}>{reactions[item.id]}</Text>
              </View>
            ) : null}
          </Pressable>
          {mine && item.status === 'failed' && (
            <View
              onPress={() => (isMedia ? retryImage(item) : send(item.content, item.id))}
              hitSlop={8}
            >
              <Text style={styles.failed}>Gửi lỗi · Thử lại</Text>
            </View>
          )}
        </AnimatedMessageItem>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Spinner />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        onContentSizeChange={handleContentSizeChange}
        onScrollBeginDrag={handleScrollBeginDrag}
        initialNumToRender={30}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshing={isLoadingEarlier}
        onRefresh={hasMore ? handleLoadEarlier : undefined}
        ListEmptyComponent={
          <Text style={styles.empty}>Chưa có tin nhắn. Hãy gửi tin đầu tiên.</Text>
        }
      />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      {/* Thanh chọn emoji nhanh kiểu Facebook Messenger */}
      {showEmojiPicker && (
        <View style={styles.emojiPickerBar}>
          {QUICK_EMOJIS.map((emoji) => (
            <View
              key={emoji}
              onPress={() => handlePickEmoji(emoji)}
              style={styles.emojiItem}
              hitSlop={4}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Banner gợi ý triệu hồi @HQ AI khi gõ @ (nằm trên inputBar với chiều rộng 100%) */}
      {draft.includes('@') && (
        <Pressable
          style={styles.mentionBanner}
          onPress={() => {
            const base = draft.replace(/@[^@\s]*$/, '');
            dispatch(setDraft({ roomId, text: (base ? base + ' ' : '') + '@HQ AI ' }));
          }}
        >
          <View style={styles.mentionAvatar}>
            <Ionicons name="sparkles" size={13} color="#fff" />
          </View>
          <Text style={styles.mentionText}>
            Nhắc tên <Text style={styles.mentionBold}>@HQ AI</Text> để hỏi đáp hoặc tóm tắt phòng
          </Text>
          <Ionicons name="arrow-forward-circle" size={18} color={C.brand} />
        </Pressable>
      )}

      <View style={styles.inputBar}>
        {/* Nút chuyển đổi '>' hoặc hàng nút tính năng: tự động thu gọn khi có chữ để ô nhập rộng nhất */}
        {isCollapsed ? (
          <View onPress={toggleActions} hitSlop={8} style={styles.chevronButton}>
            <Ionicons name="chevron-forward" size={24} color={C.brand} />
          </View>
        ) : (
          <View style={styles.actionButtonsRow}>
            <View
              onPress={() => setShowMediaModal(true)}
              hitSlop={6}
              style={styles.iconButton}
            >
              <Ionicons name="add-circle" size={26} color={C.brand} />
            </View>
            <View onPress={takePhoto} hitSlop={6} style={styles.iconButton}>
              <Ionicons name="camera" size={24} color={C.brand} />
            </View>
            <View onPress={pickFromLibrary} hitSlop={6} style={styles.iconButton}>
              <Ionicons name="image" size={24} color={C.brand} />
            </View>
            <View
              onPress={() => Alert.alert('Ghi âm', 'Tính năng tin nhắn thoại đang sẵn sàng!')}
              hitSlop={6}
              style={styles.iconButton}
            >
              <Ionicons name="mic" size={24} color={C.brand} />
            </View>
            <View
              onPress={() => setShowAiToolModal(true)}
              hitSlop={6}
              style={styles.iconButton}
            >
              <Ionicons name="sparkles" size={24} color={C.brand} />
            </View>
            {draft.trim().length > 0 && (
              <View onPress={toggleActions} hitSlop={8} style={styles.iconButton}>
                <Ionicons name="chevron-back" size={22} color={C.muted} />
              </View>
            )}
          </View>
        )}

        {/* Khung chứa ô nhập văn bản và nút emoji */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={C.muted}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            value={draft}
            onChangeText={handleTextChange}
            multiline
          />
          <View
            onPress={() => setShowEmojiPicker((prev) => !prev)}
            hitSlop={6}
            style={styles.innerEmojiButton}
          >
            <Ionicons
              name={showEmojiPicker ? 'happy' : 'happy-outline'}
              size={22}
              color={C.brand}
            />
          </View>
        </View>

        {draft.trim() ? (
          <ScalePressable style={styles.sendButton} onPress={onPressSend}>
            <Ionicons name="send" size={18} color="#fff" />
          </ScalePressable>
        ) : (
          <ScalePressable
            style={styles.likeButton}
            onPress={() => send('👍')}
            hitSlop={6}
          >
            <Ionicons name="thumbs-up" size={24} color={C.brand} />
          </ScalePressable>
        )}
      </View>
      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
      <AiSummarizeModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        isLoading={isSummarizing}
        roomName={headerTitle}
        summary={summaryData.summary}
        totalMessages={summaryData.totalMessages}
      />
      <MediaPickerModal
        visible={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onPickGallery={pickFromLibrary}
        onPickFolder={pickFromFolder}
        onTakePhoto={takePhoto}
      />
      <SemanticSearchModal
        visible={showSearchModal}
        roomId={roomId}
        roomName={headerTitle}
        onClose={() => setShowSearchModal(false)}
      />

      {/* HQ AI Action Modal */}
      <Modal
        visible={showAiToolModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAiToolModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAiToolModal(false)}>
          <Pressable style={styles.aiToolCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.aiToolHeader}>
              <View style={styles.aiToolTitleRow}>
                <Ionicons name="sparkles" size={18} color={C.brand} style={{ marginRight: 6 }} />
                <Text style={styles.aiToolTitle}>Công cụ HQ AI</Text>
              </View>
              <Pressable onPress={() => setShowAiToolModal(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={C.muted} />
              </Pressable>
            </View>

            <Pressable
              style={styles.aiToolRow}
              onPress={() => {
                setShowAiToolModal(false);
                handleOpenAiSummarize();
              }}
            >
              <View style={[styles.aiToolIconWrap, { backgroundColor: C.brandSoft }]}>
                <Ionicons name="document-text-outline" size={20} color={C.brand} />
              </View>
              <View style={styles.aiToolRowText}>
                <Text style={styles.aiToolRowTitle}>Tóm tắt cuộc trò chuyện này</Text>
                <Text style={styles.aiToolRowDesc}>Tự động tổng hợp nội dung và việc cần làm</Text>
              </View>
            </Pressable>

            <View style={styles.aiToolDivider} />

            <View style={styles.aiRewriteSection}>
              <Text style={styles.aiSectionLabel}>Viết lại tin nhắn nháp (Smart Rewrite):</Text>
              {draft.trim() ? (
                <View style={styles.tonePillsRow}>
                  <Pressable
                    style={styles.tonePill}
                    onPress={() => handleRewriteDraft('formal')}
                    disabled={isRewriting}
                  >
                    <Text style={styles.tonePillText}>🎩 Trang trọng</Text>
                  </Pressable>
                  <Pressable
                    style={styles.tonePill}
                    onPress={() => handleRewriteDraft('friendly')}
                    disabled={isRewriting}
                  >
                    <Text style={styles.tonePillText}>😊 Thân thiện</Text>
                  </Pressable>
                  <Pressable
                    style={styles.tonePill}
                    onPress={() => handleRewriteDraft('short')}
                    disabled={isRewriting}
                  >
                    <Text style={styles.tonePillText}>⚡ Ngắn gọn</Text>
                  </Pressable>
                  <Pressable
                    style={styles.tonePill}
                    onPress={() => handleRewriteDraft('english')}
                    disabled={isRewriting}
                  >
                    <Text style={styles.tonePillText}>🌐 Tiếng Anh</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.aiHintText}>
                  Hãy nhập nội dung vào ô chat trước để HQ AI hỗ trợ viết lại nhé!
                </Text>
              )}
              {isRewriting && (
                <View style={styles.rewritingLoading}>
                  <ActivityIndicator size="small" color={C.brand} />
                  <Text style={styles.rewritingText}>HQ AI đang viết lại câu chữ...</Text>
                </View>
              )}
            </View>

            <View style={styles.aiToolDivider} />

            <Pressable
              style={styles.aiToolRow}
              onPress={() => {
                setShowAiToolModal(false);
                dispatch(setDraft({ roomId, text: '@HQ AI ' }));
              }}
            >
              <View style={[styles.aiToolIconWrap, { backgroundColor: C.brandSoft }]}>
                <Ionicons name="chatbubbles-outline" size={20} color={C.brand} />
              </View>
              <View style={styles.aiToolRowText}>
                <Text style={styles.aiToolRowTitle}>Hỏi @HQ AI trong phòng</Text>
                <Text style={styles.aiToolRowDesc}>Hỏi đáp kiến thức, chia tiền hoặc gợi ý cho cả phòng xem</Text>
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Thả Reaction & Sao Chép Tin Nhắn */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <Pressable style={styles.reactionModalOverlay} onPress={() => setShowActionModal(false)}>
          <View style={styles.reactionCard}>
            {/* Thanh biểu cảm Reaction */}
            <View style={styles.reactionBar}>
              {['❤️', '👍', '😂', '😮', '😢'].map((emoji) => (
                <Pressable
                  key={emoji}
                  style={styles.reactionEmojiBtn}
                  onPress={() => handleSelectReaction(emoji)}
                >
                  <Text style={styles.reactionEmojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Menu hành động */}
            <View style={styles.actionMenuDivider} />
            <Pressable style={styles.actionMenuItem} onPress={handleCopyContent}>
              <Ionicons name="copy-outline" size={18} color={C.ink} />
              <Text style={styles.actionMenuItemText}>
                Sao chép văn bản
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
  },
  callBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 200,
  },
  callIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#38A169',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIconMissed: {
    backgroundColor: '#E53E3E',
  },
  callTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#050505',
  },
  callSubText: {
    fontSize: 12,
    color: '#65676B',
    marginTop: 2,
  },
  callBackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#E7F3FF',
    marginLeft: 8,
  },
  callBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0084FF',
  },
  summarizeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  summarizeHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brandSoftText,
    marginLeft: 4,
  },

  container: { flex: 1, backgroundColor: C.screen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.screen },
  list: { padding: 12, flexGrow: 1 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 40 },
  bubbleRow: { marginBottom: 8, maxWidth: '80%' },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowOther: { alignSelf: 'flex-start' },
  bubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18 },
  bubbleMine: { backgroundColor: C.brand, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: C.card, borderBottomLeftRadius: 4 },
  bubbleImage: { padding: 4 },
  bubbleBigEmoji: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 2,
    elevation: 0,
    shadowOpacity: 0,
  },
  textBigEmoji: {
    fontSize: 42,
    textAlign: 'center',
  },
  metaBigEmoji: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
  imagePad: { paddingHorizontal: 8 },
  sender: { fontSize: 12, fontWeight: '600', color: C.brand, marginBottom: 2 },
  textMine: { color: '#fff', fontSize: 16 },
  textOther: { color: C.ink, fontSize: 16 },
  meta: { fontSize: 11, marginTop: 2 },
  metaMine: { color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  metaOther: { color: C.muted },
  loadEarlierContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  loadEarlierLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  loadEarlierText: {
    fontSize: 13,
    color: C.muted,
    marginLeft: 6,
  },
  loadEarlierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.chip,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  loadEarlierBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.brand,
  },
  failed: { color: C.danger, fontSize: 12, marginTop: 2 },
  notice: {
    textAlign: 'center',
    color: C.danger,
    fontSize: 13,
    paddingVertical: 6,
    backgroundColor: C.card,
  },
  emojiPickerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: C.card,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  emojiItem: {
    padding: 6,
    borderRadius: 20,
  },
  emojiText: {
    fontSize: 26,
  },
  iconButton: { paddingHorizontal: 4, paddingBottom: 6 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: C.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingBottom: 2,
  },
  chevronButton: {
    paddingHorizontal: 6,
    paddingBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    minHeight: 38,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
    color: C.ink,
    paddingRight: 6,
  },
  innerEmojiButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: C.brand,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginLeft: 4,
  },
  likeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 240,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  headerTextWrap: {
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
  },
  headerSubtitleText: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  headerActiveText: {
    color: C.success,
    fontWeight: '600',
  },
  dateDividerWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
    letterSpacing: 0.3,
  },
  sendingMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    marginTop: 2,
  },
  // --- HQ AI In-Chat Styles ---
  bubbleAi: {
    backgroundColor: C.brandSoft,
    borderWidth: 1,
    borderColor: C.line,
    borderBottomLeftRadius: 4,
  },
  textAi: {
    color: C.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiBadgeAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  aiSenderText: {
    color: C.brandSoftText,
    fontWeight: '700',
  },
  mentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brandSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  mentionAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mentionText: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
  },
  mentionBold: {
    fontWeight: '700',
    color: C.brandSoftText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiToolCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  aiToolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiToolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiToolTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.ink,
  },
  aiToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  aiToolIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiToolRowText: {
    flex: 1,
  },
  aiToolRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.ink,
  },
  aiToolRowDesc: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  aiToolDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.line,
    marginVertical: 10,
  },
  aiRewriteSection: {
    paddingVertical: 4,
  },
  aiSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 8,
  },
  tonePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tonePill: {
    backgroundColor: C.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  tonePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
  },
  aiHintText: {
    fontSize: 12,
    color: C.muted,
    fontStyle: 'italic',
  },
  rewritingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rewritingText: {
    fontSize: 13,
    color: C.brand,
    marginLeft: 6,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionBadgeMine: {
    right: 6,
  },
  reactionBadgeOther: {
    left: 6,
  },
  reactionBadgeText: {
    fontSize: 12,
  },
  reactionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  reactionCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  reactionEmojiBtn: {
    padding: 6,
  },
  reactionEmojiText: {
    fontSize: 28,
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: 10,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 10,
  },
  actionMenuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
  },
});