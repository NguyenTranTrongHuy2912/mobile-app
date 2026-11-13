import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CallStatus = 'IDLE' | 'CALLING' | 'INCOMING' | 'CONNECTED' | 'ENDED';
export type CallType = 'audio' | 'video';

export interface CallState {
  status: CallStatus;
  callId: string | null;
  roomId: string | null;
  callType: CallType;
  callerId: string | null;
  callerName: string;
  callerAvatar?: string;
  receiverId: string | null;
  receiverName: string;
  receiverAvatar?: string;
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
  callerId: null,
  callerName: '',
  callerAvatar: undefined,
  receiverId: null,
  receiverName: '',
  receiverAvatar: undefined,
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
      }>,
    ) => {
      state.status = 'CALLING';
      state.callId = action.payload.callId;
      state.roomId = action.payload.roomId;
      state.callType = action.payload.callType;
      state.callerId = action.payload.callerId;
      state.callerName = action.payload.callerName;
      state.callerAvatar = action.payload.callerAvatar;
      state.receiverId = action.payload.receiverId;
      state.receiverName = action.payload.receiverName;
      state.receiverAvatar = action.payload.receiverAvatar;
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
      }>,
    ) => {
      // Nếu đã trong cuộc gọi khác thì không đè
      if (state.status !== 'IDLE') return;

      state.status = 'INCOMING';
      state.callId = action.payload.callId;
      state.roomId = action.payload.roomId;
      state.callType = action.payload.callType;
      state.callerId = action.payload.callerId;
      state.callerName = action.payload.callerName;
      state.callerAvatar = action.payload.callerAvatar;
      state.receiverId = action.payload.receiverId;
      state.isMuted = false;
      state.isSpeakerOn = action.payload.callType === 'video';
      state.isVideoOff = false;
      state.isFrontCamera = true;
      state.durationSeconds = 0;
      state.endReason = undefined;
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
