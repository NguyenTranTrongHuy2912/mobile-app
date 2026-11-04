# Graph Report - mobile-app  (2026-11-04)

## Corpus Check
- 52 files · ~10,307 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 257 nodes · 527 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `419c992e`
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
- (auth)/_layout.tsx
- RoomListScreen.tsx
- {
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetUploadSignatureMutation,
}
- (app)/_layout.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 22 edges
2. `react-native` - 18 edges
3. `useAppSelector` - 17 edges
4. `expo-router` - 15 edges
5. `useAppDispatch` - 15 edges
6. `expo` - 12 edges
7. `@expo/vector-icons` - 11 edges
8. `colors` - 10 edges
9. `ChatRoomScreen()` - 8 edges
10. `useSendImage()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Index()` --calls--> `useAppSelector`  [EXTRACTED]
  app/index.tsx → src/store/hooks.ts
- `RootLayout()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  app/_layout.tsx → src/features/session/SessionBootstrap.tsx
- `Routes()` --calls--> `useAppDispatch`  [EXTRACTED]
  app/_layout.tsx → src/store/hooks.ts
- `Routes()` --calls--> `useAppSelector`  [EXTRACTED]
  app/_layout.tsx → src/store/hooks.ts
- `RoomListScreen()` --calls--> `useAppSelector`  [EXTRACTED]
  src/screens/RoomListScreen.tsx → src/store/hooks.ts

## Import Cycles
- None detected.

## Communities (13 total, 3 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (47): dependencies, axios@^1.20.0, dayjs@^1.11.23, expo@~58.0.22, expo-constants@~58.0.14, expo-image-picker@~58.0.10, expo-linking@~58.0.15, expo-router@~58.0.29 (+39 more)

### Community 1 - "RegisterScreen.tsx"
Cohesion: 0.12
Nodes (19): IconName, styles, tabIcon(), TabsLayout(), expo-router, @expo/vector-icons, react, react-native (+11 more)

### Community 2 - "chatApi.ts"
Cohesion: 0.10
Nodes (23): UploadResult, FriendsScreen(), NewChatScreen(), Props, styles, NewGroupScreen(), styles, CreateRoomRequest (+15 more)

### Community 3 - "ChatRoomScreen.tsx"
Cohesion: 0.09
Nodes (25): Index(), RootLayout(), Routes(), uploadImage(), ChatImage(), Props, styles, ImageViewer() (+17 more)

### Community 4 - "expo"
Cohesion: 0.08
Nodes (23): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, versionCode (+15 more)

### Community 5 - "app/_layout.tsx"
Cohesion: 0.15
Nodes (15): react-redux@^9.3.0, @reduxjs/toolkit@^2.13.0, tamagui@^3.1.10, react-redux, @reduxjs/toolkit, tamagui, chatApi, toRoom() (+7 more)

### Community 6 - "sessionSlice.ts"
Cohesion: 0.11
Nodes (21): @react-native-async-storage/async-storage@2.2.0, @react-native-async-storage/async-storage, AuthResponse, AuthUser, http, OtpInfo, AppLogo(), AuthButton() (+13 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

### Community 11 - "RoomListScreen.tsx"
Cohesion: 0.47
Nodes (4): formatTime(), previewOf(), RoomListScreen(), styles

## Knowledge Gaps
- **2 isolated node(s):** `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetUploadSignatureMutation,
}`, `expo/tsconfig.base`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 87 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `RegisterScreen.tsx` to `package.json`, `chatApi.ts`, `ChatRoomScreen.tsx`, `app/_layout.tsx`, `sessionSlice.ts`, `RoomListScreen.tsx`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `{
  useGetRoomsQuery,
  useSearchUsersQuery,
  useCreateRoomMutation,
  useMarkRoomReadMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetUploadSignatureMutation,
}`, `expo/tsconfig.base` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.057624113475177305 - nodes in this community are weakly interconnected._
- **Why does `expo-router` connect `RegisterScreen.tsx` to `package.json`, `chatApi.ts`, `ChatRoomScreen.tsx`, `app/_layout.tsx`, `(auth)/_layout.tsx`, `RoomListScreen.tsx`, `(app)/_layout.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `RegisterScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12162162162162163 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `RegisterScreen.tsx` to `package.json`, `chatApi.ts`, `ChatRoomScreen.tsx`, `sessionSlice.ts`, `RoomListScreen.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `chatApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10084033613445378 - nodes in this community are weakly interconnected._