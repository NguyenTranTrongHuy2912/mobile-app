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

type Props = NativeStackScreenProps<RootStackParamList, 'NewGroup'>;

// Khớp quy tắc của backend (ChatServiceImpl): không tính người tạo
const MIN_OTHERS = 2;
const MAX_OTHERS = 99;
const MAX_NAME = 50;
const MIN_QUERY = 2;
const DEBOUNCE_MS = 400;

export default function NewGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text]);

  const canSearch = query.length >= MIN_QUERY;
  const { data, isFetching, isError } = useSearchUsersQuery(query, { skip: !canSearch });
  const users = canSearch ? (data ?? []) : [];
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation();

  const isSelected = (u: UserSummary) => selected.some((s) => s.userId === u.userId);

  const toggle = (u: UserSummary) =>
    setSelected((prev) => {
      if (prev.some((s) => s.userId === u.userId)) return prev.filter((s) => s.userId !== u.userId);
      return prev.length >= MAX_OTHERS ? prev : [...prev, u];
    });

  const canCreate = name.trim().length > 0 && selected.length >= MIN_OTHERS && !creating;

  const onCreate = async () => {
    if (!canCreate) return;
    setError(null);
    try {
      const room = await createRoom({
        type: 'group',
        name: name.trim(),
        memberIds: selected.map((u) => u.userId),
      }).unwrap();
      navigation.replace('ChatRoom', { roomId: room.id, title: room.name });
    } catch (e) {
      setError(errorMessage(e, 'Không tạo được nhóm. Hãy thử lại.'));
    }
  };

  const renderItem = ({ item }: { item: UserSummary }) => {
    const checked = isSelected(item);
    return (
      <Pressable style={styles.row} onPress={() => toggle(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <View style={[styles.check, checked && styles.checkOn]}>
          {checked ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
      </Pressable>
    );
  };

  let emptyText: string | null = null;
  if (!canSearch) emptyText = `Nhập ít nhất ${MIN_QUERY} ký tự để tìm bằng tên hoặc email.`;
  else if (isError) emptyText = 'Không tìm được. Hãy thử lại.';
  else if (!isFetching) emptyText = 'Không tìm thấy người dùng.';

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Tên nhóm"
        value={name}
        onChangeText={setName}
        maxLength={MAX_NAME}
      />

      {selected.length > 0 ? (
        <View style={styles.chips}>
          {selected.map((u) => (
            <Pressable key={u.userId} style={styles.chip} onPress={() => toggle(u)}>
              <Text style={styles.chipText}>{u.displayName} ✕</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={styles.hint}>
        Chọn ít nhất {MIN_OTHERS} người (đã chọn {selected.length})
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Tìm bằng tên hoặc email"
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {isFetching ? <ActivityIndicator style={styles.loading} /> : null}

      <FlatList
        style={styles.list}
        data={users}
        keyExtractor={(u) => u.userId}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={emptyText ? <Text style={styles.empty}>{emptyText}</Text> : undefined}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.createButton, !canCreate && styles.createDisabled]}
        onPress={onCreate}
        disabled={!canCreate}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createText}>Tạo nhóm</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  input: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 10 },
  chip: {
    backgroundColor: '#E5F1FF',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  hint: { marginHorizontal: 12, marginTop: 8, color: '#888', fontSize: 13 },
  loading: { marginVertical: 8 },
  list: { flex: 1, marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24, paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  rowBody: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#222' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', marginLeft: 72 },
  error: { color: '#FF3B30', marginHorizontal: 12, marginTop: 8 },
  createButton: {
    margin: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createDisabled: { backgroundColor: '#9fc7ff' },
  createText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
