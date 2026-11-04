import React from 'react';
import NewChatScreen from './NewChatScreen';

// Giai đoạn đầu: tìm người rồi mở chat 1-1.
// Khi có hệ thống kết bạn (lời mời, danh sách bạn), màn này sẽ được thay bằng danh sách bạn bè.
export default function FriendsScreen() {
  return <NewChatScreen navigate="push" autoFocus={false} />;
}
