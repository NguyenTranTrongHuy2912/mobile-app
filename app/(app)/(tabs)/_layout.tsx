import React from 'react';
import { Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { XStack } from 'tamagui';
import { useGetFriendRequestsQuery, useGetRoomsQuery } from '../../../src/api/chatApi';
import { useScreenColors } from '../../../src/features/theme/useScreenColors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon =
  (active: IconName, inactive: IconName, activeColor: string, inactiveColor: string) =>
  ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons
      name={focused ? active : inactive}
      size={size}
      color={focused ? activeColor : inactiveColor}
    />
  );

export default function TabsLayout() {
  const router = useRouter();
  const C = useScreenColors();
  const icon = (active: IconName, inactive: IconName) =>
    tabIcon(active, inactive, C.brand, C.muted);

  // Tổng số tin chưa đọc của mọi phòng, dùng chung cache với danh sách phòng
  const { friendRequestCount } = useGetFriendRequestsQuery(undefined, {
    pollingInterval: 10000,
    selectFromResult: ({ data }) => ({
      friendRequestCount: data?.length ?? 0,
    }),
  });

  const { unread } = useGetRoomsQuery(undefined, {
    pollingInterval: 5000,
    selectFromResult: ({ data }) => ({
      unread: data?.reduce((sum, r) => sum + r.unreadCount, 0) ?? 0,
    }),
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: C.line, backgroundColor: C.page },
        headerTitleAlign: 'left',
        headerTitleStyle: { fontSize: 24, fontWeight: '800', color: C.ink },
        headerTintColor: C.ink,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: C.page },
      }}
    >
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: icon('chatbubble', 'chatbubble-outline'),
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: C.danger, color: '#fff' },
          headerRight: () => (
            <XStack style={{ alignItems: 'center', gap: 18, marginRight: 16 }}>
              <Pressable
                onPress={() => router.push('/new-chat')}
                hitSlop={8}
                accessibilityLabel="Chat mới"
              >
                <Ionicons name="create-outline" size={26} color={C.brand} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/new-group')}
                hitSlop={8}
                accessibilityLabel="Tạo nhóm"
              >
                <Ionicons name="people-outline" size={26} color={C.brand} />
              </Pressable>
            </XStack>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Bạn bè', tabBarIcon: icon('people', 'people-outline') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: icon('notifications', 'notifications-outline'),
          tabBarBadge:
            friendRequestCount > 0 ? (friendRequestCount > 99 ? '99+' : friendRequestCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: C.danger, color: '#fff' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Cá nhân', tabBarIcon: icon('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}
