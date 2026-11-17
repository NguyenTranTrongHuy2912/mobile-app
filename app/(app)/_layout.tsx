import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScreenColors } from '../../src/features/theme/useScreenColors';

export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout() {
  const C = useScreenColors();
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: C.screen },
        header: ({ options, route, back, navigation }) => {
          const title =
            typeof options.headerTitle === 'string'
              ? options.headerTitle
              : options.title ?? route.name;

          return (
            <View
              style={{
                backgroundColor: C.page,
                paddingTop: insets.top,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: C.line,
              }}
            >
              <View
                style={{
                  height: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                }}
              >
                {options.headerLeft ? (
                  options.headerLeft({ tintColor: C.ink, canGoBack: !!back })
                ) : back ? (
                  <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={10}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="arrow-back" size={24} color={C.ink} />
                  </Pressable>
                ) : null}

                {typeof options.headerTitle === 'function' ? (
                  <View style={{ flex: 1, marginLeft: back ? 4 : 8 }}>
                    {options.headerTitle({ children: title, tintColor: C.ink })}
                  </View>
                ) : (
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: 18,
                      fontWeight: '700',
                      color: C.ink,
                      marginLeft: back ? 6 : 10,
                    }}
                  >
                    {title}
                  </Text>
                )}

                {options.headerRight
                  ? options.headerRight({ tintColor: C.ink, canGoBack: !!back })
                  : null}
              </View>
            </View>
          );
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat/[roomId]"
        options={({ route }) => ({
          title: (route.params as { title?: string } | undefined)?.title ?? 'Chat',
        })}
      />
      <Stack.Screen name="new-chat" options={{ title: 'Chat mới' }} />
      <Stack.Screen name="new-group" options={{ title: 'Tạo nhóm' }} />
      <Stack.Screen name="room-detail/[roomId]" options={{ title: 'Thông tin nhóm' }} />
      <Stack.Screen name="ai-assistant" options={{ title: 'HQ AI' }} />
      <Stack.Screen name="settings" options={{ title: 'Cài đặt' }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}