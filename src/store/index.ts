import { configureStore } from '@reduxjs/toolkit';
import { chatApi } from '../api/chatApi';
import chatReducer from '../features/chat/chatSlice';
import sessionReducer from '../features/session/sessionSlice';
import presenceReducer from '../features/presence/presenceSlice';
import themeReducer from '../features/theme/themeSlice';

export const store = configureStore({
  reducer: {
    [chatApi.reducerPath]: chatApi.reducer,
    chat: chatReducer,
    session: sessionReducer,
    presence: presenceReducer,
    theme: themeReducer,
  },
  middleware: (getDefault) => getDefault().concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
