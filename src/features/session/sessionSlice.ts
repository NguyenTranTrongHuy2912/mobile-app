import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, type AuthUser } from '../../api/authApi';

export const SESSION_KEY = 'chat_session';

interface SessionState extends AuthUser {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  userId: '',
  displayName: '',
  isAuthenticated: false,
  loading: false,
  error: null,
};

const saveSession = async (user: AuthUser) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {}
};

export const login = createAsyncThunk<
  AuthUser,
  { account: string; password: string },
  { rejectValue: string }
>('session/login', async ({ account, password }, { rejectWithValue }) => {
  try {
    const user = await authApi.login(account, password);
    await saveSession(user);
    return user;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Đăng nhập thất bại');
  }
});

export const register = createAsyncThunk<
  AuthUser,
  { name: string; account: string; password: string },
  { rejectValue: string }
>('session/register', async ({ name, account, password }, { rejectWithValue }) => {
  try {
    const user = await authApi.register(name, account, password);
    await saveSession(user);
    return user;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Đăng ký thất bại');
  }
});

export const logout = createAsyncThunk('session/logout', async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {}
});

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Dùng khi khôi phục phiên đã lưu lúc mở app (SessionBootstrap)
    setUser(state, action: PayloadAction<AuthUser>) {
      state.userId = action.payload.userId;
      state.displayName = action.payload.displayName;
      state.isAuthenticated = true;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: SessionState) => {
      state.loading = true;
      state.error = null;
    };
    const fulfilled = (state: SessionState, action: PayloadAction<AuthUser>) => {
      state.loading = false;
      state.userId = action.payload.userId;
      state.displayName = action.payload.displayName;
      state.isAuthenticated = true;
    };
    const rejected = (state: SessionState, action: { payload?: string }) => {
      state.loading = false;
      state.error = action.payload ?? 'Đã có lỗi xảy ra';
    };

    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, fulfilled)
      .addCase(register.rejected, rejected)
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { setUser, clearError } = sessionSlice.actions;
export default sessionSlice.reducer;
