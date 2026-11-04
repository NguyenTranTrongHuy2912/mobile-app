import React from 'react';
import { Pressable, StyleSheet, View} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGetFriendRequestsQuery, useGetRoomsQuery } from '../../../src/api/chatApi';
import { colors } from '../../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon =
  (active: IconName, inactive: IconName) =>
  ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons
      name={focused ? active : inactive}
      size={size}
      color={focused ? colors.primary : colors.subtext}
    />
  );

export default function TabsLayout() {
  const router = useRouter();

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.background },
        headerTitleAlign: 'left',
        headerTitleStyle: { fontSize: 24, fontWeight: '800', color: colors.text },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: tabIcon('chatbubble', 'chatbubble-outline'),
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, color: '#fff' },
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/new-chat')}
                hitSlop={8}
                accessibilityLabel="Chat mới"
              >
                <Ionicons name="create-outline" size={26} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/new-group')}
                hitSlop={8}
                accessibilityLabel="Tạo nhóm"
              >
                <Ionicons name="people-outline" size={26} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Bạn bè', tabBarIcon: tabIcon('people', 'people-outline') }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: tabIcon('notifications', 'notifications-outline'),
          tabBarBadge: friendRequestCount > 0 ? (friendRequestCount > 99 ? '99+' : friendRequestCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, color: '#fff' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Cá nhân', tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginRight: 16 },
});
