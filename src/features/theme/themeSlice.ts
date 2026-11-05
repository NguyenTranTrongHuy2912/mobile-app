import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  isDark: boolean;
  soundEnabled: boolean;
}

const initialState: ThemeState = {
  isDark: false,
  soundEnabled: true,
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
    },
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    setSound: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, toggleSound, setSound } = themeSlice.actions;
export default themeSlice.reducer;
