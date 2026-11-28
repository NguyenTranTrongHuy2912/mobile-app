import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi, type AuthUser } from '../../api/authApi';
import { clearSession, patchSessionProfile, saveSession } from './sessionStorage';

// Đăng nhập đã thành công ở server: nếu lưu máy thất bại vẫn cho dùng trong phiên này (chỉ mất khi tắt app)
const persistSession = async (user: AuthUser) => {
  try {
    await saveSession(user);
  } catch (e) {
    console.warn('[session] Không lưu được phiên đăng nhập:', e);
  }
};

export { SESSION_KEY, loadSession } from './sessionStorage';

interface SessionState extends AuthUser {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  userId: '',
  displayName: '',
  token: '',
  avatarUrl: undefined,
  role: 'USER',
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const login = createAsyncThunk<
  AuthUser,
  { account: string; password: string },
  { rejectValue: string }
>('session/login', async ({ account, password }, { rejectWithValue }) => {
  try {
    const user = await authApi.login(account, password);
    await persistSession(user);
    return user;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Đăng nhập thất bại');
  }
});

export const register = createAsyncThunk<
  AuthUser,
  { name: string; account: string; password: string; otpCode: string },
  { rejectValue: string }
>('session/register', async ({ name, account, password, otpCode }, { rejectWithValue }) => {
  try {
    const user = await authApi.register(name, account, password, otpCode);
    await persistSession(user);
    return user;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Đăng ký thất bại');
  }
});

export const logout = createAsyncThunk('session/logout', async () => {
  await clearSession();
});

/** Cập nhật state + lưu bền. Dùng thay cho dispatch(updateUserProfile(...)) ở ProfileScreen. */
export const persistProfile = createAsyncThunk<
  void,
  { displayName?: string; avatarUrl?: string }
>('session/persistProfile', async (patch, { dispatch }) => {
  dispatch(sessionSlice.actions.updateUserProfile(patch));
  try {
    await patchSessionProfile(patch);
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
      state.token = action.payload.token;
      state.avatarUrl = action.payload.avatarUrl;
      state.role = action.payload.role || 'USER';
      state.isAuthenticated = true;
    },
    clearError(state) {
      state.error = null;
    },
    // Reducer thuần: việc ghi xuống bộ nhớ làm ở thunk persistProfile bên dưới
    updateUserProfile(state, action: PayloadAction<{ displayName?: string; avatarUrl?: string }>) {
      if (action.payload.displayName) state.displayName = action.payload.displayName;
      if (action.payload.avatarUrl !== undefined) state.avatarUrl = action.payload.avatarUrl;
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
      state.token = action.payload.token;
      state.avatarUrl = action.payload.avatarUrl;
      state.role = action.payload.role || 'USER';
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

export const { setUser, clearError, updateUserProfile } = sessionSlice.actions;
export default sessionSlice.reducer;