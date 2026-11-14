import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'tamagui';
import dayjs from 'dayjs';
import {
  useGetStarredMessagesQuery,
  useToggleStarMessageMutation,
} from '../api/chatApi';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import type { StarredMessageItem } from '../types/chat';

interface SavedMessagesModalProps {
  visible: boolean;
  roomId?: string;
  onClose: () => void;
  onSelectMessage: (messageId: string, roomId: string) => void;
}

export default function SavedMessagesModal({
  visible,
  roomId,
  onClose,
  onSelectMessage,
}: SavedMessagesModalProps) {
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const { data: messages = [], isLoading, refetch } = useGetStarredMessagesQuery(
    roomId ? { roomId } : undefined,
    { skip: !visible },
  );

  const [toggleStar] = useToggleStarMessageMutation();

  const handleUnstar = async (msgId: string) => {
    try {
      await toggleStar({ messageId: msgId, roomId }).unwrap();
      refetch();
    } catch (e) {
      console.warn('Unstar failed:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Ionicons name="star" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.title}>Tin nhắn đã lưu (Starred)</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={C.muted} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Các tin nhắn, hình ảnh và tài liệu bạn đã đánh dấu để xem lại
          </Text>

          {/* Messages list */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={C.brand} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="star-outline" size={48} color={C.muted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Chưa có tin nhắn nào được lưu</Text>
              <Text style={styles.emptySub}>
                Nhấn giữ bất kỳ tin nhắn nào trong phòng chat và chọn "Lưu tin nhắn ⭐"
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(m) => m.message_id}
              style={styles.list}
              renderItem={({ item }: { item: StarredMessageItem }) => {
                const isImage = item.type === 'IMAGE' || item.type === 'image';
                const isVideo = item.type === 'VIDEO' || item.type === 'video';
                const isFile = item.type === 'FILE' || item.type === 'file';
                return (
                  <Pressable
                    style={styles.card}
                    onPress={() => {
                      onClose();
                      onSelectMessage(item.message_id, item.room_id);
                    }}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.senderName}>{item.sender_name}</Text>
                      <View style={styles.cardHeaderRight}>
                        <Text style={styles.dateText}>
                          {dayjs(item.timestamp).format('HH:mm · DD/MM/YYYY')}
                        </Text>
                        <Pressable
                          style={styles.unstarBtn}
                          onPress={() => handleUnstar(item.message_id)}
                          hitSlop={8}
                        >
                          <Ionicons name="star" size={16} color="#F59E0B" />
                        </Pressable>
                      </View>
                    </View>

                    {/* Content Preview */}
                    {isImage ? (
                      <View style={styles.mediaPreview}>
                        <Ionicons name="image" size={16} color={C.brand} style={{ marginRight: 6 }} />
                        <Text style={styles.mediaText}>[Hình ảnh]</Text>
                      </View>
                    ) : isVideo ? (
                      <View style={styles.mediaPreview}>
                        <Ionicons name="videocam" size={16} color={C.brand} style={{ marginRight: 6 }} />
                        <Text style={styles.mediaText}>[Video]</Text>
                      </View>
                    ) : isFile ? (
                      <View style={styles.mediaPreview}>
                        <Ionicons name="document-text" size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
                        <Text style={styles.mediaText} numberOfLines={1}>
                          {item.file_name || item.content || '[Tài liệu đính kèm]'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.cardContent} numberOfLines={3}>
                        {item.content}
                      </Text>
                    )}
                  </Pressable>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (C: ScreenColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingBottom: 24,
      maxHeight: '80%',
      minHeight: 400,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.line,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: C.ink,
    },
    subtitle: {
      fontSize: 12,
      color: C.muted,
      marginTop: 2,
      marginBottom: 10,
    },
    closeBtn: {
      padding: 4,
    },
    list: {
      marginTop: 4,
    },
    card: {
      backgroundColor: C.screen,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.line,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    senderName: {
      fontSize: 13,
      fontWeight: '700',
      color: C.brand,
    },
    cardHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateText: {
      fontSize: 11,
      color: C.muted,
    },
    unstarBtn: {
      padding: 2,
    },
    cardContent: {
      fontSize: 14,
      color: C.ink,
      lineHeight: 20,
    },
    mediaPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
    },
    mediaText: {
      fontSize: 13,
      color: C.ink,
      fontWeight: '500',
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: C.ink,
      marginBottom: 6,
    },
    emptySub: {
      fontSize: 13,
      color: C.muted,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
