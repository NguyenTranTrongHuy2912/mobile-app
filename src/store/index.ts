import { combineReducers, configureStore, type UnknownAction } from '@reduxjs/toolkit';
import { chatApi } from '../api/chatApi';
import chatReducer from '../features/chat/chatSlice';
import sessionReducer, { logout } from '../features/session/sessionSlice';
import presenceReducer from '../features/presence/presenceSlice';
import themeReducer from '../features/theme/themeSlice';
import callReducer from '../features/call/callSlice';

const appReducer = combineReducers({
  [chatApi.reducerPath]: chatApi.reducer,
  chat: chatReducer,
  session: sessionReducer,
  presence: presenceReducer,
  theme: themeReducer,
  call: callReducer,
});

// Đăng xuất: xóa sạch toàn bộ state (cache RTK Query, bản nháp, cuộc gọi, hiện diện...)
// để tài khoản đăng nhập kế tiếp trên cùng máy không thấy dữ liệu cũ.
// Chỉ giữ lại tùy chọn giao diện (theme, âm thanh) vì đó là cài đặt của thiết bị.
const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: UnknownAction) => {
  if (logout.fulfilled.match(action)) {
    return appReducer(state ? { theme: state.theme } : undefined, action);
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault().concat(chatApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;