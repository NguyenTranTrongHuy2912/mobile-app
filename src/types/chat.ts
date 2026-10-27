// Phòng chat: 1-1 chỉ là phòng "direct" có 2 thành viên, nhóm là "group".
export type RoomType = 'direct' | 'group';

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  memberIds: string[];
  lastMessage?: string;
  lastMessageAt?: number;
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number; // epoch milliseconds
  status: MessageStatus;
}

// Khớp với POST /api/v1/chat/send của gateway
export interface SendMessageRequest {
  room_id: string;
  sender_id: string;
  content: string;
  message_id?: string;
}

export interface SendMessageResponse {
  message_id: string;
  is_success: boolean;
  status_message: string;
  timestamp: number;
}

// Khớp với GET /api/v1/chat/{room_id}/messages của gateway
export interface HistoryItem {
  message_id: string;
  room_id: string;
  sender_id: string;
  content: string;
  timestamp: number;
}

export interface HistoryResponse {
  messages: HistoryItem[];
  has_more: boolean;
}