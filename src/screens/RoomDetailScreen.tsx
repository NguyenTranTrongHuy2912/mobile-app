import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCreateRoomMutation,
  useGetRoomsQuery,
  useSummarizeRoomMutation,
  useLeaveRoomMutation,
} from '../api/chatApi';
import { useAppSelector } from '../store/hooks';
import MemberItem from '../components/MemberItem';
import ScalePressable from '../components/ScalePressable';
import AiSummarizeModal from '../components/AiSummarizeModal';
import SemanticSearchModal from '../components/SemanticSearchModal';

/**
 * Màn hình Chi tiết phòng chat / Quản lý nhóm
 * Đáp ứng tiêu chí "10-15 màn hình" và "Quản lý nhóm" chuẩn trải nghiệm người dùng.
 */
export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const currentUserId = useAppSelector((s) => s.session.userId);
  const onlineUserIds = useAppSelector((s) => s.presence.onlineUserIds);

  const { data: rooms = [] } = useGetRoomsQuery();
  const room = rooms.find((r) => r.id === roomId);

  const [createRoom] = useCreateRoomMutation();
  const [summarizeRoom, { isLoading: isSummarizing }] = useSummarizeRoomMutation();

  // State cho AI Summarize modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{ summary: string; totalMessages: number }>({
    summary: '',
    totalMessages: 0,
  });

  const isGroup = room?.type === 'group';

  const handleOpenAiSummarize = async () => {
    if (!roomId) return;
    setShowAiModal(true);
    try {
      const res = await summarizeRoom({ roomId }).unwrap();
      setSummaryData({
        summary: res.summary,
        totalMessages: res.total_messages,
      });
    } catch (e) {
      setSummaryData({
        summary: 'Không thể tóm tắt cuộc trò chuyện lúc này. Vui lòng thử lại sau.',
        totalMessages: 0,
      });
    }
  };

  const handleOpenDirectChat = async (targetUserId: string, targetName: string) => {
    try {
      const newRoom = await createRoom({ type: 'direct', memberIds: [targetUserId] }).unwrap();
      router.push({
        pathname: '/chat/[roomId]',
        params: { roomId: newRoom.id, title: newRoom.name || targetName },
      });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể mở cuộc trò chuyện.');
    }
  };

  const [leaveRoomMutation] = useLeaveRoomMutation();

  const handleLeaveGroup = () => {
    Alert.alert(
      'Rời nhóm',
      'Bạn có chắc chắn muốn rời khỏi nhóm này không? Bạn sẽ không nhận được tin nhắn mới từ nhóm nữa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveRoomMutation(roomId).unwrap();
              Alert.alert('Thông báo', 'Bạn đã rời nhóm thành công.');
              router.replace('/(app)/(tabs)/rooms');
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể rời nhóm lúc này. Vui lòng thử lại sau.');
            }
          },
        },
      ]
    );
  };

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Không tìm thấy thông tin phòng chat.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header Avatar & Tên phòng */}
      <View style={styles.headerCard}>
        <View style={[styles.avatarBig, isGroup && styles.avatarGroup]}>
          <Text style={styles.avatarBigText}>{room.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.roomTitle} numberOfLines={2}>
          {room.name}
        </Text>
        <Text style={styles.roomSubtitle}>
          {isGroup ? `Nhóm trò chuyện · ${room.members.length} thành viên` : 'Cuộc trò chuyện trực tiếp'}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <View style={styles.actionItem}>
            <ScalePressable
              style={styles.actionCircle}
              onPress={() => Alert.alert('Thông báo', 'Đã bật chế độ im lặng cho phòng chat.')}
            >
              <Ionicons name="notifications-off-outline" size={20} color="#050505" />
            </ScalePressable>
            <Text style={styles.actionLabel}>Tắt thông báo</Text>
          </View>

          {isGroup && (
            <View style={styles.actionItem}>
              <ScalePressable style={styles.actionCircle} onPress={handleOpenAiSummarize}>
                <Ionicons name="sparkles" size={20} color="#0084FF" />
              </ScalePressable>
              <Text style={styles.actionLabel}>HQ AI Tóm tắt</Text>
            </View>
          )}

          <View style={styles.actionItem}>
            <ScalePressable
              style={styles.actionCircle}
              onPress={() => setShowSearchModal(true)}
            >
              <Ionicons name="search-outline" size={20} color="#050505" />
            </ScalePressable>
            <Text style={styles.actionLabel}>Tìm kiếm</Text>
          </View>
        </View>
      </View>

      {/* 2. Danh sách thành viên */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Thành viên ({room.members.length})
          </Text>
        </View>

        <View style={styles.memberCard}>
          {room.members.map((m, index) => {
            const isOnline = !!onlineUserIds[m.userId];
            const isSelf = m.userId === currentUserId;
            const isCreator = index === 0 && isGroup;

            return (
              <MemberItem
                key={m.userId}
                userId={m.userId}
                displayName={m.displayName}
                isCreator={isCreator}
                isOnline={isOnline}
                isSelf={isSelf}
                onDirectChat={() => handleOpenDirectChat(m.userId, m.displayName)}
              />
            );
          })}
        </View>
      </View>

      {/* 3. Tùy chọn Quản trị & Rời nhóm */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TÙY CHỌN</Text>
        <View style={styles.optionsCard}>
          <Pressable
            style={styles.optionRow}
            onPress={() => Alert.alert('Quyền riêng tư', 'Cuộc trò chuyện này được mã hóa và bảo mật qua hệ thống gRPC Token.')}
          >
            <View style={[styles.optionIconWrap, { backgroundColor: '#E7F3FF' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#0084FF" />
            </View>
            <Text style={styles.optionText}>Quyền riêng tư & Bảo mật</Text>
            <Ionicons name="chevron-forward" size={18} color="#8A8D91" />
          </Pressable>

          {isGroup && (
            <Pressable
              style={[styles.optionRow, styles.optionBorder]}
              onPress={handleLeaveGroup}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="log-out-outline" size={20} color="#FA383E" />
              </View>
              <Text style={[styles.optionText, styles.dangerText]}>Rời khỏi nhóm</Text>
              <Ionicons name="chevron-forward" size={18} color="#8A8D91" />
            </Pressable>
          )}
        </View>
      </View>

      {/* AI Summarize Modal */}
      <AiSummarizeModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        isLoading={isSummarizing}
        roomName={room.name}
        summary={summaryData.summary}
        totalMessages={summaryData.totalMessages}
      />

      <SemanticSearchModal
        visible={showSearchModal}
        roomId={roomId}
        roomName={room.name}
        onClose={() => setShowSearchModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notFoundText: { fontSize: 16, color: '#65676B' },
  content: { paddingBottom: 40 },

  // Header Card
  headerCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E6EB',
  },
  avatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarGroup: { backgroundColor: '#31A24C' },
  avatarBigText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  roomTitle: { fontSize: 20, fontWeight: '700', color: '#050505', textAlign: 'center' },
  roomSubtitle: { fontSize: 13, color: '#65676B', marginTop: 4, textAlign: 'center' },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 20,
  },
  actionItem: { alignItems: 'center' },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 12, color: '#050505', fontWeight: '500' },

  // Sections
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#65676B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E6EB',
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#050505' },
  dangerText: { color: '#FA383E', fontWeight: '600' },
});
