import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CallStatus = 'IDLE' | 'CALLING' | 'INCOMING' | 'CONNECTED' | 'ENDED';
export type CallType = 'audio' | 'video';

export interface CallParticipant {
  userId: string;
  displayName: string;
  avatar?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
}

export interface CallState {
  status: CallStatus;
  callId: string | null;
  roomId: string | null;
  callType: CallType;
  isGroup: boolean;
  groupName?: string;
  callerId: string | null;
  callerName: string;
  callerAvatar?: string;
  receiverId: string | null;
  receiverName: string;
  receiverAvatar?: string;
  participants: CallParticipant[];
  isMuted: boolean;
  isSpeakerOn: boolean;
  isVideoOff: boolean;
  isFrontCamera: boolean;
  durationSeconds: number;
  endReason?: string;
}

const initialState: CallState = {
  status: 'IDLE',
  callId: null,
  roomId: null,
  callType: 'audio',
  isGroup: false,
  groupName: undefined,
  callerId: null,
  callerName: '',
  callerAvatar: undefined,
  receiverId: null,
  receiverName: '',
  receiverAvatar: undefined,
  participants: [],
  isMuted: false,
  isSpeakerOn: false,
  isVideoOff: false,
  isFrontCamera: true,
  durationSeconds: 0,
  endReason: undefined,
};

export const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startOutgoingCall: (
      state,
      action: PayloadAction<{
        callId: string;
        roomId: string;
        receiverId: string;
        receiverName: string;
        receiverAvatar?: string;
        callerId: string;
        callerName: string;
        callerAvatar?: string;
        callType: CallType;
        isGroup?: boolean;
        groupName?: string;
        participants?: CallParticipant[];
      }>,
    ) => {
      state.status = 'CALLING';
      state.callId = action.payload.callId;
      state.roomId = action.payload.roomId;
      state.callType = action.payload.callType;
      state.isGroup = !!action.payload.isGroup;
      state.groupName = action.payload.groupName;
      state.callerId = action.payload.callerId;
      state.callerName = action.payload.callerName;
      state.callerAvatar = action.payload.callerAvatar;
      state.receiverId = action.payload.receiverId;
      state.receiverName = action.payload.receiverName;
      state.receiverAvatar = action.payload.receiverAvatar;
      state.participants = action.payload.participants || [];
      state.isMuted = false;
      state.isSpeakerOn = action.payload.callType === 'video';
      state.isVideoOff = false;
      state.isFrontCamera = true;
      state.durationSeconds = 0;
      state.endReason = undefined;
    },

    receiveIncomingCall: (
      state,
      action: PayloadAction<{
        callId: string;
        roomId: string;
        callerId: string;
        callerName: string;
        callerAvatar?: string;
        receiverId: string;
        callType: CallType;
        isGroup?: boolean;
        groupName?: string;
        participants?: CallParticipant[];
      }>,
    ) => {
      // Nếu đã trong cuộc gọi khác thì không đè
      if (state.status !== 'IDLE') return;

      state.status = 'INCOMING';
      state.callId = action.payload.callId;
      state.roomId = action.payload.roomId;
      state.callType = action.payload.callType;
      state.isGroup = !!action.payload.isGroup;
      state.groupName = action.payload.groupName;
      state.callerId = action.payload.callerId;
      state.callerName = action.payload.callerName;
      state.callerAvatar = action.payload.callerAvatar;
      state.receiverId = action.payload.receiverId;
      state.participants = action.payload.participants || [];
      state.isMuted = false;
      state.isSpeakerOn = action.payload.callType === 'video';
      state.isVideoOff = false;
      state.isFrontCamera = true;
      state.durationSeconds = 0;
      state.endReason = undefined;
    },

    addParticipant: (state, action: PayloadAction<CallParticipant>) => {
      const exists = state.participants.some((p) => p.userId === action.payload.userId);
      if (!exists) {
        state.participants.push(action.payload);
      }
    },

    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter((p) => p.userId !== action.payload);
    },

    updateParticipant: (
      state,
      action: PayloadAction<{
        userId: string;
        isMuted?: boolean;
        isVideoOff?: boolean;
        isSpeaking?: boolean;
      }>,
    ) => {
      const target = state.participants.find((p) => p.userId === action.payload.userId);
      if (target) {
        if (action.payload.isMuted !== undefined) target.isMuted = action.payload.isMuted;
        if (action.payload.isVideoOff !== undefined) target.isVideoOff = action.payload.isVideoOff;
        if (action.payload.isSpeaking !== undefined) target.isSpeaking = action.payload.isSpeaking;
      }
    },

    acceptCall: (state) => {
      state.status = 'CONNECTED';
      state.durationSeconds = 0;
    },

    callConnected: (state) => {
      state.status = 'CONNECTED';
      state.durationSeconds = 0;
    },

    setCallEnded: (state, action: PayloadAction<{ reason?: string }>) => {
      state.status = 'ENDED';
      state.endReason = action.payload.reason || 'Cuộc gọi đã kết thúc';
    },

    resetCall: () => initialState,

    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },

    toggleSpeaker: (state) => {
      state.isSpeakerOn = !state.isSpeakerOn;
    },

    toggleVideoOff: (state) => {
      state.isVideoOff = !state.isVideoOff;
    },

    toggleCameraFacing: (state) => {
      state.isFrontCamera = !state.isFrontCamera;
    },

    incrementDuration: (state) => {
      state.durationSeconds += 1;
    },
  },
});

export const {
  startOutgoingCall,
  receiveIncomingCall,
  addParticipant,
  removeParticipant,
  updateParticipant,
  acceptCall,
  callConnected,
  setCallEnded,
  resetCall,
  toggleMute,
  toggleSpeaker,
  toggleVideoOff,
  toggleCameraFacing,
  incrementDuration,
} = callSlice.actions;

export default callSlice.reducer;
