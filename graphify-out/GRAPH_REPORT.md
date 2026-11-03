# Graph Report - mobile-app  (2026-11-03)

## Corpus Check
- 40 files · ~7,980 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 218 nodes · 426 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af58d679`
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
- (auth)/_layout.tsx
- RoomListScreen.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 15 edges
2. `expo-router` - 14 edges
3. `react-native` - 13 edges
4. `useAppDispatch` - 13 edges
5. `useAppSelector` - 13 edges
6. `expo` - 12 edges
7. `colors` - 8 edges
8. `adaptiveIcon` - 7 edges
9. `LoginScreen()` - 7 edges
10. `react-native-safe-area-context` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `useAppDispatch`  [EXTRACTED]
  app/(app)/_layout.tsx → src/store/hooks.ts
- `Index()` --calls--> `useAppSelector`  [EXTRACTED]
  app/index.tsx → src/store/hooks.ts
- `AppLayout()` --calls--> `logout`  [EXTRACTED]
  app/(app)/_layout.tsx → src/features/session/sessionSlice.ts
- `RootLayout()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  app/_layout.tsx → src/features/session/SessionBootstrap.tsx
- `Routes()` --calls--> `useAppDispatch`  [EXTRACTED]
  app/_layout.tsx → src/store/hooks.ts

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.05
Nodes (51): dependencies, axios@^1.20.0, dayjs@^1.11.23, expo@~58.0.22, expo-constants@~58.0.14, expo-image-picker@~58.0.10, expo-linking@~58.0.15, expo-router@~58.0.29 (+43 more)

### Community 1 - "RegisterScreen.tsx"
Cohesion: 0.14
Nodes (20): expo-router, @expo/vector-icons, react, react-native, react-native-safe-area-context, authApi, AppLogo(), AuthButton() (+12 more)

### Community 2 - "chatApi.ts"
Cohesion: 0.12
Nodes (21): chatApi, toRoom(), NewChatScreen(), styles, NewGroupScreen(), styles, CreateRoomRequest, HistoryItem (+13 more)

### Community 3 - "ChatRoomScreen.tsx"
Cohesion: 0.15
Nodes (6): chatSlice, ChatState, initialState, ChatRoomScreen(), styles, newId()

### Community 4 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, package, versionCode, adaptiveIcon, predictiveBackGestureEnabled (+15 more)

### Community 5 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (14): Index(), RootLayout(), Routes(), react-redux@^9.3.0, tamagui@^3.1.10, react-redux, tamagui, SessionBootstrap() (+6 more)

### Community 6 - "sessionSlice.ts"
Cohesion: 0.13
Nodes (15): AppLayout(), AuthResponse, AuthUser, http, OtpInfo, API_URL, initialState, login (+7 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

### Community 11 - "RoomListScreen.tsx"
Cohesion: 0.38
Nodes (4): formatTime(), previewOf(), RoomListScreen(), styles

## Knowledge Gaps
- **2 isolated node(s):** `expo/tsconfig.base`, `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
}`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 72 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `RegisterScreen.tsx` to `package.json`, `chatApi.ts`, `ChatRoomScreen.tsx`, `app/_layout.tsx`, `(auth)/_layout.tsx`, `RoomListScreen.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
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
  _Cohesion score 0.053544494720965306 - nodes in this community are weakly interconnected._
- **Why does `react` connect `RegisterScreen.tsx` to `package.json`, `chatApi.ts`, `ChatRoomScreen.tsx`, `app/_layout.tsx`, `RoomListScreen.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `RegisterScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13903743315508021 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `package.json` to `app/_layout.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `chatApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11954022988505747 - nodes in this community are weakly interconnected._