# Graph Report - mobile-app  (2026-11-03)

## Corpus Check
- 38 files · ~7,219 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 211 nodes · 407 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9dabd7d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- RegisterScreen.tsx
- chatApi.ts
- ChatRoomScreen.tsx
- expo
- app/_layout.tsx
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
- expo-router

## God Nodes (most connected - your core abstractions)
1. `react` - 14 edges
2. `expo-router` - 13 edges
3. `useAppDispatch` - 13 edges
4. `useAppSelector` - 13 edges
5. `react-native` - 12 edges
6. `expo` - 12 edges
7. `LoginScreen()` - 7 edges
8. `colors` - 7 edges
9. `RegisterScreen()` - 6 edges
10. `react-native-safe-area-context` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Index()` --calls--> `useAppSelector`  [EXTRACTED]
  app/index.tsx → src/store/hooks.ts
- `RootLayout()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  app/_layout.tsx → src/features/session/SessionBootstrap.tsx
- `AppLayout()` --calls--> `logout`  [EXTRACTED]
  app/(app)/_layout.tsx → src/features/session/sessionSlice.ts
- `AppLayout()` --calls--> `useAppDispatch`  [EXTRACTED]
  app/(app)/_layout.tsx → src/store/hooks.ts
- `Routes()` --calls--> `useAppDispatch`  [EXTRACTED]
  app/_layout.tsx → src/store/hooks.ts

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (47): dependencies, axios@^1.20.0, dayjs@^1.11.23, expo@~58.0.22, expo-constants@~58.0.14, expo-image-picker@~58.0.10, expo-linking@~58.0.15, expo-router@~58.0.29 (+39 more)

### Community 1 - "RegisterScreen.tsx"
Cohesion: 0.16
Nodes (16): @expo/vector-icons, react, react-native, react-native-safe-area-context, AppLogo(), AuthButton(), Props, AuthInput() (+8 more)

### Community 2 - "chatApi.ts"
Cohesion: 0.13
Nodes (20): chatApi, toRoom(), API_URL, formatTime(), previewOf(), RoomListScreen(), styles, CreateRoomRequest (+12 more)

### Community 3 - "ChatRoomScreen.tsx"
Cohesion: 0.13
Nodes (8): @reduxjs/toolkit@^2.13.0, @reduxjs/toolkit, chatSlice, ChatState, initialState, ChatRoomScreen(), styles, newId()

### Community 4 - "expo"
Cohesion: 0.09
Nodes (21): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, expo, android (+13 more)

### Community 5 - "app/_layout.tsx"
Cohesion: 0.17
Nodes (16): AppLayout(), Index(), RootLayout(), Routes(), react-redux@^9.3.0, tamagui@^3.1.10, react-redux, tamagui (+8 more)

### Community 6 - "sessionSlice.ts"
Cohesion: 0.15
Nodes (14): @react-native-async-storage/async-storage@2.2.0, @react-native-async-storage/async-storage, authApi, AuthResponse, AuthUser, http, OtpInfo, initialState (+6 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

### Community 10 - "expo-router"
Cohesion: 0.18
Nodes (8): unstable_settings, expo-router, NewChatScreen(), styles, NewGroupScreen(), styles, UserSummary, errorMessage()

## Knowledge Gaps
- **2 isolated node(s):** `expo/tsconfig.base`, `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
}`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 67 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `package.json` to `ChatRoomScreen.tsx`, `app/_layout.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
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
  _Cohesion score 0.057624113475177305 - nodes in this community are weakly interconnected._
- **Why does `expo-router` connect `expo-router` to `package.json`, `RegisterScreen.tsx`, `chatApi.ts`, `ChatRoomScreen.tsx`, `app/_layout.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `chatApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12615384615384614 - nodes in this community are weakly interconnected._
- **Why does `react` connect `RegisterScreen.tsx` to `package.json`, `chatApi.ts`, `ChatRoomScreen.tsx`, `app/_layout.tsx`, `sessionSlice.ts`, `expo-router`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `ChatRoomScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._