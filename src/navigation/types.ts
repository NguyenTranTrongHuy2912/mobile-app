export type RootStackParamList = {
  // Chưa đăng nhập
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  // Đã đăng nhập
  RoomList: undefined;
  ChatRoom: { roomId: string; title: string };
};
