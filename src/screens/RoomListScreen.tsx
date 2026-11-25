import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Spinner, Text, View } from 'tamagui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useCreateRoomMutation,
  useGetFriendsQuery,
  useGetRoomsQuery,
} from '../api/chatApi';
import { useAppSelector } from '../store/hooks';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import { ActiveBadge } from '../components/ActiveBadge';
import FloatingAiButton from '../components/FloatingAiButton';
import UserNoteModal from '../components/UserNoteModal';
import { formatRoomListTime } from '../utils/dateFormatter';
import type { Room } from '../types/chat';
import { sendCallSignal } from '../features/call/callSignalEmitter';
import { avatarCache, useAvatar } from '../services/avatarCache';

function RoomAvatar({
  userId,
  name,
  fallbackUrl,
  isGroup,
  isDirect,
  isOnline,
  styles,
}: {
  userId?: string;
  name: string;
  fallbackUrl?: string;
  isGroup: boolean;
  isDirect: boolean;
  isOnline: boolean;
  styles: any;
}) {
  const avatarUrl = useAvatar(userId, name, fallbackUrl);
  return (
    <View style={{ ...styles.avatar, ...(isGroup ? styles.avatarGroup : null) }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
      ) : (
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      )}
      {isDirect && isOnline ? <ActiveBadge size={14} /> : null}
    </View>
  );
}

function MyStoryAvatar({
  userId,
  name,
  avatarUrl,
  styles,
}: {
  userId?: string;
  name: string;
  avatarUrl?: string;
  styles: any;
}) {
  const resolved = useAvatar(userId, name, avatarUrl);
  return (
    <View style={styles.storyAvatarMe}>
      {resolved ? (
        <Image source={{ uri: resolved }} style={styles.storyAvatarImg} />
      ) : (
        <Text style={styles.storyAvatarTextMe}>{name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

function FriendStoryAvatar({
  userId,
  name,
  avatarUrl,
  styles,
}: {
  userId?: string;
  name: string;
  avatarUrl?: string;
  styles: any;
}) {
  const resolved = useAvatar(userId, name, avatarUrl);
  return (
    <View style={styles.storyAvatarFriend}>
      {resolved ? (
        <Image source={{ uri: resolved }} style={styles.storyAvatarImg} />
      ) : (
        <Text style={styles.storyAvatarText}>{name.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

export interface ThoughtNoteData {
  text: string;
  createdAt: number;
  expiresAt: number;
}

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
  const myAvatar = useAppSelector((s) => s.session.avatarUrl);
  const onlineUserIds = useAppSelector((s) => s.presence.onlineUserIds);
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchInputText, setSearchInputText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setSearchInputText(text);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    // Chờ 3 giây người dùng ngưng gõ mới tìm kiếm (hoặc ấn tìm kiếm trên bàn phím)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 3000);
  };

  const handleClearSearch = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    setSearchInputText('');
    setDebouncedQuery('');
  };

  const handleSearchSubmit = () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    setDebouncedQuery(searchInputText);
  };
  const [refreshing, setRefreshing] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [friendsNotes, setFriendsNotes] = useState<Record<string, ThoughtNoteData>>({});

  // Tải ghi chú suy nghĩ đã lưu (kiểm tra hạn 24 giờ tự động hết hạn)
  useEffect(() => {
    if (myId) {
      AsyncStorage.getItem(`@user_thought_note_${myId}`).then((saved) => {
        if (saved) {
          try {
            const parsed: ThoughtNoteData = JSON.parse(saved);
            if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
              setUserNote(parsed.text);
            } else {
              // Ghi chú đã quá 24h -> biến mất
              setUserNote('');
              AsyncStorage.removeItem(`@user_thought_note_${myId}`);
            }
          } catch {
            setUserNote(saved);
          }
        }
      });
      // Tải ghi chú của bạn bè đã lưu trong cache
      AsyncStorage.getItem(`@friends_thought_notes_${myId}`).then((saved) => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setFriendsNotes(parsed);
          } catch {}
        }
      });
    }
  }, [myId]);

  const handleSaveNote = async (newNote: string) => {
    const trimmed = newNote.trim();
    if (!trimmed) {
      setUserNote('');
      if (myId) {
        await AsyncStorage.removeItem(`@user_thought_note_${myId}`);
      }
      return;
    }
    const now = Date.now();
    const noteData: ThoughtNoteData = {
      text: trimmed,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // Đúng 24 tiếng
    };
    setUserNote(trimmed);
    if (myId) {
      await AsyncStorage.setItem(`@user_thought_note_${myId}`, JSON.stringify(noteData));
      // Phát tín hiệu chia sẻ ghi chú tới tất cả bạn bè kết nối qua WebSocket
      sendCallSignal({
        type: 'USER_NOTE_BROADCAST',
        user_id: myId,
        display_name: myName,
        note: trimmed,
        created_at: now,
        expires_at: noteData.expiresAt,
      });
    }
  };

  const shortMyName = useMemo(() => {
    const parts = myName.trim().split(' ');
    return parts[parts.length - 1] || 'Bạn';
  }, [myName]);

  const { data: rooms, isLoading, refetch } = useGetRoomsQuery(undefined, {
    pollingInterval: POLL_MS,
  });

  const { data: friends = [], refetch: refetchFriends } = useGetFriendsQuery(undefined, {
    pollingInterval: POLL_MS,
  });
  const [createRoom] = useCreateRoomMutation();

  // Tự động lưu trữ và đồng bộ toàn bộ avatar bạn bè vào cache toàn cục
  useEffect(() => {
    for (const f of friends) {
      if (f.avatarUrl) {
        avatarCache.register(f.userId, f.displayName, f.avatarUrl);
      }
    }
  }, [friends]);

  // Bản đồ avatar bạn bè phục vụ hiển thị avatar trong danh sách phòng chat
  const friendsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of friends) {
      if (f.avatarUrl) {
        map.set(f.userId, f.avatarUrl);
      }
    }
    return map;
  }, [friends]);

  // Danh sách bạn bè đang online (Active Friends Bar)
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => !!onlineUserIds[f.userId]);
  }, [friends, onlineUserIds]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchFriends()]);
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

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.lastMessage && r.lastMessage.toLowerCase().includes(q))
      );
    }

    return list;
  }, [rooms, filter, debouncedQuery]);

  const unreadTotal = useMemo(() => {
    return rooms?.reduce((sum, r) => sum + (r.unreadCount > 0 ? 1 : 0), 0) ?? 0;
  }, [rooms]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Spinner size="large" color="$brand" />
      </View>
    );
  }

  if (!rooms) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tải được danh sách phòng.</Text>
        <View onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Thử lại</Text>
        </View>
      </View>
    );
  }

  // Header list: Active Friends Bar + Filter Pills (chuẩn Messenger)
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* 1. Active Friends Bar (Hàng ngang bạn bè đang hoạt động) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activeBarScroll}
      >
        {/* Ghi chú suy nghĩ của tôi (Thought Note) */}
        <View style={styles.activeItem} onPress={() => setShowNoteModal(true)}>
          <View style={styles.myAvatarWrap}>
            {/* Bong bóng suy nghĩ nổi trên avatar */}
            <View style={styles.thoughtBadge}>
              <Text style={styles.thoughtBadgeText} numberOfLines={1}>
                {userNote ? userNote : 'Ghi chú'}
              </Text>
            </View>
            <View style={styles.thoughtTailDot} />

            <MyStoryAvatar
              userId={myId}
              name={myName}
              avatarUrl={myAvatar}
              styles={styles}
            />
          </View>
          <Text style={styles.activeName} numberOfLines={1}>
            {shortMyName}
          </Text>
        </View>

        {/* Danh sách bạn bè Online */}
        {onlineFriends.map((f) => {
          const shortName = f.displayName.trim().split(' ').slice(-1)[0] || f.displayName;
          const friendNote = friendsNotes[f.userId];
          const hasFriendNote =
            friendNote &&
            friendNote.expiresAt &&
            Date.now() < friendNote.expiresAt &&
            !!friendNote.text;

          return (
            <View
              key={f.userId}
              style={styles.activeItem}
              onPress={() => handleOpenDirectChat(f.userId, f.displayName)}
            >
              <View style={styles.friendAvatarWrap}>
                {hasFriendNote ? (
                  <>
                    <View style={styles.thoughtBadge}>
                      <Text style={styles.thoughtBadgeText} numberOfLines={1}>
                        {friendNote.text}
                      </Text>
                    </View>
                    <View style={styles.thoughtTailDot} />
                  </>
                ) : null}
                <FriendStoryAvatar
                  userId={f.userId}
                  name={f.displayName}
                  avatarUrl={f.avatarUrl}
                  styles={styles}
                />
                <ActiveBadge size={15} style={styles.activeBadgePos} />
              </View>
              <Text style={styles.activeName} numberOfLines={1}>
                {shortName}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* 3. Filter Pills (Tất cả | Chưa đọc | Nhóm) */}
      <View style={styles.pillsRow}>
        <View
          style={{ ...styles.pill, ...(filter === 'all' ? styles.pillActive : null) }}
          onPress={() => setFilter('all')}
        >
          <Text style={{ ...styles.pillText, ...(filter === 'all' ? styles.pillTextActive : null) }}>
            Tất cả
          </Text>
        </View>

        <View
          style={{ ...styles.pill, ...(filter === 'unread' ? styles.pillActive : null) }}
          onPress={() => setFilter('unread')}
        >
          <Text style={{ ...styles.pillText, ...(filter === 'unread' ? styles.pillTextActive : null) }}>
            Chưa đọc{unreadTotal > 0 ? ` (${unreadTotal})` : ''}
          </Text>
        </View>

        <View
          style={{ ...styles.pill, ...(filter === 'group' ? styles.pillActive : null) }}
          onPress={() => setFilter('group')}
        >
          <Text style={{ ...styles.pillText, ...(filter === 'group' ? styles.pillTextActive : null) }}>
            Nhóm
          </Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Room }) => {
    const unread = item.unreadCount > 0;
    const isDirect = item.type === 'direct';
    const otherUserId = isDirect ? item.memberIds.find((id) => id !== myId) : undefined;
    // Trạng thái hoạt động: Chỉ hiển thị chính xác cho người dùng ĐÃ KẾT BẠN
    const isFriend = otherUserId ? friends.some((f) => f.userId === otherUserId) : false;
    const isOnline = otherUserId && isFriend ? !!onlineUserIds[otherUserId] : false;
    const otherMember = isDirect ? item.members.find((m) => m.userId !== myId) : undefined;
    const directFriend = isDirect
      ? friends.find(
          (f) =>
            (otherUserId && f.userId === otherUserId) ||
            (f.displayName && item.name && f.displayName.trim().toLowerCase() === item.name.trim().toLowerCase())
        )
      : null;

    const initialAvatar = isDirect
      ? directFriend?.avatarUrl ||
        (otherUserId ? friendsMap.get(otherUserId) : undefined) ||
        otherMember?.avatarUrl ||
        item.avatarUrl
      : item.avatarUrl;

    return (
      <View
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: '/chat/[roomId]',
            params: { roomId: item.id, title: item.name },
          })
        }
      >
        <RoomAvatar
          userId={otherUserId}
          name={item.name}
          fallbackUrl={initialAvatar}
          isGroup={item.type === 'group'}
          isDirect={isDirect}
          isOnline={isOnline}
          styles={styles}
        />

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={{ ...styles.roomName, ...(unread ? styles.bold : null) }} numberOfLines={1}>
              {item.name}
            </Text>
            {item.lastMessageAt ? (
              <Text style={{ ...styles.time, ...(unread ? styles.timeUnread : null) }}>
                {formatRoomListTime(item.lastMessageAt)}
              </Text>
            ) : null}
          </View>

          <View style={styles.rowBottom}>
            <Text
              style={{ ...styles.preview, ...(unread ? styles.previewUnread : null) }}
              numberOfLines={1}
            >
              {previewOf(item, myId)}
            </Text>
            {/* Chấm xanh dương báo tin nhắn chưa đọc chuẩn Messenger (Ảnh 1) */}
            {unread ? <View style={styles.unreadBlueDot} /> : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Search Bar cố định ở đỉnh màn hình: Không bao giờ bị unmount, không mất focus hay đóng bàn phím */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={C.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hỏi HQ AI hoặc tìm kiếm..."
          placeholderTextColor={C.muted}
          value={searchInputText}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          blurOnSubmit={false}
        />
        {searchInputText ? (
          <Pressable onPress={handleClearSearch} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/(app)/ai-assistant')}
            hitSlop={8}
            style={{ padding: 4 }}
          >
            <Ionicons name="sparkles" size={18} color={C.brand} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={onRefresh}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={filter === 'unread' ? 'checkmark-done-circle' : filter === 'group' ? 'people' : 'chatbubbles'}
                size={40}
                color={C.brand}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'unread'
                ? 'Đã đọc hết tin nhắn!'
                : filter === 'group'
                ? 'Chưa có nhóm chat'
                : 'Chưa có cuộc trò chuyện nào'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? 'Hộp thư của bạn đang rất gọn gàng và không có tin nhắn nào bị bỏ lỡ.'
                : filter === 'group'
                ? 'Tạo ngay nhóm trò chuyện để kết nối cùng bạn bè và đồng nghiệp.'
                : 'Khám phá bạn bè mới hoặc bắt đầu gửi tin nhắn ngay bây giờ!'}
            </Text>
            <Pressable
              style={styles.emptyCtaButton}
              onPress={() => router.push(filter === 'group' ? '/new-group' : '/new-chat')}
            >
              <Ionicons
                name={filter === 'group' ? 'people-outline' : 'person-add-outline'}
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.emptyCtaText}>
                {filter === 'group' ? 'Tạo nhóm mới' : 'Bắt đầu cuộc trò chuyện'}
              </Text>
            </Pressable>
          </View>
        }
      />

      {/* Floating HQ AI Button */}
      <FloatingAiButton mode="pill" bottom={24} right={18} />

      {/* Modal tạo ghi chú suy nghĩ & cảm xúc */}
      <UserNoteModal
        visible={showNoteModal}
        currentNote={userNote}
        onClose={() => setShowNoteModal(false)}
        onSave={handleSaveNote}
        userInitial={myName.charAt(0)}
        avatarUrl={myAvatar}
      />
    </View>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({

  container: { flex: 1, backgroundColor: C.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: C.muted, marginBottom: 12 },
  retryButton: { backgroundColor: C.brand, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '600' },
  list: { flexGrow: 1, backgroundColor: C.page, paddingBottom: 16 },

  // Trạng thái rỗng (danh sách phòng trống)
  emptyCard: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.ink, marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brand,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // List Header Styles
  listHeaderContainer: {
    backgroundColor: C.page,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginTop: 8,
    marginBottom: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.ink,
    paddingVertical: 0,
  },

  // Active Friends Bar Styles
  activeBarScroll: {
    paddingHorizontal: 14,
    paddingTop: 24, // Tạo sẵn khoảng trống phía trên cho bong bóng ghi chú không bị cắt
    paddingBottom: 12,
    alignItems: 'flex-end', // Khóa đáy tất cả các cột thẳng hàng tuyệt đối
    gap: 10,
  },
  activeItem: {
    alignItems: 'center',
    width: 72,
  },
  myAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    marginBottom: 4,
  },
  thoughtBadge: {
    position: 'absolute',
    bottom: 58, // Nằm ngay phía trên avatar 54px, không làm lệch chiều cao khối
    zIndex: 2,
    minWidth: 58,
    maxWidth: 74,
    backgroundColor: C.card,
    borderWidth: 1.2,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  thoughtBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.ink,
    textAlign: 'center',
  },
  thoughtTailDot: {
    position: 'absolute',
    bottom: 52,
    left: 14,
    zIndex: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  storyAvatarMe: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.brandSoft,
    borderWidth: 2.5,
    borderColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarTextMe: {
    fontSize: 20,
    fontWeight: '700',
    color: C.brandSoftText,
  },
  friendAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    marginBottom: 4,
  },
  storyAvatarFriend: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  activeBadgePos: {
    bottom: 0,
    right: 0,
  },
  activeName: {
    fontSize: 12,
    color: C.ink,
    textAlign: 'center',
    width: 72,
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
    backgroundColor: C.inputBg,
  },
  pillActive: {
    backgroundColor: C.brandSoft,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
  },
  pillTextActive: {
    color: C.brandSoftText,
    fontWeight: '700',
  },

  // Chat Item Row Styles
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  storyAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarGroup: { backgroundColor: C.success },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  roomName: { flex: 1, fontSize: 16, fontWeight: '500', color: C.ink, marginRight: 8 },
  bold: { fontWeight: '700' },
  time: { fontSize: 12, color: C.muted },
  timeUnread: { color: C.brand, fontWeight: '700' },
  preview: { flex: 1, fontSize: 14, color: C.muted },
  previewUnread: { color: C.ink, fontWeight: '700' },
  unreadBlueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.brand,
    marginLeft: 8,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.line, marginLeft: 80 },
});
