import React, { useCallback, useRef } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { useGetMessagesQuery, useSendMessageMutation } from '../api/chatApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearDraft, setDraft } from '../features/chat/chatSlice';
import { newId } from '../utils/newId';
import type { Message } from '../types/chat';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

export default function ChatRoomScreen({ route }: Props) {
  const { roomId } = route.params;
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.session.userId);
  const draft = useAppSelector((s) => s.chat.drafts[roomId] ?? '');

  const { data: messages = [], isLoading } = useGetMessagesQuery(roomId, {
    pollingInterval: 3000,
  });
  const [sendMessage] = useSendMessageMutation();
  const listRef = useRef<FlatList<Message>>(null);


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

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.senderId === userId;
    return (
      <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          {!mine && <Text style={styles.sender}>{item.senderId}</Text>}
          <Text style={mine ? styles.textMine : styles.textOther}>{item.content}</Text>
          <Text style={[styles.meta, mine ? styles.metaMine : styles.metaOther]}>
            {dayjs(item.timestamp).format('HH:mm')}
            {mine && item.status === 'sending' ? ' · Đang gửi…' : ''}
          </Text>
        </View>
        {mine && item.status === 'failed' && (
          <Pressable onPress={() => send(item.content, item.id)} hitSlop={8}>
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
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có tin nhắn. Hãy gửi tin đầu tiên.</Text>}
      />
      <View style={styles.inputBar}>
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
  sender: { fontSize: 12, fontWeight: '600', color: '#007AFF', marginBottom: 2 },
  textMine: { color: '#fff', fontSize: 16 },
  textOther: { color: '#222', fontSize: 16 },
  meta: { fontSize: 11, marginTop: 2 },
  metaMine: { color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  metaOther: { color: '#999' },
  failed: { color: '#FF3B30', fontSize: 12, marginTop: 2 },
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
