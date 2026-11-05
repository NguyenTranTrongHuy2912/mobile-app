import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import AiSummarizeModal from '../components/AiSummarizeModal';
import SemanticSearchModal from '../components/SemanticSearchModal';
import {
  useGetMessagesQuery,
  useGetRoomsQuery,
  useLoadEarlierMessagesMutation,
  useMarkRoomReadMutation,
  useSendMessageMutation,
  useSummarizeRoomMutation,
} from '../api/chatApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearDraft, setDraft } from '../features/chat/chatSlice';
import { newId } from '../utils/newId';
import { useSendImage, type PickedImage } from '../features/chat/useSendImage';
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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const router = useRouter();
  const [summarizeRoom, { isLoading: isSummarizing }] = useSummarizeRoomMutation();
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
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
      headerTitle: () => (
        <Pressable
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
              <Text style={[styles.headerSubtitleText, isOtherOnline && styles.headerActiveText]}>
                {isOtherOnline ? 'Đang hoạt động' : 'Hoạt động gần đây'}
              </Text>
            ) : currentRoom?.members.length ? (
              <Text style={styles.headerSubtitleText}>
                {currentRoom.members.length} thành viên · Chi tiết
              </Text>
            ) : null}
          </View>
        </Pressable>
      ),
      headerRight: () => (
        <View style={styles.headerRightActions}>
          {!isDirect && (
            <ScalePressable
              style={styles.summarizeHeaderBtn}
              onPress={handleOpenAiSummarize}
            >
              <Ionicons name="sparkles" size={15} color="#0084FF" />
              <Text style={styles.summarizeHeaderBtnText}>Tóm tắt</Text>
            </ScalePressable>
          )}
                    <Pressable
            onPress={() => setShowSearchModal(true)}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <Ionicons name="search-outline" size={22} color="#0084FF" />
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/(app)/room-detail/[roomId]', params: { roomId } })}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <Ionicons name="information-circle-outline" size={24} color="#0084FF" />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, headerTitle, isDirect, isOtherOnline, currentRoom?.members.length]);

  // Cuộn thông minh: chỉ tự cuộn xuống cuối khi vào phòng lần đầu hoặc có tin mới ở cuối
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
      } else {
        const prev = prevMessagesRef.current;
        const lastOld = prev[prev.length - 1];
        const lastNew = messages[messages.length - 1];
        if (!lastOld || lastNew?.id !== lastOld?.id) {
          listRef.current?.scrollToEnd({ animated: true });
        }
      }
      prevMessagesRef.current = messages;
    }
  }, [messages]);

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

  // Tra tên người gửi từ danh sách thành viên của phòng (đã có trong cache danh sách phòng)
  const { room } = useGetRoomsQuery(undefined, {
    selectFromResult: ({ data }) => ({ room: data?.find((r) => r.id === roomId) }),
  });
  const names = useMemo(
    () => new Map((room?.members ?? []).map((m) => [m.userId, m.displayName] as const)),
    [room],
  );

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
            <ActivityIndicator size="small" color="#0084FF" />
            <Text style={styles.loadEarlierText}>Đang tải tin nhắn cũ hơn...</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.loadEarlierBtn,
              pressed && styles.loadEarlierBtnPressed,
            ]}
            onPress={handleLoadEarlier}
            hitSlop={8}
          >
            <Ionicons name="time-outline" size={16} color="#0084FF" style={{ marginRight: 6 }} />
            <Text style={styles.loadEarlierBtnText}>Tải tin nhắn cũ hơn</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const mine = item.senderId === userId;
    const isImage = item.type === 'image';
    const isVideo = item.type === 'video';
    const isMedia = isImage || isVideo;
    const isBigEmoji = !isMedia && isOnlyEmoji(item.content);
    const isSelected = selectedMsgId === item.id;

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
            style={[
              styles.bubble,
              mine ? styles.bubbleMine : styles.bubbleOther,
              isMedia && styles.bubbleImage,
              isBigEmoji && styles.bubbleBigEmoji,
            ]}
          >
            {!mine && (
              <Text style={[styles.sender, (isMedia || isBigEmoji) && styles.imagePad]}>
                {names.get(item.senderId) ?? 'Người dùng'}
              </Text>
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
            ) : (
              <Text style={mine ? styles.textMine : styles.textOther}>{item.content}</Text>
            )}

            {isSelected && (
              <Text
                style={[
                  styles.meta,
                  mine ? styles.metaMine : styles.metaOther,
                  (isMedia || isBigEmoji) && styles.imagePad,
                  isBigEmoji && styles.metaBigEmoji,
                ]}
              >
                {dayjs(item.timestamp).format('HH:mm · DD/MM/YYYY')}
              </Text>
            )}
            {mine && item.status === 'sending' && (
              <Text style={styles.sendingMeta}>Đang gửi…</Text>
            )}
          </Pressable>
          {mine && item.status === 'failed' && (
            <Pressable
              onPress={() => (isMedia ? retryImage(item) : send(item.content, item.id))}
              hitSlop={8}
            >
              <Text style={styles.failed}>Gửi lỗi · Thử lại</Text>
            </Pressable>
          )}
        </AnimatedMessageItem>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
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
            <Pressable
              key={emoji}
              onPress={() => handlePickEmoji(emoji)}
              style={styles.emojiItem}
              hitSlop={4}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.inputBar}>
        <Pressable onPress={takePhoto} hitSlop={6} style={styles.iconButton}>
          <Ionicons name="camera" size={24} color="#0084FF" />
        </Pressable>
        <Pressable onPress={() => setShowMediaModal(true)} hitSlop={6} style={styles.iconButton}>
          <Ionicons name="image" size={24} color="#0084FF" />
        </Pressable>
        <Pressable
          onPress={() => setShowEmojiPicker((prev) => !prev)}
          hitSlop={6}
          style={styles.iconButton}
        >
          <Ionicons
            name={showEmojiPicker ? 'happy' : 'happy-outline'}
            size={24}
            color="#0084FF"
          />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#8A8D91"
          value={draft}
          onChangeText={(text) => dispatch(setDraft({ roomId, text }))}
          multiline
        />

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
            <Ionicons name="thumbs-up" size={26} color="#0084FF" />
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
  },
  summarizeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  summarizeHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0064D1',
    marginLeft: 4,
  },

  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#8A8D91', marginTop: 40 },
  bubbleRow: { marginBottom: 8, maxWidth: '80%' },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowOther: { alignSelf: 'flex-start' },
  bubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18 },
  bubbleMine: { backgroundColor: '#0084FF', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
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
    lineHeight: 48,
    textAlign: 'center',
  },
  metaBigEmoji: {
    color: '#8A8D91',
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
  imagePad: { paddingHorizontal: 8 },
  sender: { fontSize: 12, fontWeight: '600', color: '#0084FF', marginBottom: 2 },
  textMine: { color: '#fff', fontSize: 16 },
  textOther: { color: '#050505', fontSize: 16 },
  meta: { fontSize: 11, marginTop: 2 },
  metaMine: { color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  metaOther: { color: '#8A8D91' },
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
    color: '#65676B',
    marginLeft: 6,
  },
  loadEarlierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4E6EB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  loadEarlierBtnPressed: {
    backgroundColor: '#D8DADF',
  },
  loadEarlierBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0084FF',
  },
  failed: { color: '#FA383E', fontSize: 12, marginTop: 2 },
  notice: {
    textAlign: 'center',
    color: '#FA383E',
    fontSize: 13,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  emojiPickerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E6EB',
  },
  emojiItem: {
    padding: 6,
    borderRadius: 20,
  },
  emojiText: {
    fontSize: 26,
  },
  iconButton: { paddingHorizontal: 5, paddingBottom: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E6EB',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: '#050505',
    marginHorizontal: 4,
  },
  sendButton: {
    backgroundColor: '#0084FF',
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
    backgroundColor: '#0084FF',
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
    color: '#050505',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#65676B',
    marginTop: 1,
  },
  headerActiveText: {
    color: '#31A24C',
    fontWeight: '600',
  },
  dateDividerWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#65676B',
    letterSpacing: 0.3,
  },
  sendingMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    marginTop: 2,
  },
});
