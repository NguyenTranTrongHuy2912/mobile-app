import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveBadge } from './ActiveBadge';
import ScalePressable from './ScalePressable';

interface MemberItemProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isCreator?: boolean;
  isOnline?: boolean;
  isSelf?: boolean;
  onDirectChat?: () => void;
}

/**
 * Hiển thị một thành viên trong màn hình chi tiết phòng chat
 */
export default function MemberItem({
  displayName,
  avatarUrl,
  isCreator = false,
  isOnline = false,
  isSelf = false,
  onDirectChat,
}: MemberItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {isOnline ? <ActiveBadge size={13} style={styles.badgePos} /> : null}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName} {isSelf && '(Bạn)'}
          </Text>
          {isCreator && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Trưởng nhóm</Text>
            </View>
          )}
        </View>
        <Text style={[styles.status, isOnline && styles.statusOnline]}>
          {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
        </Text>
      </View>

      {!isSelf && onDirectChat && (
        <ScalePressable style={styles.chatBtn} onPress={onDirectChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0084FF" />
        </ScalePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E6EB',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  badgePos: {
    bottom: -1,
    right: -1,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  roleBadge: {
    backgroundColor: '#E7F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0064D1',
  },
  status: {
    fontSize: 12,
    color: '#65676B',
    marginTop: 2,
  },
  statusOnline: {
    color: '#31A24C',
    fontWeight: '500',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
