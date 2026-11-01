import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCreateRoomMutation, useSearchUsersQuery } from '../api/chatApi';
import { errorMessage } from '../utils/errorMessage';
import type { UserSummary } from '../types/chat';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NewChat'>;

const MIN_QUERY = 2; // khớp giới hạn của backend
const DEBOUNCE_MS = 400;

export default function NewChatScreen({ navigation }: Props) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Chờ người dùng ngừng gõ rồi mới gọi API
  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text]);

  const canSearch = query.length >= MIN_QUERY;
  const { data, isFetching, isError } = useSearchUsersQuery(query, { skip: !canSearch });
  const users = canSearch ? (data ?? []) : [];
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation();

  const openChat = async (user: UserSummary) => {
    if (creating) return;
    setError(null);
    try {
      const room = await createRoom({ type: 'direct', memberIds: [user.userId] }).unwrap();
      // replace để nút Back quay về danh sách phòng, không quay lại màn hình tìm kiếm
      navigation.replace('ChatRoom', { roomId: room.id, title: room.name });
    } catch (e) {
      setError(errorMessage(e, 'Không mở được cuộc trò chuyện. Hãy thử lại.'));
    }
  };

  const renderItem = ({ item }: { item: UserSummary }) => (
    <Pressable style={styles.row} onPress={() => openChat(item)} disabled={creating}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {item.email}
        </Text>
      </View>
    </Pressable>
  );

  let emptyText: string | null = null;
  if (!canSearch) emptyText = `Nhập ít nhất ${MIN_QUERY} ký tự để tìm bằng tên hoặc email.`;
  else if (isError) emptyText = 'Không tìm được. Hãy thử lại.';
  else if (!isFetching) emptyText = 'Không tìm thấy người dùng.';

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên hoặc email"
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isFetching ? <ActivityIndicator style={styles.loading} /> : null}
      <FlatList
        data={users}
        keyExtractor={(u) => u.userId}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={emptyText ? <Text style={styles.empty}>{emptyText}</Text> : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  input: {
    margin: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: { color: '#FF3B30', marginHorizontal: 12, marginBottom: 8 },
  loading: { marginVertical: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 32, paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  rowBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#222' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', marginLeft: 72 },
});
