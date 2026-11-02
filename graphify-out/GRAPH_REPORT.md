# Graph Report - mobile-app  (2026-11-02)

## Corpus Check
- 31 files · ~7,219 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 200 nodes · 416 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `afb2b71e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- LoginScreen.tsx
- chatApi.ts
- ChatRoomScreen.tsx
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

## God Nodes (most connected - your core abstractions)
1. `react` - 15 edges
2. `react-native` - 12 edges
3. `expo` - 11 edges
4. `useAppDispatch` - 11 edges
5. `useAppSelector` - 11 edges
6. `@react-navigation/native-stack` - 10 edges
7. `RootStackParamList` - 9 edges
8. `LoginScreen()` - 7 edges
9. `colors` - 7 edges
10. `RegisterScreen()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `RootNavigator()`  [EXTRACTED]
  App.tsx → src/navigation/RootNavigator.tsx
- `App()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  App.tsx → src/features/session/SessionBootstrap.tsx
- `LoginScreen()` --calls--> `login`  [EXTRACTED]
  src/screens/LoginScreen.tsx → src/features/session/sessionSlice.ts
- `RegisterScreen()` --calls--> `register`  [EXTRACTED]
  src/screens/RegisterScreen.tsx → src/features/session/sessionSlice.ts
- `RootNavigator()` --calls--> `logout`  [EXTRACTED]
  src/navigation/RootNavigator.tsx → src/features/session/sessionSlice.ts

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (41): dependencies, axios@^1.20.0, dayjs@^1.11.23, expo@~58.0.22, expo-image-picker@~58.0.10, expo-status-bar@~58.0.4, @expo/vector-icons@^15.0.2, lucide-react-native@^1.59.0 (+33 more)

### Community 1 - "LoginScreen.tsx"
Cohesion: 0.14
Nodes (23): @expo/vector-icons, react, react-native, react-native-safe-area-context, @react-navigation/native-stack, Props, Props, Stack (+15 more)

### Community 2 - "chatApi.ts"
Cohesion: 0.13
Nodes (21): chatApi, toRoom(), formatTime(), previewOf(), Props, RoomListScreen(), styles, CreateRoomRequest (+13 more)

### Community 3 - "ChatRoomScreen.tsx"
Cohesion: 0.14
Nodes (15): App(), AppLogo(), AuthButton(), AuthInput(), SessionBootstrap(), RootNavigator(), ChatRoomScreen(), Props (+7 more)

### Community 4 - "expo"
Cohesion: 0.11
Nodes (19): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, expo, android (+11 more)

### Community 5 - "App.tsx"
Cohesion: 0.16
Nodes (13): react-redux@^9.3.0, @reduxjs/toolkit@^2.13.0, tamagui@^3.1.10, react-redux, @reduxjs/toolkit, tamagui, chatSlice, ChatState (+5 more)

### Community 6 - "sessionSlice.ts"
Cohesion: 0.13
Nodes (16): @react-native-async-storage/async-storage@2.2.0, @react-native-async-storage/async-storage, authApi, AuthResponse, AuthUser, http, OtpInfo, API_URL (+8 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

## Knowledge Gaps
- **2 isolated node(s):** `expo/tsconfig.base`, `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
}`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 63 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo` connect `expo` to `App.tsx`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
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
  _Cohesion score 0.06312292358803986 - nodes in this community are weakly interconnected._
- **Why does `react` connect `LoginScreen.tsx` to `package.json`, `chatApi.ts`, `ChatRoomScreen.tsx`, `App.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `LoginScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13655761024182078 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `package.json` to `App.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `chatApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._