import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useGetRoomsQuery } from '../api/chatApi';
import { useAppSelector } from '../store/hooks';
import type { Room } from '../types/chat';

// Tạm thời làm mới định kỳ để thấy tin mới / số chưa đọc, cho đến khi có realtime
const POLL_MS = 5000;

const formatTime = (ts: number) => {
  const d = dayjs(ts);
  return d.isSame(dayjs(), 'day') ? d.format('HH:mm') : d.format('DD/MM');
};

function previewOf(room: Room, myId: string): string {
  if (!room.lastMessage) {
    return room.type === 'group'
      ? `${room.members.length} thành viên · Chưa có tin nhắn`
      : 'Chưa có tin nhắn';
  }
  if (room.lastMessageSenderId === myId) return `Bạn: ${room.lastMessage}`;
  if (room.type === 'group') {
    const sender = room.members.find((m) => m.userId === room.lastMessageSenderId);
    return `${sender?.displayName ?? 'Người dùng'}: ${room.lastMessage}`;
  }
  return room.lastMessage;
}

export default function RoomListScreen() {
  const router = useRouter();
  const myId = useAppSelector((s) => s.session.userId);
  const { data: rooms, isLoading, refetch } = useGetRoomsQuery(undefined, {
    pollingInterval: POLL_MS,
  });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // Chỉ báo lỗi khi chưa có dữ liệu nào; nếu đã có thì giữ danh sách cũ khi một lần làm mới thất bại
  if (!rooms) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tải được danh sách phòng.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Room }) => {
    const unread = item.unreadCount > 0;
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push({ pathname: '/chat/[roomId]', params: { roomId: item.id, title: item.name } })}
      >
        <View style={[styles.avatar, item.type === 'group' && styles.avatarGroup]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.roomName, unread && styles.bold]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.lastMessageAt ? (
              <Text style={[styles.time, unread && styles.timeUnread]}>
                {formatTime(item.lastMessageAt)}
              </Text>
            ) : null}
          </View>
          <View style={styles.rowBottom}>
            <Text
              style={[styles.preview, unread && styles.previewUnread]}
              numberOfLines={1}
            >
              {previewOf(item, myId)}
            </Text>
            {unread ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => router.push('/new-chat')}>
          <Text style={styles.actionText}>+ Chat mới</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.actionGroup]}
          onPress={() => router.push('/new-group')}
        >
          <Text style={styles.actionText}>+ Tạo nhóm</Text>
        </Pressable>
      </View>
      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Chưa có cuộc trò chuyện nào. Hãy bắt đầu bằng "Chat mới" hoặc "Tạo nhóm".
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#666', marginBottom: 12 },
  retryButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  actionGroup: { backgroundColor: '#34C759', marginRight: 0 },
  actionText: { color: '#fff', fontWeight: '600' },
  list: { flexGrow: 1, backgroundColor: '#fff' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, paddingHorizontal: 24 },
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
  rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  roomName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#222', marginRight: 8 },
  bold: { fontWeight: '800' },
  time: { fontSize: 12, color: '#999' },
  timeUnread: { color: '#007AFF', fontWeight: '600' },
  preview: { flex: 1, fontSize: 14, color: '#666' },
  previewUnread: { color: '#222', fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', marginLeft: 76 },
});
