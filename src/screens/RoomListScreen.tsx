import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useCreateRoomMutation,
  useGetFriendsQuery,
  useGetRoomsQuery,
} from '../api/chatApi';
import { useAppSelector } from '../store/hooks';
import { ActiveBadge } from '../components/ActiveBadge';
import { formatRoomListTime } from '../utils/dateFormatter';
import type { Room } from '../types/chat';

const POLL_MS = 20000;

type FilterType = 'all' | 'unread' | 'group';

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
  const myName = useAppSelector((s) => s.session.displayName) || 'Tôi';
  const onlineUserIds = useAppSelector((s) => s.presence.onlineUserIds);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: rooms, isLoading, refetch } = useGetRoomsQuery(undefined, {
    pollingInterval: POLL_MS,
  });

  const { data: friends = [] } = useGetFriendsQuery();
  const [createRoom] = useCreateRoomMutation();

  // Danh sách bạn bè đang online (Active Friends Bar)
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => !!onlineUserIds[f.userId]);
  }, [friends, onlineUserIds]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Mở chat nhanh khi bấm vào avatar bạn bè trên Active Friends Bar
  const handleOpenDirectChat = async (friendId: string, friendName: string) => {
    try {
      const room = await createRoom({ type: 'direct', memberIds: [friendId] }).unwrap();
      router.push({
        pathname: '/chat/[roomId]',
        params: { roomId: room.id, title: room.name || friendName },
      });
    } catch (e) {
      console.error('Không thể mở chat:', e);
    }
  };

  // Lọc danh sách phòng theo search & filter pills
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    let list = rooms;

    if (filter === 'unread') {
      list = list.filter((r) => r.unreadCount > 0);
    } else if (filter === 'group') {
      list = list.filter((r) => r.type === 'group');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.lastMessage && r.lastMessage.toLowerCase().includes(q))
      );
    }

    return list;
  }, [rooms, filter, searchQuery]);

  const unreadTotal = useMemo(() => {
    return rooms?.reduce((sum, r) => sum + (r.unreadCount > 0 ? 1 : 0), 0) ?? 0;
  }, [rooms]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

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

  // Header list: Search Bar + Active Friends Bar + Filter Pills (chuẩn Messenger Ảnh 1)
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* 1. Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#65676B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hỏi Meta AI hoặc tìm kiếm..."
          placeholderTextColor="#8A8D91"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#8A8D91" />
          </Pressable>
        ) : null}
      </View>

      {/* 2. Active Friends Bar (Hàng ngang bạn bè đang hoạt động) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activeBarScroll}
      >
        {/* Story / Ghi chú của tôi */}
        <View style={styles.activeItem}>
          <View style={styles.myAvatarWrap}>
            <View style={styles.storyAvatar}>
              <Text style={styles.storyAvatarText}>{myName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.addStoryPlus}>
              <Ionicons name="add" size={14} color="#fff" />
            </View>
          </View>
          <Text style={styles.activeName} numberOfLines={1}>
            Tạo tin
          </Text>
        </View>

        {/* Danh sách bạn bè Online */}
        {onlineFriends.map((f) => {
          const shortName = f.displayName.trim().split(' ').slice(-1)[0] || f.displayName;
          return (
            <Pressable
              key={f.userId}
              style={styles.activeItem}
              onPress={() => handleOpenDirectChat(f.userId, f.displayName)}
            >
              <View style={styles.friendAvatarWrap}>
                <View style={styles.storyAvatarFriend}>
                  <Text style={styles.storyAvatarText}>
                    {f.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <ActiveBadge size={15} style={styles.activeBadgePos} />
              </View>
              <Text style={styles.activeName} numberOfLines={1}>
                {shortName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 3. Filter Pills (Tất cả | Chưa đọc | Nhóm) */}
      <View style={styles.pillsRow}>
        <Pressable
          style={[styles.pill, filter === 'all' && styles.pillActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.pillText, filter === 'all' && styles.pillTextActive]}>
            Tất cả
          </Text>
        </Pressable>

        <Pressable
          style={[styles.pill, filter === 'unread' && styles.pillActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.pillText, filter === 'unread' && styles.pillTextActive]}>
            Chưa đọc{unreadTotal > 0 ? ` (${unreadTotal})` : ''}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.pill, filter === 'group' && styles.pillActive]}
          onPress={() => setFilter('group')}
        >
          <Text style={[styles.pillText, filter === 'group' && styles.pillTextActive]}>
            Nhóm
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Room }) => {
    const unread = item.unreadCount > 0;
    const isDirect = item.type === 'direct';
    const otherUserId = isDirect ? item.memberIds.find((id) => id !== myId) : undefined;
    const isOnline = otherUserId ? !!onlineUserIds[otherUserId] : false;

    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: '/chat/[roomId]',
            params: { roomId: item.id, title: item.name },
          })
        }
      >
        <View style={[styles.avatar, item.type === 'group' && styles.avatarGroup]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          {isDirect && isOnline ? <ActiveBadge size={14} /> : null}
        </View>

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.roomName, unread && styles.bold]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.lastMessageAt ? (
              <Text style={[styles.time, unread && styles.timeUnread]}>
                {formatRoomListTime(item.lastMessageAt)}
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
            {/* Chấm xanh dương báo tin nhắn chưa đọc chuẩn Messenger (Ảnh 1) */}
            {unread ? <View style={styles.unreadBlueDot} /> : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredRooms}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filter === 'unread'
              ? 'Không có tin nhắn chưa đọc nào.'
              : filter === 'group'
              ? 'Chưa có nhóm chat nào.'
              : 'Chưa có cuộc trò chuyện nào.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#65676B', marginBottom: 12 },
  retryButton: { backgroundColor: '#0084FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '600' },
  list: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 16 },
  empty: { textAlign: 'center', color: '#8A8D91', marginTop: 40, paddingHorizontal: 24, fontSize: 14 },

  // List Header Styles
  listHeaderContainer: {
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#050505',
    paddingVertical: 0,
  },

  // Active Friends Bar Styles
  activeBarScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  activeItem: {
    alignItems: 'center',
    width: 60,
  },
  myAvatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  storyAvatarFriend: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  addStoryPlus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0084FF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  activeBadgePos: {
    bottom: 0,
    right: 0,
  },
  activeName: {
    fontSize: 12,
    color: '#050505',
    textAlign: 'center',
    width: 60,
  },

  // Filter Pills Styles (Ảnh 1)
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 8,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
  },
  pillActive: {
    backgroundColor: '#E7F3FF',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050505',
  },
  pillTextActive: {
    color: '#0064D1',
    fontWeight: '700',
  },

  // Chat Item Row Styles
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0084FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarGroup: { backgroundColor: '#31A24C' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  roomName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#050505', marginRight: 8 },
  bold: { fontWeight: '700' },
  time: { fontSize: 12, color: '#65676B' },
  timeUnread: { color: '#0084FF', fontWeight: '700' },
  preview: { flex: 1, fontSize: 14, color: '#65676B' },
  previewUnread: { color: '#050505', fontWeight: '700' },
  unreadBlueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0084FF',
    marginLeft: 8,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#E4E6EB', marginLeft: 80 },
});
