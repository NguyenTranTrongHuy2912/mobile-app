// Phòng chat: 1-1 chỉ là phòng "direct" có 2 thành viên, nhóm là "group".
export type RoomType = 'direct' | 'group';

export interface RoomMember {
  userId: string;
  displayName: string;
}

export interface Room {
  id: string;
  type: RoomType;
  name: string; // direct: tên người còn lại; group: tên nhóm
  memberIds: string[];
  members: RoomMember[]; // dùng để tra tên người gửi từ senderId
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: number;
  unreadCount: number;
}

// Kết quả tìm người (tên + email để hiển thị ở dòng dưới)
export interface UserSummary {
  userId: string;
  displayName: string;
  email: string;
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

// ---- Khớp với gateway ----

// GET /api/v1/rooms và POST /api/v1/rooms
export interface RoomDto {
  room_id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  member_ids: string[];
  members: { user_id: string; display_name: string }[];
  last_message: { content: string; sender_id: string; timestamp: number } | null;
  unread_count: number;
}

export interface RoomsResponse {
  rooms: RoomDto[];
}

// GET /api/v1/users/search
export interface SearchUsersResponse {
  users: { user_id: string; display_name: string; email: string }[];
}

// POST /api/v1/rooms
export interface CreateRoomRequest {
  type: 'DIRECT' | 'GROUP';
  name: string;
  member_ids: string[]; // người còn lại; người tạo lấy từ token
}

// POST /api/v1/chat/send — sender_id do gateway lấy từ token nên không gửi nữa
export interface SendMessageRequest {
  room_id: string;
  content: string;
  message_id?: string;
}

export interface SendMessageResponse {
  message_id: string;
  is_success: boolean;
  status_message: string;
  timestamp: number;
}

// GET /api/v1/chat/history/{room_id}
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