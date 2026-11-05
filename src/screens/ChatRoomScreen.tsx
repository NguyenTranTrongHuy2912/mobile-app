import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ActiveBadge } from '../components/ActiveBadge';
import dayjs from 'dayjs';
import {
  useGetMessagesQuery,
  useGetRoomsQuery,
  useLoadEarlierMessagesMutation,
  useMarkRoomReadMutation,
  useSendMessageMutation,
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
        <View style={styles.headerContainer}>
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
                {isOtherOnline ? 'Đang hoạt động' : 'Không hoạt động'}
              </Text>
            ) : currentRoom?.members.length ? (
              <Text style={styles.headerSubtitleText}>
                {currentRoom.members.length} thành viên
              </Text>
            ) : null}
          </View>
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

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES_PER_PICK,
    });
    if (res.canceled || res.assets.length === 0) return;
    sendImages(res.assets.slice(0, MAX_IMAGES_PER_PICK).map(toPicked));
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setNotice('Cần cho phép dùng camera trong cài đặt để chụp ảnh.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (res.canceled || res.assets.length === 0) return;
    sendImages([toPicked(res.assets[0])]);
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

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.senderId === userId;
    const isImage = item.type === 'image';
    const isVideo = item.type === 'video';
    const isMedia = isImage || isVideo;
    const isBigEmoji = !isMedia && isOnlyEmoji(item.content);

    return (
      <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
        <View
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
          <Text
            style={[
              styles.meta,
              mine ? styles.metaMine : styles.metaOther,
              (isMedia || isBigEmoji) && styles.imagePad,
              isBigEmoji && styles.metaBigEmoji,
            ]}
          >
            {dayjs(item.timestamp).format('HH:mm')}
            {mine && item.status === 'sending' ? ' · Đang gửi…' : ''}
          </Text>
        </View>
        {mine && item.status === 'failed' && (
          <Pressable
            onPress={() => (isMedia ? retryImage(item) : send(item.content, item.id))}
            hitSlop={8}
          >
            <Text style={styles.failed}>Gửi lỗi · Thử lại</Text>
          </Pressable>
        )}
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
        <Pressable onPress={pickFromLibrary} hitSlop={6} style={styles.iconButton}>
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
          <Pressable style={styles.sendButton} onPress={onPressSend}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.likeButton}
            onPress={() => send('👍')}
            hitSlop={6}
          >
            <Ionicons name="thumbs-up" size={26} color="#0084FF" />
          </Pressable>
        )}
      </View>
      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
});
