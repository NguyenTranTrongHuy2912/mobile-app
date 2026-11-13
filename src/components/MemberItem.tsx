import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, XStack, YStack } from 'tamagui';
import { ActiveBadge } from './ActiveBadge';
import { useScreenColors } from '../features/theme/useScreenColors';

interface MemberItemProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isCreator?: boolean;
  isOnline?: boolean;
  isSelf?: boolean;
  onDirectChat?: () => void;
}

const AVATAR = 44;

export default function MemberItem({
  displayName,
  avatarUrl,
  isCreator = false,
  isOnline = false,
  isSelf = false,
  onDirectChat,
}: MemberItemProps) {
  const C = useScreenColors();

  return (
    <XStack
      style={{
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: C.line,
      }}
    >
      <View style={{ position: 'relative', marginRight: 12 }}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }}
          />
        ) : (
          <YStack
            style={{
              width: AVATAR,
              height: AVATAR,
              borderRadius: AVATAR / 2,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: C.brand,
            }}
          >
            <Text color="#fff" fontSize={18} fontWeight="700">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </YStack>
        )}
        {isOnline ? <ActiveBadge size={13} /> : null}
      </View>

      <YStack style={{ flex: 1 }}>
        <XStack style={{ alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <Text
            fontSize={15}
            fontWeight="600"
            numberOfLines={1}
            style={{ color: C.ink }}
          >
            {isSelf ? `${displayName} (Bạn)` : displayName}
          </Text>
          {isCreator ? (
            <View
              style={{
                backgroundColor: C.brandSoft,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text fontSize={11} fontWeight="600" style={{ color: C.brandSoftText }}>
                Trưởng nhóm
              </Text>
            </View>
          ) : null}
        </XStack>
        <Text
          fontSize={12}
          style={{
            color: isOnline ? C.success : C.muted,
            fontWeight: isOnline ? '500' : '400',
            marginTop: 2,
          }}
        >
          {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
        </Text>
      </YStack>

      {!isSelf && onDirectChat ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 8,
            backgroundColor: C.chip,
          }}
          onPress={onDirectChat}
          role="button"
          aria-label="Nhắn tin"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.brand} />
        </View>
      ) : null}
    </XStack>
  );
}