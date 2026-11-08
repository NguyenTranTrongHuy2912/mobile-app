import React from 'react';
import { StyleSheet, Image } from 'react-native'; // Đổi sang thẻ Image của React Native
import { Ionicons } from '@expo/vector-icons';
import { Text, useTheme, View, XStack, YStack } from 'tamagui';
import { ActiveBadge } from './ActiveBadge';

interface MemberItemProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isCreator?: boolean;
  isOnline?: boolean;
  isSelf?: boolean;
  onDirectChat?: () => void;
}

const ROLE_BG = '#E7F3FF';
const ROLE_TEXT = '#0064D1';
const ONLINE = '#31A24C';

const AVATAR = 44;

export default function MemberItem({
  displayName,
  avatarUrl,
  isCreator = false,
  isOnline = false,
  isSelf = false,
  onDirectChat,
}: MemberItemProps) {
  const theme = useTheme();

  return (
    <XStack
      borderBottomColor="line"
      style={{
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
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
            backgroundColor="brand"
            style={{
              width: AVATAR,
              height: AVATAR,
              borderRadius: AVATAR / 2,
              justifyContent: 'center',
              alignItems: 'center',
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
          <Text color="ink" fontSize={15} fontWeight="600" numberOfLines={1}>
            {isSelf ? `${displayName} (Bạn)` : displayName}
          </Text>
          {isCreator ? (
            <View
              style={{
                backgroundColor: ROLE_BG,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: ROLE_TEXT }} fontSize={11} fontWeight="600">
                Trưởng nhóm
              </Text>
            </View>
          ) : null}
        </XStack>
        <Text
          fontSize={12}
          style={{
            color: isOnline ? ONLINE : (theme.muted.get() as string),
            fontWeight: isOnline ? '500' : '400',
            marginTop: 2,
          }}
        >
          {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
        </Text>
      </YStack>

      {!isSelf && onDirectChat ? (
        <View
          backgroundColor="surface"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 8,
          }}
          scale={"1 press:0.92" as any}
          onPress={onDirectChat}
          role="button"
          aria-label="Nhắn tin"
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={theme.brand.get() as string}
          />
        </View>
      ) : null}
    </XStack>
  );
}