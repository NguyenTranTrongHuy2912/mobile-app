import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Text, View } from 'tamagui';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useCreateRoomMutation,
  useGetFriendsQuery,
  useSearchUsersQuery,
  useSendFriendRequestMutation,
} from '../api/chatApi';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import { useAppSelector } from '../store/hooks';
import { ActiveBadge } from '../components/ActiveBadge';
import FloatingAiButton from '../components/FloatingAiButton';
import { errorMessage } from '../utils/errorMessage';
import type { Friend, UserSummary } from '../types/chat';

type SubTab = 'friends' | 'find';

export default function FriendsScreen() {
  const router = useRouter();
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const currentUserId = useAppSelector((s) => s.session.userId);
  const onlineUserIds = useAppSelector((s) => s.presence.onlineUserIds);

  const [activeTab, setActiveTab] = useState<SubTab>('friends');
  const [friendSearch, setFriendSearch] = useState('');
  const [findSearch, setFindSearch] = useState('');
  const [friendFilter, setFriendFilter] = useState<'all' | 'active'>('all');
  const [sentUserIds, setSentUserIds] = useState<Record<string, boolean>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // 1. Danh sách bạn bè hiện tại
  const {
    data: friends = [],
    isLoading: loadingFriends,
    isFetching: fetchingFriends,
    refetch: refetchFriends,
  } = useGetFriendsQuery();

  // 2. Tìm kiếm người dùng mới
  const canSearchNew = findSearch.trim().length >= 2;
  const {
    data: searchResults = [],
    isFetching: searchingUsers,
    isError: searchError,
  } = useSearchUsersQuery(findSearch.trim(), { skip: !canSearchNew });

  const [createRoom, { isLoading: creatingRoom }] = useCreateRoomMutation();
  const [sendFriendRequest, { isLoading: sendingRequest }] = useSendFriendRequestMutation();

  // Lọc bạn bè theo ô tìm kiếm nhanh
  const filteredFriends = useMemo(() => {
    let list = friends;
    if (friendFilter === 'active') {
      list = list.filter((f) => !!onlineUserIds[f.userId]);
    }
    const q = friendSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (f) =>
        (f.displayName ?? '').toLowerCase().includes(q) ||
        (f.email && f.email.toLowerCase().includes(q))
    );
  }, [friends, friendFilter, onlineUserIds, friendSearch]);

  const onlineFriendsCount = useMemo(() => {
    return friends.filter((f) => !!onlineUserIds[f.userId]).length;
  }, [friends, onlineUserIds]);

  // Set các ID của bạn bè để phân biệt trong màn tìm kiếm
  const friendIdSet = useMemo(() => new Set(friends.map((f) => f.userId)), [friends]);

  // Mở chat trực tiếp 1-1
  const handleOpenChat = async (userId: string, name: string) => {
    if (creatingRoom) return;
    try {
      const room = await createRoom({ type: 'direct', memberIds: [userId] }).unwrap();
      router.push({
        pathname: '/chat/[roomId]',
        params: { roomId: room.id, title: room.name || name },
      });
    } catch (e) {
      setFeedbackMsg({
        text: errorMessage(e, 'Không thể mở cuộc trò chuyện'),
        isError: true,
      });
    }
  };

  // Gửi lời mời kết bạn
  const handleSendRequest = async (user: UserSummary) => {
    if (sendingRequest || sentUserIds[user.userId]) return;
    try {
      await sendFriendRequest(user.userId).unwrap();
      setSentUserIds((prev) => ({ ...prev, [user.userId]: true }));
      setFeedbackMsg({
        text: `Đã gửi lời mời tới ${user.displayName}! Hãy nhắc đối phương vào tab Thông báo để xác nhận nhé.`,
        isError: false,
      });
      setTimeout(() => setFeedbackMsg(null), 4500);
    } catch (e) {
      const m = errorMessage(e, 'Không thể gửi lời mời kết bạn');
      if (
        m.includes('trước đó') ||
        m.includes('đã là bạn') ||
        m.toLowerCase().includes('already') ||
        m.toLowerCase().includes('conflict')
      ) {
        setSentUserIds((p) => ({ ...p, [user.userId]: true }));
        setFeedbackMsg({
          text: `Bạn đã gửi lời mời tới ${user.displayName} trước đó rồi. Đang chờ người này mở tab Thông báo để Chấp nhận.`,
          isError: false,
        });
      } else {
        setFeedbackMsg({
          text: m,
          isError: true,
        });
      }
      setTimeout(() => setFeedbackMsg(null), 4500);
    }
  };

  // Render từng bạn bè
  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isOnline = !!onlineUserIds[item.userId];
    const friendName = (item.displayName ?? '').trim() || 'Người dùng';

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarWrap}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {friendName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isOnline ? <ActiveBadge size={13} /> : null}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {friendName}
          </Text>
          {isOnline ? (
            <Text style={[styles.userSub, { color: '#31A24C', fontWeight: '600' }]} numberOfLines={1}>
              ● Đang hoạt động
            </Text>
          ) : item.email ? (
            <Text style={styles.userSub} numberOfLines={1}>
              {item.email}
            </Text>
          ) : null}
        </View>

        <Pressable
          style={styles.messageButton}
          onPress={() => handleOpenChat(item.userId, friendName)}
          disabled={creatingRoom}
        >
          <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
          <Text style={styles.messageButtonText}>Nhắn tin</Text>
        </Pressable>
      </View>
    );
  };

  // Render người dùng tìm thấy
  const renderSearchResultItem = ({ item }: { item: UserSummary }) => {
    if (item.userId === currentUserId) return null;
    const isFriend = friendIdSet.has(item.userId);
    const hasSent = !!sentUserIds[item.userId];
    const isOnline = !!onlineUserIds[item.userId];
    const userName = (item.displayName ?? '').trim() || 'Người dùng';

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isOnline ? <ActiveBadge size={13} /> : null}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.userSub} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {isFriend ? (
          <Pressable
            style={styles.messageButton}
            onPress={() => handleOpenChat(item.userId, userName)}
            disabled={creatingRoom}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
            <Text style={styles.messageButtonText}>Nhắn tin</Text>
          </Pressable>
        ) : hasSent ? (
          <View style={styles.sentBadge}>
            <Ionicons name="checkmark-circle" size={16} color={C.brand} />
            <Text style={styles.sentBadgeText}>Đã gửi</Text>
          </View>
        ) : (
          <Pressable
            style={styles.addFriendButton}
            onPress={() => handleSendRequest(item)}
            disabled={sendingRequest}
          >
            <Ionicons name="person-add" size={16} color={C.brand} />
            <Text style={styles.addFriendText}>Kết bạn</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Subtab Header */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === 'friends' && styles.tabButtonActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'friends' ? C.brand : C.muted}
          />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Bạn bè ({friends.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'find' && styles.tabButtonActive]}
          onPress={() => setActiveTab('find')}
        >
          <Ionicons
            name="person-add"
            size={18}
            color={activeTab === 'find' ? C.brand : C.muted}
          />
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>
            Tìm người mới
          </Text>
        </Pressable>
      </View>

      {/* Thông báo thao tác */}
      {feedbackMsg ? (
        <View
          style={[
            styles.feedbackBanner,
            feedbackMsg.isError ? styles.feedbackError : styles.feedbackSuccess,
          ]}
        >
          <Ionicons
            name={feedbackMsg.isError ? 'alert-circle' : 'checkmark-circle'}
            size={18}
            color={feedbackMsg.isError ? C.danger : C.isDark ? '#81C784' : '#2e7d32'}
          />
          <Text
            style={[
              styles.feedbackText,
              feedbackMsg.isError ? styles.feedbackTextError : styles.feedbackTextSuccess,
            ]}
          >
            {feedbackMsg.text}
          </Text>
        </View>
      ) : null}

      {/* Nội dung Tab 1: Bạn bè */}
      {activeTab === 'friends' && (
        <View style={styles.contentWrap}>
          {/* Filter Pills */}
          <View style={styles.messengerPillsRow}>
            <Pressable
              style={[
                styles.messengerPill,
                friendFilter === 'active' && styles.messengerPillActive,
              ]}
              onPress={() => setFriendFilter('active')}
            >
              <View style={styles.greenDotSmall} />
              <Text
                style={[
                  styles.messengerPillText,
                  friendFilter === 'active' && styles.messengerPillTextActive,
                ]}
              >
                {onlineFriendsCount} đang hoạt động
              </Text>
            </Pressable>

            <Pressable
              style={styles.messengerPill}
              onPress={() => router.push('/(app)/(tabs)/notifications')}
            >
              <Text style={styles.messengerPillText}>Lời mời kết bạn</Text>
            </Pressable>

            <Pressable
              style={[
                styles.messengerPill,
                friendFilter === 'all' && styles.messengerPillActive,
              ]}
              onPress={() => setFriendFilter('all')}
            >
              <Text
                style={[
                  styles.messengerPillText,
                  friendFilter === 'all' && styles.messengerPillTextActive,
                ]}
              >
                Tất cả
              </Text>
            </Pressable>
          </View>

          {friends.length > 0 && (
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color={C.muted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm trong danh sách bạn bè..."
                placeholderTextColor={C.muted}
                value={friendSearch}
                onChangeText={setFriendSearch}
                autoCorrect={false}
              />
              {friendSearch.length > 0 && (
                <Pressable onPress={() => setFriendSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </Pressable>
              )}
            </View>
          )}

          {loadingFriends ? (
            <ActivityIndicator style={styles.centerLoader} size="large" color={C.brand} />
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.userId}
              renderItem={renderFriendItem}
              refreshControl={
                <RefreshControl
                  refreshing={fetchingFriends}
                  onRefresh={() => {
                    refetchFriends();
                  }}
                  tintColor={C.brand}
                  colors={[C.brand]}
                />
              }
              contentContainerStyle={
                filteredFriends.length === 0 ? styles.emptyContainer : styles.listContent
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="people-outline" size={48} color={C.muted} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {friends.length === 0
                      ? 'Chưa có bạn bè nào'
                      : 'Không tìm thấy bạn bè phù hợp'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {friends.length === 0
                      ? 'Hãy chuyển sang tab "Tìm người mới" để kết nối với mọi người nhé!'
                      : 'Thử kiểm tra lại tên hoặc email bạn vừa nhập.'}
                  </Text>
                  {friends.length === 0 && (
                    <Pressable style={styles.ctaButton} onPress={() => setActiveTab('find')}>
                      <Ionicons name="person-add" size={18} color="#fff" />
                      <Text style={styles.ctaButtonText}>Tìm người mới ngay</Text>
                    </Pressable>
                  )}
                </View>
              }
            />
          )}
        </View>
      )}

      {/* Nội dung Tab 2: Tìm người mới */}
      {activeTab === 'find' && (
        <View style={styles.contentWrap}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={18} color={C.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nhập tên hoặc email (tối thiểu 2 ký tự)..."
              placeholderTextColor={C.muted}
              value={findSearch}
              onChangeText={setFindSearch}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            {findSearch.length > 0 && (
              <Pressable onPress={() => setFindSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={C.muted} />
              </Pressable>
            )}
          </View>

          {searchingUsers && (
            <ActivityIndicator style={styles.searchLoader} size="small" color={C.brand} />
          )}

          <FlatList
            data={canSearchNew ? searchResults.filter((u) => u.userId !== currentUserId) : []}
            keyExtractor={(item) => item.userId}
            renderItem={renderSearchResultItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={44} color={C.muted} />
                </View>
                <Text style={styles.emptyTitle}>
                  {!canSearchNew
                    ? 'Tìm kiếm bạn bè mới'
                    : searchError
                      ? 'Lỗi khi tìm kiếm'
                      : !searchingUsers
                        ? 'Không tìm thấy người dùng'
                        : 'Đang tìm kiếm...'}
                </Text>
                <Text style={styles.emptySub}>
                  {!canSearchNew
                    ? 'Nhập tên hoặc địa chỉ email của người bạn muốn kết bạn.'
                    : searchError
                      ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
                      : !searchingUsers
                        ? 'Hãy thử tìm bằng từ khóa hoặc email chính xác hơn.'
                        : ''}
                </Text>
              </View>
            }
          />
        </View>
      )}
      <FloatingAiButton mode="circle" bottom={24} right={20} />
    </View>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    messengerPillsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 8,
      gap: 8,
      backgroundColor: C.screen,
    },
    messengerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: C.inputBg,
    },
    messengerPillActive: {
      backgroundColor: C.brandSoft,
    },
    greenDotSmall: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#31A24C',
      marginRight: 6,
    },
    messengerPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.ink,
    },
    messengerPillTextActive: {
      color: C.brand,
      fontWeight: '700',
    },

    container: { flex: 1, backgroundColor: C.screen },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: C.page,
      borderBottomWidth: 1,
      borderBottomColor: C.line,
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 12,
    },
    tabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 2.5,
      borderBottomColor: 'transparent',
      gap: 6,
    },
    tabButtonActive: {
      borderBottomColor: C.brand,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: C.muted,
    },
    tabTextActive: {
      color: C.brand,
      fontWeight: '700',
    },
    contentWrap: { flex: 1 },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.inputBg,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      height: 40,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: C.ink,
      paddingVertical: 0,
    },
    searchLoader: { marginVertical: 8 },
    centerLoader: { marginTop: 48 },
    listContent: { paddingVertical: 8 },
    emptyContainer: { flexGrow: 1, justifyContent: 'center' },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    avatarWrap: { marginRight: 14 },
    avatarImage: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: C.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      color: C.brand,
      fontSize: 20,
      fontWeight: '700',
    },
    userInfo: { flex: 1, marginRight: 10 },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: C.ink,
    },
    userSub: {
      fontSize: 13,
      color: C.muted,
      marginTop: 2,
    },
    messageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.brand,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 18,
      gap: 6,
    },
    messageButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    addFriendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.brandSoft,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 18,
      gap: 6,
    },
    addFriendText: {
      color: C.brand,
      fontSize: 13,
      fontWeight: '600',
    },
    sentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.inputBg,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      gap: 4,
    },
    sentBadgeText: {
      color: C.muted,
      fontSize: 13,
      fontWeight: '500',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.line,
      marginLeft: 80,
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingTop: 64,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: C.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: C.ink,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySub: {
      fontSize: 14,
      color: C.muted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.brand,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 22,
      gap: 8,
    },
    ctaButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    feedbackBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      gap: 8,
    },
    feedbackSuccess: {
      backgroundColor: C.isDark ? 'rgba(46, 125, 50, 0.22)' : '#E8F5E9',
    },
    feedbackError: {
      backgroundColor: C.dangerSoft,
    },
    feedbackText: { flex: 1, fontSize: 13, fontWeight: '500' },
    feedbackTextSuccess: {
      color: C.isDark ? '#81C784' : '#2e7d32',
    },
    feedbackTextError: {
      color: C.danger,
    },
  });