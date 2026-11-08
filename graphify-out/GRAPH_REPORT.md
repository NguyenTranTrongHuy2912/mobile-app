# Graph Report - mobile-app  (2026-11-08)

## Corpus Check
- 78 files · ~28,025 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 401 nodes · 909 edges · 34 communities (14 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8e41002`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- expo-router
- expo-router
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
- tamagui
- axios
- expo-document-picker
- expo-image-picker
- expo-linking@~58.0.15
- expo-constants
- expo-video
- lucide-react-native@^1.59.0
- expo-font@~58.0.11
- react-native-gifted-chat@^3.4.0
- expo-status-bar
- react-native-web@^0.21.4
- react-native-keyboard-controller@1.22.7
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
- @tamagui/config

## God Nodes (most connected - your core abstractions)
1. `react` - 43 edges
2. `react-native` - 32 edges
3. `useAppSelector` - 28 edges
4. `expo-router` - 26 edges
5. `@expo/vector-icons` - 25 edges
6. `useAppDispatch` - 19 edges
7. `ChatRoomScreen()` - 17 edges
8. `ScalePressable()` - 14 edges
9. `tamagui` - 13 edges
10. `expo` - 12 edges

## Surprising Connections (you probably didn't know these)
- `AiAssistantRoute()` --calls--> `AiAssistantScreen()`  [EXTRACTED]
  app/(app)/ai-assistant.tsx → src/screens/AiAssistantScreen.tsx
- `RoomDetailRoute()` --calls--> `RoomDetailScreen()`  [EXTRACTED]
  app/(app)/room-detail/[roomId].tsx → src/screens/RoomDetailScreen.tsx
- `Index()` --calls--> `useAppSelector`  [EXTRACTED]
  app/index.tsx → src/store/hooks.ts
- `SettingsRoute()` --calls--> `SettingsScreen()`  [EXTRACTED]
  app/(app)/settings.tsx → src/screens/SettingsScreen.tsx
- `AdminRoute()` --calls--> `AdminDashboardScreen()`  [EXTRACTED]
  app/(app)/admin.tsx → src/screens/AdminDashboardScreen.tsx

## Import Cycles
- None detected.

## Communities (34 total, 20 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, expo-notifications@~58.1.8, expo-splash-screen@~58.0.13, @expo/vector-icons@^15.0.2, react@19.3.0, react-native@0.88.1, react-native-worklets@0.13.0, @react-navigation/native@^7.5.1 (+4 more)

### Community 1 - "expo-router"
Cohesion: 0.08
Nodes (32): react-native-safe-area-context@~5.11.1, react-native-svg@^15.16.0, @expo/vector-icons, react-native-safe-area-context, react-native-svg, authApi, AuthResponse, AuthUser (+24 more)

### Community 2 - "expo-router"
Cohesion: 0.09
Nodes (16): AdminRoute(), unstable_settings, IconName, styles, tabIcon(), TabsLayout(), unstable_settings, expo-router@~58.0.30 (+8 more)

### Community 3 - "ChatRoomScreen.tsx"
Cohesion: 0.08
Nodes (25): uploadMedia(), AnimatedMessageItem(), AnimatedMessageItemProps, ChatImage(), Props, ChatVideo(), fillStyle, formatDuration() (+17 more)

### Community 4 - "expo"
Cohesion: 0.08
Nodes (24): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, softwareKeyboardLayoutMode (+16 more)

### Community 5 - "useAppSelector"
Cohesion: 0.08
Nodes (31): SettingsRoute(), Index(), InnerRoot(), RootLayout(), Routes(), @reduxjs/toolkit@^2.13.0, expo-notifications, react-redux (+23 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

### Community 9 - "ProfileScreen.tsx"
Cohesion: 0.24
Nodes (5): uploadImage, logout, confirmLogout(), ProfileScreen(), styles

### Community 10 - "package.json"
Cohesion: 0.20
Nodes (11): expo@~58.0.23, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, main, name, private, version (+3 more)

### Community 11 - "react"
Cohesion: 0.14
Nodes (21): RoomDetailRoute(), react, react-native, AiSummarizeModal(), AiSummarizeModalProps, styles, MediaPickerModal(), MediaPickerModalProps (+13 more)

### Community 12 - "AGENTS.md"
Cohesion: 0.33
Nodes (5): Building with EAS, Commands, Expo has changed — do not trust your training data, Navigation & Routing, Rules

### Community 13 - "FriendsScreen.tsx"
Cohesion: 0.06
Nodes (48): dayjs@^1.11.23, dayjs, chatApi, toMessage(), toRoom(), UploadResult, ActiveBadge(), Props (+40 more)

### Community 15 - "tamagui"
Cohesion: 0.12
Nodes (16): AiAssistantRoute(), tamagui@^3.1.10, tamagui, AiMessageBubble(), AiMessageBubbleProps, AiQuickPromptList(), AiQuickPromptListProps, QUICK_PROMPTS (+8 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 145 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `dependencies`, `expo-router`, `expo-router`, `ChatRoomScreen.tsx`, `useAppSelector`, `ProfileScreen.tsx`, `package.json`, `FriendsScreen.tsx`, `tamagui`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
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
  _Cohesion score 0.0824829931972789 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `react` to `dependencies`, `expo-router`, `expo-router`, `ChatRoomScreen.tsx`, `useAppSelector`, `ProfileScreen.tsx`, `package.json`, `FriendsScreen.tsx`, `tamagui`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `expo-router` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Why does `expo-router` connect `expo-router` to `expo-router`, `ChatRoomScreen.tsx`, `useAppSelector`, `ProfileScreen.tsx`, `package.json`, `react`, `FriendsScreen.tsx`, `tamagui`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `ChatRoomScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07926829268292683 - nodes in this community are weakly interconnected._