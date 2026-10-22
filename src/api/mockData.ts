import type { Message, Room } from '../types/chat';

// Dữ liệu giả cho các API backend chưa có (danh sách phòng, lịch sử tin nhắn).
// Khi backend/gateway có endpoint thật, xóa file này và đổi query trong chatApi.ts.

export const ME = 'user_mobile_react_native';

export const mockRooms: Room[] = [
  {
    id: 'room_101',
    type: 'group',
    name: 'Nhóm FIT IUH',
    memberIds: [ME, 'user_fit_iuh', 'user_lan', 'user_minh'],
    lastMessage: 'Hello from FastAPI Gateway!',
    lastMessageAt: Date.now() - 5 * 60 * 1000,
  },
  {
    id: 'room_102',
    type: 'direct',
    name: 'Lan',
    memberIds: [ME, 'user_lan'],
    lastMessage: 'Tối nay họp nhóm nhé',
    lastMessageAt: Date.now() - 60 * 60 * 1000,
  },
];

export const mockMessages: Record<string, Message[]> = {
  room_101: [
    {
      id: 'm1',
      roomId: 'room_101',
      senderId: 'user_fit_iuh',
      content: 'Hello from FastAPI Gateway!',
      timestamp: Date.now() - 5 * 60 * 1000,
      status: 'sent',
    },
  ],
  room_102: [
    {
      id: 'm2',
      roomId: 'room_102',
      senderId: 'user_lan',
      content: 'Tối nay họp nhóm nhé',
      timestamp: Date.now() - 60 * 60 * 1000,
      status: 'sent',
    },
  ],
};
