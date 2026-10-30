# Graph Report - mobile-app  (2026-10-30)

## Corpus Check
- 28 files · ~4,611 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 4)

## Summary
- 177 nodes · 359 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `76aa1cc8`
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
6. `@react-navigation/native-stack` - 8 edges
7. `LoginScreen()` - 8 edges
8. `colors` - 8 edges
9. `RootStackParamList` - 7 edges
10. `AuthButton()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `RootNavigator()`  [EXTRACTED]
  App.tsx → src/navigation/RootNavigator.tsx
- `App()` --calls--> `SessionBootstrap()`  [EXTRACTED]
  App.tsx → src/features/session/SessionBootstrap.tsx
- `LoginScreen()` --calls--> `AppLogo()`  [EXTRACTED]
  src/screens/LoginScreen.tsx → src/components/AppLogo.tsx
- `LoginScreen()` --calls--> `AuthButton()`  [EXTRACTED]
  src/screens/LoginScreen.tsx → src/components/AuthButton.tsx
- `RegisterScreen()` --calls--> `AuthButton()`  [EXTRACTED]
  src/screens/RegisterScreen.tsx → src/components/AuthButton.tsx

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, axios@^1.20.0, dayjs@^1.11.23, expo@~58.0.14, expo-image-picker@~58.0.10, expo-status-bar@~58.0.3, @expo/vector-icons@^15.0.2, lucide-react-native@^1.59.0 (+31 more)

### Community 1 - "LoginScreen.tsx"
Cohesion: 0.17
Nodes (21): @expo/vector-icons, react, react-native, react-native-safe-area-context, @react-navigation/native-stack, AppLogo(), styles, AuthButton() (+13 more)

### Community 2 - "chatApi.ts"
Cohesion: 0.19
Nodes (12): ME, mockMessages, mockRooms, API_URL, HistoryItem, HistoryResponse, Message, MessageStatus (+4 more)

### Community 3 - "RootNavigator.tsx"
Cohesion: 0.15
Nodes (15): logout, RootNavigator(), Stack, RootStackParamList, ChatRoomScreen(), Props, styles, LoginScreen() (+7 more)

### Community 4 - "expo"
Cohesion: 0.11
Nodes (18): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, expo, android (+10 more)

### Community 5 - "App.tsx"
Cohesion: 0.16
Nodes (13): App(), react-redux@^9.3.0, @reduxjs/toolkit@^2.13.0, react-redux, @reduxjs/toolkit, chatApi, chatSlice, ChatState (+5 more)

### Community 6 - "sessionSlice.ts"
Cohesion: 0.18
Nodes (11): @react-native-async-storage/async-storage@^3.1.1, @react-native-async-storage/async-storage, authApi, AuthUser, initialState, login, register, saveSession() (+3 more)

### Community 7 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, graph, ios, start, web

### Community 8 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

## Knowledge Gaps
- **2 isolated node(s):** `expo/tsconfig.base`, `{ useGetRoomsQuery, useGetMessagesQuery, useSendMessageMutation }`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 62 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `package.json` to `App.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `{ useGetRoomsQuery, useGetMessagesQuery, useSendMessageMutation }` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06794871794871794 - nodes in this community are weakly interconnected._
- **Why does `react` connect `LoginScreen.tsx` to `package.json`, `RootNavigator.tsx`, `App.tsx`, `sessionSlice.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Should `RootNavigator.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Why does `@reduxjs/toolkit` connect `App.tsx` to `package.json`, `chatApi.ts`, `sessionSlice.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._