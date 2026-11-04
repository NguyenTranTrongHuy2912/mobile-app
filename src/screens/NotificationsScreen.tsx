import React, { useState } from 'react';
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
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  useGetFriendRequestsQuery,
  useRespondFriendRequestMutation,
} from '../api/chatApi';
import { colors } from '../theme';
import type { FriendRequest } from '../types/chat';

dayjs.extend(relativeTime);

export default function NotificationsScreen() {
  const { data: requests = [], isLoading, refetch } = useGetFriendRequestsQuery();
  const [respond, { isLoading: isResponding }] = useRespondFriendRequestMutation();
  const [actionId, setActionId] = useState<string | null>(null);

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

  const renderItem = ({ item }: { item: FriendRequest }) => {
    const isBusy = isResponding && actionId === item.requestId;
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.senderName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.messageText}>
            <Text style={styles.senderName}>{item.senderName}</Text> đã gửi cho bạn lời mời kết bạn.
          </Text>
          <Text style={styles.timeText}>
            {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
          </Text>

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.requestId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
            <Text style={styles.emptySubtitle}>
              Khi có người gửi lời mời kết bạn, lời mời sẽ xuất hiện ngay tại đây.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: 8 },
  card: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0084FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  messageText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  senderName: { fontWeight: '700', color: colors.text },
  timeText: { fontSize: 12, color: colors.subtext, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  btnConfirm: { backgroundColor: '#0084FF' },
  btnConfirmText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnDelete: { backgroundColor: '#E4E6EB' },
  btnDeleteText: { color: '#050505', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
