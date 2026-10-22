import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { useGetRoomsQuery } from '../api/chatApi';
import type { Room } from '../types/chat';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomList'>;

export default function RoomListScreen({ navigation }: Props) {
  const { data: rooms, isLoading, isError, refetch } = useGetRoomsQuery();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !rooms) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tải được danh sách phòng.</Text>
        <Pressable onPress={refetch} style={styles.retryButton}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Room }) => (
    <Pressable
      style={styles.row}
      onPress={() => navigation.navigate('ChatRoom', { roomId: item.id, title: item.name })}
    >
      <View style={[styles.avatar, item.type === 'group' && styles.avatarGroup]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.roomName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.lastMessageAt ? (
            <Text style={styles.time}>{dayjs(item.lastMessageAt).format('HH:mm')}</Text>
          ) : null}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.type === 'group' ? `${item.memberIds.length} thành viên · ` : ''}
          {item.lastMessage ?? 'Chưa có tin nhắn'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <FlatList
      data={rooms}
      keyExtractor={(r) => r.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#666', marginBottom: 12 },
  retryButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  list: { backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarGroup: { backgroundColor: '#34C759' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#222', marginRight: 8 },
  time: { fontSize: 12, color: '#999' },
  preview: { fontSize: 14, color: '#666', marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', marginLeft: 76 },
});
