import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { ME } from '../../api/mockData';

interface SessionState {
  userId: string;
  displayName: string;
}

// Tạm thời cố định user. Khi gateway có đăng nhập (JWT), thêm token và
// thunk login/logout vào slice này.
const initialState: SessionState = {
  userId: ME,
  displayName: 'Tôi',
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<SessionState>) {
      state.userId = action.payload.userId;
      state.displayName = action.payload.displayName;
    },
  },
});

export const { setUser } = sessionSlice.actions;
export default sessionSlice.reducer;
