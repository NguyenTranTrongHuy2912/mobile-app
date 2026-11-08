# Graph Report - mobile-app  (2026-11-08)

## Corpus Check
- 75 files · ~25,068 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 387 nodes · 888 edges · 35 communities (13 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95ecbfaf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- expo-router
- (tabs)/_layout.tsx
- ChatRoomScreen.tsx
- expo
- useAppSelector
- @react-native-async-storage/async-storage
- scripts
- tsconfig.json
- ProfileScreen.tsx
- package.json
- react
- AGENTS.md
- FriendsScreen.tsx
- react-dom@19.3.0
- expo@~58.0.22
- axios
- expo-document-picker
- expo-image-picker
- expo-linking@~58.0.15
- expo-splash-screen
- expo-video
- lucide-react-native@^1.59.0
- expo-font@~58.0.11
- react-native-gifted-chat@^3.4.0
- expo-status-bar
- react-native-web@^0.21.4
- @react-navigation/native@^7.5.1
- {
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useLoadEarlierMessagesMutation,
  useSendMessageMutation,
  useGetUploadSignatureMutation,
  useGetFriendsQuery,
  useGetFriendRequestsQuery,
  useSendFriendRequestMutation,
  useRespondFriendRequestMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRegisterPushTokenMutation,
  useGetOnlineUsersQuery,
  useAskAiMutation,
  useSummarizeRoomMutation,
  useSemanticSearchMutation,
  useRagChatMutation,
}
- react-native-gesture-handler@~3.3.0
- react-native-screens@~4.30.1
- react-native-reanimated@4.7.1
- react-native-worklets@0.13.0
- react-native-svg

## God Nodes (most connected - your core abstractions)
1. `react` - 40 edges
2. `react-native` - 30 edges
3. `useAppSelector` - 28 edges
4. `expo-router` - 24 edges
5. `@expo/vector-icons` - 23 edges
6. `useAppDispatch` - 19 edges
7. `ChatRoomScreen()` - 17 edges
8. `ScalePressable()` - 16 edges
9. `tamagui` - 13 edges
10. `expo` - 12 edges

## Surprising Connections (you probably didn't know these)
- `AiAssistantRoute()` --calls--> `AiAssistantScreen()`  [EXTRACTED]
  app/(app)/ai-assistant.tsx → src/screens/AiAssistantScreen.tsx
- `RoomDetailRoute()` --calls--> `RoomDetailScreen()`  [EXTRACTED]
  app/(app)/room-detail/[roomId].tsx → src/screens/RoomDetailScreen.tsx
- `SettingsRoute()` --calls--> `SettingsScreen()`  [EXTRACTED]
  app/(app)/settings.tsx → src/screens/SettingsScreen.tsx
- `Index()` --calls--> `useAppSelector`  [EXTRACTED]
  app/index.tsx → src/store/hooks.ts
- `InnerRoot()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  app/_layout.tsx → src/features/session/SessionBootstrap.tsx

## Import Cycles
- None detected.

## Communities (35 total, 22 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, expo-constants@~58.0.14, expo-router@~58.0.30, @expo/vector-icons@^15.0.2, react@19.3.0, react-native@0.88.1, react-native-keyboard-controller@1.22.7, react-native-safe-area-context@~5.11.1 (+4 more)

### Community 1 - "expo-router"
Cohesion: 0.08
Nodes (30): unstable_settings, unstable_settings, expo-router, react-native-safe-area-context, authApi, AuthResponse, AuthUser, http (+22 more)

### Community 2 - "(tabs)/_layout.tsx"
Cohesion: 0.40
Nodes (4): IconName, styles, tabIcon(), TabsLayout()

### Community 3 - "ChatRoomScreen.tsx"
Cohesion: 0.07
Nodes (30): dayjs@^1.11.23, dayjs, uploadMedia(), AnimatedMessageItem(), AnimatedMessageItemProps, ChatImage(), Props, ChatVideo() (+22 more)

### Community 4 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, versionCode (+15 more)

### Community 5 - "useAppSelector"
Cohesion: 0.07
Nodes (38): Index(), InnerRoot(), RootLayout(), Routes(), expo-notifications@~58.1.8, @reduxjs/toolkit@^2.13.0, expo-notifications, react-redux (+30 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

### Community 9 - "ProfileScreen.tsx"
Cohesion: 0.15
Nodes (9): SettingsRoute(), uploadImage, UploadResult, logout, confirmLogout(), ProfileScreen(), styles, SettingsScreen() (+1 more)

### Community 10 - "package.json"
Cohesion: 0.20
Nodes (11): @tamagui/config@^3.1.10, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, main, name, private, version (+3 more)

### Community 11 - "react"
Cohesion: 0.08
Nodes (38): AiAssistantRoute(), RoomDetailRoute(), @expo/vector-icons, react, react-native, tamagui, ActiveBadge(), Props (+30 more)

### Community 12 - "AGENTS.md"
Cohesion: 0.33
Nodes (5): Building with EAS, Commands, Expo has changed — do not trust your training data, Navigation & Routing, Rules

### Community 13 - "FriendsScreen.tsx"
Cohesion: 0.08
Nodes (31): FloatingAiButton(), FriendsScreen(), styles, SubTab, NewChatScreen(), Props, styles, NewGroupScreen() (+23 more)

## Knowledge Gaps
- **2 isolated node(s):** `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useLoadEarlierMessagesMutation,
  useSendMessageMutation,
  useGetUploadSignatureMutation,
  useGetFriendsQuery,
  useGetFriendRequestsQuery,
  useSendFriendRequestMutation,
  useRespondFriendRequestMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRegisterPushTokenMutation,
  useGetOnlineUsersQuery,
  useAskAiMutation,
  useSummarizeRoomMutation,
  useSemanticSearchMutation,
  useRagChatMutation,
}`, `expo/tsconfig.base`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 137 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `dependencies`, `expo-router`, `(tabs)/_layout.tsx`, `ChatRoomScreen.tsx`, `useAppSelector`, `ProfileScreen.tsx`, `package.json`, `FriendsScreen.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useLoadEarlierMessagesMutation,
  useSendMessageMutation,
  useGetUploadSignatureMutation,
  useGetFriendsQuery,
  useGetFriendRequestsQuery,
  useSendFriendRequestMutation,
  useRespondFriendRequestMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRegisterPushTokenMutation,
  useGetOnlineUsersQuery,
  useAskAiMutation,
  useSummarizeRoomMutation,
  useSemanticSearchMutation,
  useRagChatMutation,
}`, `expo/tsconfig.base` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `expo-router` be split into smaller, more focused modules?**
  _Cohesion score 0.07755102040816327 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react` to `dependencies`, `expo-router`, `(tabs)/_layout.tsx`, `ChatRoomScreen.tsx`, `useAppSelector`, `ProfileScreen.tsx`, `package.json`, `FriendsScreen.tsx`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `ChatRoomScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0700354609929078 - nodes in this community are weakly interconnected._
- **Why does `expo-router` connect `expo-router` to `dependencies`, `(tabs)/_layout.tsx`, `ChatRoomScreen.tsx`, `useAppSelector`, `ProfileScreen.tsx`, `package.json`, `react`, `FriendsScreen.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._