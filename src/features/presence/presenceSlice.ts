import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PresenceState {
  onlineUserIds: Record<string, boolean>;
  lastSeen: Record<string, number>;
}

const initialState: PresenceState = {
  onlineUserIds: {},
  lastSeen: {},
};

export const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setInitialPresence: (state, action: PayloadAction<string[]>) => {
      const map: Record<string, boolean> = {};
      for (const id of action.payload) {
        map[id] = true;
      }
      state.onlineUserIds = map;
    },
    setUserPresence: (
      state,
      action: PayloadAction<{ userId: string; isOnline: boolean; lastSeen?: number }>,
    ) => {
      const { userId, isOnline, lastSeen } = action.payload;
      if (isOnline) {
        state.onlineUserIds[userId] = true;
      } else {
        delete state.onlineUserIds[userId];
        if (lastSeen) {
          state.lastSeen[userId] = lastSeen;
        }
      }
    },
  },
});

export const { setInitialPresence, setUserPresence } = presenceSlice.actions;
export default presenceSlice.reducer;
