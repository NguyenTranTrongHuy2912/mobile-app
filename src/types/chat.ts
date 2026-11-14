// Phòng chat: 1-1 chỉ là phòng "direct" có 2 thành viên, nhóm là "group".
export type RoomType = 'direct' | 'group';

export interface RoomMember {
  userId: string;
  displayName: string;
  avatarUrl?: string;
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
  pinnedMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName?: string;
    timestamp: number;
  } | null;
}

// Kết quả tìm người (tên + email để hiển thị ở dòng dưới)
export interface UserSummary {
  userId: string;
  displayName: string;
  email: string;
}

export interface ReplyToInfo {
  messageId: string;
  senderName: string;
  content: string;
}

export type MessageStatus = 'sending' | 'sent' | 'failed';
export type MessageType = 'text' | 'image' | 'video' | 'file';

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string; // image/file: có thể để trống hoặc tên/caption
  timestamp: number; // epoch milliseconds
  status: MessageStatus;
  // --- dùng cho image / video ---
  imageUrl?: string; // URL Cloudinary, có sau khi upload xong
  localUri?: string; // file trên máy, hiện ngay lúc đang gửi và dùng để gửi lại khi lỗi
  imageWidth?: number;
  imageHeight?: number;
  uploadProgress?: number; // 0-100, chỉ có khi đang upload
  videoUrl?: string;
  videoDurationMs?: number;
  isRevoked?: boolean;
  reactions?: Record<string, string[]>;
  // --- Trả lời / Trích dẫn tin nhắn ---
  replyTo?: ReplyToInfo | null;
  // --- Gửi tài liệu (Document / File) ---
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
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
  pinned_message?: {
    id: string;
    content: string;
    sender_id: string;
    sender_name?: string;
    timestamp: number;
  } | null;
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
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  media_url?: string;
  media_width?: number;
  media_height?: number;
  media_duration_ms?: number;
  reply_to?: {
    message_id: string;
    sender_name: string;
    content: string;
  };
  file_name?: string;
  file_size?: number;
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
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  media_url?: string;
  media_width?: number;
  media_height?: number;
  media_duration_ms?: number;
  is_revoked?: boolean;
  reactions?: Record<string, string[]>;
  reply_to?: {
    message_id: string;
    sender_name: string;
    content: string;
  };
  file_name?: string;
  file_size?: number;
}

export interface HistoryResponse {
  messages: HistoryItem[];
  has_more: boolean;
}

export interface MessagesState {
  messages: Message[];
  hasMore: boolean;
}

// POST /api/v1/uploads/sign — chữ ký để upload thẳng lên Cloudinary
export interface UploadSignature {
  upload_url: string;
  api_key: string;
  timestamp: number;
  public_id: string;
  transformation: string;
  signature: string;
  resource_type?: string;
}
export interface Friend {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  requestId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  createdAt: number;
}
