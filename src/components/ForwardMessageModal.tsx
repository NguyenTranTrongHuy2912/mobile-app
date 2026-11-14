import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'tamagui';
import { useGetRoomsQuery } from '../api/chatApi';
import { useScreenColors, type ScreenColors } from '../features/theme/useScreenColors';
import type { Message, Room } from '../types/chat';

interface ForwardMessageModalProps {
  visible: boolean;
  currentRoomId?: string;
  message: Message | null;
  onClose: () => void;
  onForward: (targetRoomId: string) => Promise<void>;
}

export default function ForwardMessageModal({
  visible,
  currentRoomId,
  message,
  onClose,
  onForward,
}: ForwardMessageModalProps) {
  const C = useScreenColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const { data: rooms = [], isLoading } = useGetRoomsQuery();
  const [search, setSearch] = useState('');
  const [forwardingRoomId, setForwardingRoomId] = useState<string | null>(null);
  const [sentRoomIds, setSentRoomIds] = useState<Set<string>>(new Set());

  const filteredRooms = useMemo(() => {
    const list = currentRoomId ? rooms.filter((r) => r.id !== currentRoomId) : rooms;
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => r.name.toLowerCase().includes(q));
  }, [rooms, search, currentRoomId]);

  const handleForwardTo = async (roomId: string) => {
    if (forwardingRoomId || sentRoomIds.has(roomId)) return;
    setForwardingRoomId(roomId);
    try {
      await onForward(roomId);
      setSentRoomIds((prev) => new Set(prev).add(roomId));
    } catch (e) {
      console.warn('Forward failed:', e);
    } finally {
      setForwardingRoomId(null);
    }
  };

  const previewSnippet = useMemo(() => {
    if (!message) return '';
    if (message.type === 'image') return '📷 [Hình ảnh]';
    if (message.type === 'video') return '🎬 [Video]';
    if (message.type === 'file') return `📎 [Tài liệu] ${message.fileName || ''}`;
    return message.content;
  }, [message]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Chuyển tiếp tin nhắn</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={C.muted} />
            </Pressable>
          </View>

          {/* Preview Box */}
          <View style={styles.previewBox}>
            <Ionicons name="arrow-redo" size={16} color={C.brand} style={{ marginRight: 8 }} />
            <Text style={styles.previewText} numberOfLines={2}>
              {previewSnippet}
            </Text>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={C.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>

          {/* Rooms list */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={C.brand} />
            </View>
          ) : filteredRooms.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>Không tìm thấy phòng chat nào</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRooms}
              keyExtractor={(r) => r.id}
              style={styles.list}
              renderItem={({ item }: { item: Room }) => {
                const isSent = sentRoomIds.has(item.id);
                const isSending = forwardingRoomId === item.id;
                return (
                  <View style={styles.roomRow}>
                    <View style={styles.roomAvatar}>
                      <Text style={styles.roomAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.roomInfo}>
                      <Text style={styles.roomName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.roomSub} numberOfLines={1}>
                        {item.type === 'group' ? 'Nhóm trò chuyện' : 'Trò chuyện trực tiếp'}
                      </Text>
                    </View>
                    <Pressable
                      style={[
                        styles.sendBtn,
                        isSent && styles.sendBtnDone,
                        isSending && styles.sendBtnDisabled,
                      ]}
                      onPress={() => handleForwardTo(item.id)}
                      disabled={isSent || isSending}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : isSent ? (
                        <>
                          <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 2 }} />
                          <Text style={styles.sendBtnText}>Đã gửi</Text>
                        </>
                      ) : (
                        <Text style={styles.sendBtnText}>Gửi</Text>
                      )}
                    </Pressable>
                  </View>
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
      paddingVertical: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: C.ink,
    },
    closeBtn: {
      padding: 4,
    },
    previewBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.brandSoft,
      padding: 10,
      borderRadius: 10,
      marginVertical: 8,
    },
    previewText: {
      flex: 1,
      fontSize: 13,
      color: C.ink,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.inputBg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginVertical: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: C.ink,
      padding: 0,
    },
    list: {
      marginTop: 6,
    },
    roomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.line,
    },
    roomAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    roomAvatarText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    roomInfo: {
      flex: 1,
      marginRight: 12,
    },
    roomName: {
      fontSize: 15,
      fontWeight: '600',
      color: C.ink,
    },
    roomSub: {
      fontSize: 12,
      color: C.muted,
      marginTop: 2,
    },
    sendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.brand,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 8,
    },
    sendBtnDone: {
      backgroundColor: C.success,
    },
    sendBtnDisabled: {
      opacity: 0.6,
    },
    sendBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 14,
      color: C.muted,
    },
  });
