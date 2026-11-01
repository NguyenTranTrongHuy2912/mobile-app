# Graph Report - mobile-app  (2026-11-01)

## Corpus Check
- 30 files · ~7,118 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 197 nodes · 413 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `767a6fcd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- LoginScreen.tsx
- chatApi.ts
- RootNavigator.tsx
- expo
- App.tsx
- sessionSlice.ts
- scripts
- tsconfig.json
- {
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
}
- NewChatScreen.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 15 edges
2. `react-native` - 14 edges
3. `useAppDispatch` - 11 edges
4. `useAppSelector` - 11 edges
5. `@react-navigation/native-stack` - 10 edges
6. `expo` - 10 edges
7. `RootStackParamList` - 9 edges
8. `colors` - 8 edges
9. `LoginScreen()` - 7 edges
10. `RootNavigator()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `RootNavigator()`  [EXTRACTED]
  App.tsx → src/navigation/RootNavigator.tsx
- `App()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  App.tsx → src/features/session/SessionBootstrap.tsx
- `LoginScreen()` --calls--> `useAppDispatch`  [EXTRACTED]
  src/screens/LoginScreen.tsx → src/store/hooks.ts
- `LoginScreen()` --calls--> `useAppSelector`  [EXTRACTED]
  src/screens/LoginScreen.tsx → src/store/hooks.ts
- `RegisterScreen()` --calls--> `useAppDispatch`  [EXTRACTED]
  src/screens/RegisterScreen.tsx → src/store/hooks.ts

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.07
Nodes (40): dependencies, axios@^1.20.0, dayjs@^1.11.23, expo@~58.0.14, expo-image-picker@~58.0.10, expo-status-bar@~58.0.3, @expo/vector-icons@^15.0.2, lucide-react-native@^1.59.0 (+32 more)

### Community 1 - "LoginScreen.tsx"
Cohesion: 0.14
Nodes (25): @expo/vector-icons, react, react-native, react-native-safe-area-context, AppLogo(), styles, AuthButton(), Props (+17 more)

### Community 2 - "chatApi.ts"
Cohesion: 0.19
Nodes (16): chatApi, toRoom(), CreateRoomRequest, HistoryItem, HistoryResponse, Message, MessageStatus, Room (+8 more)

### Community 3 - "RootNavigator.tsx"
Cohesion: 0.14
Nodes (14): logout, RootNavigator(), Stack, ChatRoomScreen(), Props, styles, formatTime(), previewOf() (+6 more)

### Community 4 - "expo"
Cohesion: 0.11
Nodes (18): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, expo, android (+10 more)

### Community 5 - "App.tsx"
Cohesion: 0.17
Nodes (12): App(), react-redux@^9.3.0, @reduxjs/toolkit@^2.13.0, react-redux, @reduxjs/toolkit, chatSlice, ChatState, initialState (+4 more)

### Community 6 - "sessionSlice.ts"
Cohesion: 0.16
Nodes (11): @react-native-async-storage/async-storage, authApi, AuthResponse, AuthUser, http, OtpInfo, API_URL, initialState (+3 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

### Community 10 - "NewChatScreen.tsx"
Cohesion: 0.23
Nodes (9): @react-navigation/native-stack, RootStackParamList, NewChatScreen(), Props, styles, NewGroupScreen(), Props, styles (+1 more)

## Knowledge Gaps
- **2 isolated node(s):** `expo/tsconfig.base`, `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
}`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 66 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `LoginScreen.tsx` to `package.json`, `RootNavigator.tsx`, `App.tsx`, `sessionSlice.ts`, `NewChatScreen.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
}` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06585365853658537 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `package.json` to `App.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `LoginScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13825757575757575 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `LoginScreen.tsx` to `package.json`, `NewChatScreen.tsx`, `RootNavigator.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `RootNavigator.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._