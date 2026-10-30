# Graph Report - mobile-app  (2026-10-30)

## Corpus Check
- 28 files · ~5,049 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 180 nodes · 365 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `671d1d01`
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
- { useGetRoomsQuery, useGetMessagesQuery, useSendMessageMutation }

## God Nodes (most connected - your core abstractions)
1. `react` - 13 edges
2. `react-native` - 12 edges
3. `useAppDispatch` - 11 edges
4. `expo` - 10 edges
5. `useAppSelector` - 9 edges
6. `LoginScreen()` - 8 edges
7. `colors` - 8 edges
8. `@react-navigation/native-stack` - 8 edges
9. `RegisterScreen()` - 7 edges
10. `RootStackParamList` - 7 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `RootNavigator()`  [EXTRACTED]
  App.tsx → src/navigation/RootNavigator.tsx
- `App()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  App.tsx → src/features/session/SessionBootstrap.tsx
- `LoginScreen()` --calls--> `login`  [EXTRACTED]
  src/screens/LoginScreen.tsx → src/features/session/sessionSlice.ts
- `RegisterScreen()` --calls--> `register`  [EXTRACTED]
  src/screens/RegisterScreen.tsx → src/features/session/sessionSlice.ts
- `RegisterScreen()` --calls--> `AuthButton()`  [EXTRACTED]
  src/screens/RegisterScreen.tsx → src/components/AuthButton.tsx

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.07
Nodes (38): dependencies, axios@^1.20.0, dayjs@^1.11.23, expo@~58.0.14, expo-image-picker@~58.0.10, expo-status-bar@~58.0.3, @expo/vector-icons@^15.0.2, lucide-react-native@^1.59.0 (+30 more)

### Community 1 - "LoginScreen.tsx"
Cohesion: 0.17
Nodes (19): @expo/vector-icons, react, react-native, react-native-safe-area-context, AppLogo(), styles, AuthButton(), Props (+11 more)

### Community 2 - "chatApi.ts"
Cohesion: 0.19
Nodes (12): ME, mockMessages, mockRooms, API_URL, HistoryItem, HistoryResponse, Message, MessageStatus (+4 more)

### Community 3 - "RootNavigator.tsx"
Cohesion: 0.13
Nodes (18): @react-navigation/native-stack@^7.21.0, @react-navigation/native-stack, AuthInput(), logout, RootNavigator(), Stack, RootStackParamList, ChatRoomScreen() (+10 more)

### Community 4 - "expo"
Cohesion: 0.11
Nodes (18): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, expo, android (+10 more)

### Community 5 - "App.tsx"
Cohesion: 0.16
Nodes (13): App(), react-redux@^9.3.0, @reduxjs/toolkit@^2.13.0, react-redux, @reduxjs/toolkit, chatApi, chatSlice, ChatState (+5 more)

### Community 6 - "sessionSlice.ts"
Cohesion: 0.15
Nodes (14): @react-native-async-storage/async-storage@^3.1.1, @react-native-async-storage/async-storage, authApi, AuthResponse, AuthUser, http, OtpInfo, initialState (+6 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

## Knowledge Gaps
- **2 isolated node(s):** `expo/tsconfig.base`, `{ useGetRoomsQuery, useGetMessagesQuery, useSendMessageMutation }`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `package.json` to `RootNavigator.tsx`, `App.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `{ useGetRoomsQuery, useGetMessagesQuery, useSendMessageMutation }` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07017543859649122 - nodes in this community are weakly interconnected._
- **Why does `react` connect `LoginScreen.tsx` to `package.json`, `RootNavigator.tsx`, `App.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `RootNavigator.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13227513227513227 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `LoginScreen.tsx` to `package.json`, `chatApi.ts`, `RootNavigator.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._