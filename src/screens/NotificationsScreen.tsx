import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import FloatingAiButton from '../components/FloatingAiButton';
import {
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useRespondFriendRequestMutation,
  useGetSuggestedUsersQuery,
  useSendFriendRequestMutation,
} from '../api/chatApi';
import { useAppSelector } from '../store/hooks';
import { formatRelativeTimeVN } from '../utils/dateFormatter';
import type { FriendRequest, UserSummary } from '../types/chat';

export default function NotificationsScreen() {
  const currentUserId = useAppSelector((s) => s.session.userId);

  const { data: requests = [], isLoading, refetch } = useGetFriendRequestsQuery();
  const [respond, { isLoading: isResponding }] = useRespondFriendRequestMutation();
  const [actionId, setActionId] = useState<string | null>(null);

  // Gợi ý kết bạn ("Những người bạn có thể biết") - Lấy danh sách an toàn, không chứa tài khoản Admin
  const { data: friends = [] } = useGetFriendsQuery();
  const { data: suggestedList = [] } = useGetSuggestedUsersQuery();
  const [sendFriendRequest, { isLoading: isSendingReq }] = useSendFriendRequestMutation();
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  // Lọc danh sách gợi ý (không phải mình, chưa là bạn bè, chưa gửi lời mời tới mình)
  const suggestedUsers = useMemo(() => {
    const friendIdSet = new Set(friends.map((f) => f.userId));
    const reqSenderSet = new Set(requests.map((r) => r.senderId));
    return suggestedList
      .filter(
        (u) =>
          u.userId !== currentUserId &&
          !friendIdSet.has(u.userId) &&
          !reqSenderSet.has(u.userId)
      )
      .slice(0, 5);
  }, [suggestedList, friends, requests, currentUserId]);

  const handleRespond = async (requestId: string, accept: boolean) => {
    setActionId(requestId);
    try {
      await respond({ requestId, accept }).unwrap();
    } catch (e) {
      console.warn('Lỗi xử lý lời mời:', e);
    } finally {
      setActionId(null);
    }
  };

  const handleAddFriend = async (user: UserSummary) => {
    if (isSendingReq || sentMap[user.userId]) return;
    try {
      await sendFriendRequest(user.userId).unwrap();
      setSentMap((prev) => ({ ...prev, [user.userId]: true }));
    } catch (e) {
      console.warn('Lỗi gửi lời mời:', e);
    }
  };

  // Phân chia thành Mới (< 24 giờ) và Trước đó (>= 24 giờ) chuẩn Messenger (Ảnh 3)
  const { recentRequests, earlierRequests } = useMemo(() => {
    const now = dayjs();
    const recent: FriendRequest[] = [];
    const earlier: FriendRequest[] = [];
    requests.forEach((r) => {
      if (now.diff(dayjs(r.createdAt), 'hour') < 24) {
        recent.push(r);
      } else {
        earlier.push(r);
      }
    });
    return { recentRequests: recent, earlierRequests: earlier };
  }, [requests]);

  const renderRequestItem = (item: FriendRequest) => {
    const isBusy = isResponding && actionId === item.requestId;
    const timeAgo = formatRelativeTimeVN(item.createdAt);

    return (
      <View key={item.requestId} style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.senderName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.messageRow}>
            <Text style={styles.messageText}>
              <Text style={styles.senderName}>{item.senderName}</Text> đã gửi cho bạn lời mời kết bạn. ·{' '}
              <Text style={styles.timeInline}>{timeAgo}</Text>
            </Text>
            {/* Chấm tròn xanh dương báo thông báo chưa đọc (Ảnh 3) */}
            <View style={styles.unreadBlueDot} />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnConfirm, isBusy && styles.btnDisabled]}
              onPress={() => handleRespond(item.requestId, true)}
              disabled={isBusy}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnConfirmText}>Xác nhận</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnDelete, isBusy && styles.btnDisabled]}
              onPress={() => handleRespond(item.requestId, false)}
              disabled={isBusy}
            >
              <Text style={styles.btnDeleteText}>Xóa</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && requests.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0084FF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
      data={[1]} // Fake single item để dùng FlatList với pull-to-refresh
      keyExtractor={() => 'notifications-root'}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); }} />}
      contentContainerStyle={styles.container}
      renderItem={() => (
        <View>
          {/* Header Mới */}
          {recentRequests.length > 0 && (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionHeaderTitle}>Mới</Text>
            </View>
          )}
          {recentRequests.map(renderRequestItem)}

          {/* Header Trước đó */}
          {earlierRequests.length > 0 && (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionHeaderTitle}>Trước đó</Text>
            </View>
          )}
          {earlierRequests.map(renderRequestItem)}

          {requests.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-outline" size={48} color="#8A8D91" />
              <Text style={styles.emptyTitle}>Chưa có thông báo mới</Text>
              <Text style={styles.emptySub}>
                Khi có lời mời kết bạn hoặc tin nhắn mới, hệ thống sẽ báo ngay cho bạn.
              </Text>
            </View>
          )}

          {/* Mục "Những người bạn có thể biết" chuẩn Messenger (Ảnh 3) */}
          {suggestedUsers.length > 0 && (
            <View style={styles.suggestedSection}>
              <View style={styles.suggestedHeaderRow}>
                <View style={styles.suggestedTitleWrap}>
                  <Text style={styles.suggestedSectionTitle}>Những người bạn có thể biết</Text>
                  <Ionicons name="information-circle-outline" size={16} color="#65676B" style={{ marginLeft: 6 }} />
                </View>
                <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
              </View>

              {suggestedUsers.map((user) => {
                const isSent = !!sentMap[user.userId];
                return (
                  <View key={user.userId} style={styles.suggestedCard}>
                    <View style={styles.suggestedAvatar}>
                      <Text style={styles.suggestedAvatarText}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.suggestedInfo}>
                      <Text style={styles.suggestedName} numberOfLines={1}>
                        {user.displayName}
                      </Text>
                      <View style={styles.mutualRow}>
                        <Ionicons name="people" size={13} color="#65676B" style={{ marginRight: 4 }} />
                        <Text style={styles.mutualText}>2 bạn chung</Text>
                      </View>
                    </View>

                    <Pressable
                      style={[
                        styles.addFriendBtn,
                        isSent && styles.addFriendBtnSent,
                      ]}
                      onPress={() => handleAddFriend(user)}
                      disabled={isSent || isSendingReq}
                    >
                      <Text style={[styles.addFriendBtnText, isSent && styles.addFriendBtnTextSent]}>
                        {isSent ? 'Đã gửi' : 'Thêm bạn bè'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    />
      <FloatingAiButton mode="circle" bottom={24} right={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flexGrow: 1, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Section Header (Mới / Trước đó)
  sectionHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#050505',
  },

  // Notification Card
  card: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0084FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
    marginRight: 8,
  },
  senderName: { fontWeight: '700', color: '#050505' },
  timeInline: { fontSize: 13, color: '#65676B' },
  unreadBlueDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0084FF',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  btnConfirm: { backgroundColor: '#0084FF' },
  btnConfirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnDelete: { backgroundColor: '#E4E6EB' },
  btnDeleteText: { color: '#050505', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#050505', marginTop: 10 },
  emptySub: { fontSize: 13, color: '#65676B', textAlign: 'center', marginTop: 4 },

  // Gợi ý kết bạn Styles (Ảnh 3)
  suggestedSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 6,
    borderTopColor: '#F0F2F5',
  },
  suggestedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  suggestedTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestedSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#050505',
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E4E6EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestedAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#65676B',
  },
  suggestedInfo: { flex: 1 },
  suggestedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 2,
  },
  mutualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutualText: {
    fontSize: 13,
    color: '#65676B',
  },
  addFriendBtn: {
    backgroundColor: '#0084FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addFriendBtnSent: {
    backgroundColor: '#E4E6EB',
  },
  addFriendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  addFriendBtnTextSent: {
    color: '#65676B',
  },
});
