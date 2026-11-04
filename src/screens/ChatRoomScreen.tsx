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
import { useLocalSearchParams } from 'expo-router';
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
import ImageViewer from '../components/ImageViewer';
import type { Message } from '../types/chat';

const MAX_IMAGES_PER_PICK = 5;

const toPicked = (a: ImagePicker.ImagePickerAsset): PickedImage => ({
  uri: a.uri,
  width: a.width,
  height: a.height,
  mimeType: a.mimeType,
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

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
    return (
      <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
        <View
          style={[
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleOther,
            isImage && styles.bubbleImage,
          ]}
        >
          {!mine && (
            <Text style={[styles.sender, isImage && styles.imagePad]}>
              {names.get(item.senderId) ?? 'Người dùng'}
            </Text>
          )}
          {isImage ? (
            <ChatImage
              message={item}
              onPress={() => setViewerUri(item.imageUrl ?? item.localUri ?? null)}
            />
          ) : (
            <Text style={mine ? styles.textMine : styles.textOther}>{item.content}</Text>
          )}
          <Text
            style={[styles.meta, mine ? styles.metaMine : styles.metaOther, isImage && styles.imagePad]}
          >
            {dayjs(item.timestamp).format('HH:mm')}
            {mine && item.status === 'sending' ? ' · Đang gửi…' : ''}
          </Text>
        </View>
        {mine && item.status === 'failed' && (
          <Pressable
            onPress={() => (isImage ? retryImage(item) : send(item.content, item.id))}
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
      <View style={styles.inputBar}>
        <Pressable onPress={takePhoto} hitSlop={6} style={styles.iconButton}>
          <Ionicons name="camera" size={26} color="#007AFF" />
        </Pressable>
        <Pressable onPress={pickFromLibrary} hitSlop={6} style={styles.iconButton}>
          <Ionicons name="image" size={26} color="#007AFF" />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={draft}
          onChangeText={(text) => dispatch(setDraft({ roomId, text }))}
          multiline
        />
        <Pressable
          style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}
          onPress={onPressSend}
          disabled={!draft.trim()}
        >
          <Text style={styles.sendText}>Gửi</Text>
        </Pressable>
      </View>
      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  bubbleRow: { marginBottom: 8, maxWidth: '80%' },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowOther: { alignSelf: 'flex-start' },
  bubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
  bubbleMine: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleImage: { padding: 4 },
  imagePad: { paddingHorizontal: 8 },
  sender: { fontSize: 12, fontWeight: '600', color: '#007AFF', marginBottom: 2 },
  textMine: { color: '#fff', fontSize: 16 },
  textOther: { color: '#222', fontSize: 16 },
  meta: { fontSize: 11, marginTop: 2 },
  metaMine: { color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  metaOther: { color: '#999' },
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
  failed: { color: '#FF3B30', fontSize: 12, marginTop: 2 },
  notice: { textAlign: 'center', color: '#FF3B30', fontSize: 13, paddingVertical: 6, backgroundColor: '#fff' },
  iconButton: { paddingHorizontal: 4, paddingBottom: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendDisabled: { backgroundColor: '#9fc7ff' },
  sendText: { color: '#fff', fontWeight: '700' },
});
