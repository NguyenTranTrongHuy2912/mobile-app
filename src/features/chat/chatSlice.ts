import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  // Nội dung đang gõ dở của từng phòng, để quay lại không bị mất
  drafts: Record<string, string>;
}

const initialState: ChatState = { drafts: {} };

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setDraft(state, action: PayloadAction<{ roomId: string; text: string }>) {
      state.drafts[action.payload.roomId] = action.payload.text;
    },
    clearDraft(state, action: PayloadAction<string>) {
      delete state.drafts[action.payload];
    },
  },
});

export const { setDraft, clearDraft } = chatSlice.actions;
export default chatSlice.reducer;
