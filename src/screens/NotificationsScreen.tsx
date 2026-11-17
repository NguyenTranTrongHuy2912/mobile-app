import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Text, View } from 'tamagui';
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
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import { useAppSelector } from '../store/hooks';
import { formatRelativeTimeVN } from '../utils/dateFormatter';
import type { FriendRequest, UserSummary } from '../types/chat';

export default function NotificationsScreen() {
  const currentUserId = useAppSelector((s) => s.session.userId);
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const { data: requests = [], isLoading, refetch } = useGetFriendRequestsQuery();
  const [respond, { isLoading: isResponding }] = useRespondFriendRequestMutation();
  const [actionId, setActionId] = useState<string | null>(null);

  // Gợi ý kết bạn ("Những người bạn có thể biết")
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

  // Phân chia thành Mới (< 24 giờ) và Trước đó (>= 24 giờ)
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

  const renderRequestItem = (item: FriendRequest, isLast: boolean) => {
    const isBusy = isResponding && actionId === item.requestId;
    const timeAgo = formatRelativeTimeVN(item.createdAt);
    const senderName = (item.senderName ?? '').trim() || 'Người dùng';

    return (
      <View key={item.requestId} style={[styles.card, !isLast && styles.rowDivider]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.messageRow}>
            <Text style={styles.messageText}>
              <Text style={styles.senderName}>{senderName}</Text> đã gửi cho bạn lời mời kết bạn. ·{' '}
              <Text style={styles.timeInline}>{timeAgo}</Text>
            </Text>
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
        <ActivityIndicator size="large" color={C.brand} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={[1]}
        keyExtractor={() => 'notifications-root'}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refetch();
            }}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
        contentContainerStyle={styles.container}
        renderItem={() => (
          <View>
            {/* Header Mới */}
            {recentRequests.length > 0 && (
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionHeaderTitle}>Mới</Text>
              </View>
            )}
            {recentRequests.map((item, idx) =>
              renderRequestItem(item, idx === recentRequests.length - 1)
            )}

            {/* Header Trước đó */}
            {earlierRequests.length > 0 && (
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionHeaderTitle}>Trước đó</Text>
              </View>
            )}
            {earlierRequests.map((item, idx) =>
              renderRequestItem(item, idx === earlierRequests.length - 1)
            )}

            {requests.length === 0 && (
              <View style={styles.emptyWrap}>
                <Ionicons name="notifications-outline" size={48} color={C.muted} />
                <Text style={styles.emptyTitle}>Chưa có thông báo mới</Text>
                <Text style={styles.emptySub}>
                  Khi có lời mời kết bạn hoặc tin nhắn mới, hệ thống sẽ báo ngay cho bạn.
                </Text>
              </View>
            )}

            {/* Mục "Những người bạn có thể biết" */}
            {suggestedUsers.length > 0 && (
              <View style={styles.suggestedSection}>
                <View style={styles.suggestedHeaderRow}>
                  <View style={styles.suggestedTitleWrap}>
                    <Text style={styles.suggestedSectionTitle}>Những người bạn có thể biết</Text>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={C.muted}
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={20} color={C.muted} />
                </View>

                {suggestedUsers.map((user, idx) => {
                  const isSent = !!sentMap[user.userId];
                  const isLast = idx === suggestedUsers.length - 1;
                  const userName = (user.displayName ?? '').trim() || 'Người dùng';
                  return (
                    <View
                      key={user.userId}
                      style={[styles.suggestedCard, !isLast && styles.rowDivider]}
                    >
                      <View style={styles.suggestedAvatar}>
                        <Text style={styles.suggestedAvatarText}>
                          {userName.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.suggestedInfo}>
                        <Text style={styles.suggestedName} numberOfLines={1}>
                          {userName}
                        </Text>
                        <View style={styles.mutualRow}>
                          <Ionicons
                            name="people"
                            size={13}
                            color={C.muted}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.mutualText}>2 bạn chung</Text>
                        </View>
                      </View>

                      <Pressable
                        style={[styles.addFriendBtn, isSent && styles.addFriendBtnSent]}
                        onPress={() => handleAddFriend(user)}
                        disabled={isSent || isSendingReq}
                      >
                        <Text
                          style={[
                            styles.addFriendBtnText,
                            isSent && styles.addFriendBtnTextSent,
                          ]}
                        >
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

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.page },
    container: { backgroundColor: C.page, flexGrow: 1, paddingBottom: 24 },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.page,
    },

    // Đường kẻ mờ ngăn cách giữa các thẻ
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },

    // Section Header (Mới / Trước đó)
    sectionHeaderWrap: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 6,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.ink,
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
      backgroundColor: C.brand,
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
      color: C.ink,
      lineHeight: 20,
      marginRight: 8,
    },
    senderName: { fontWeight: '700', color: C.ink },
    timeInline: { fontSize: 13, color: C.muted },
    unreadBlueDot: {
      width: 9,
      height: 9,
      borderRadius: 4.5,
      backgroundColor: C.brand,
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
    btnConfirm: { backgroundColor: C.brand },
    btnConfirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnDelete: { backgroundColor: C.inputBg },
    btnDeleteText: { color: C.ink, fontSize: 14, fontWeight: '700' },
    btnDisabled: { opacity: 0.6 },

    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 36,
      paddingHorizontal: 24,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: C.ink, marginTop: 10 },
    emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 4 },

    // Gợi ý kết bạn Styles
    suggestedSection: {
      marginTop: 8,
      paddingTop: 14,
      borderTopWidth: 6,
      borderTopColor: C.inputBg,
    },
    suggestedHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 6,
    },
    suggestedTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    suggestedSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.ink,
    },
    suggestedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    suggestedAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: C.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    suggestedAvatarText: {
      fontSize: 18,
      fontWeight: '700',
      color: C.muted,
    },
    suggestedInfo: { flex: 1 },
    suggestedName: {
      fontSize: 15,
      fontWeight: '600',
      color: C.ink,
      marginBottom: 2,
    },
    mutualRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mutualText: {
      fontSize: 13,
      color: C.muted,
    },
    addFriendBtn: {
      backgroundColor: C.brand,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    addFriendBtnSent: {
      backgroundColor: C.inputBg,
    },
    addFriendBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    addFriendBtnTextSent: {
      color: C.muted,
    },
  });