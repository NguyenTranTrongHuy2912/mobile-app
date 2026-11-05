import dayjs from 'dayjs';

const WEEKDAYS_SHORT = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
const WEEKDAYS_UPPER = ['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'];

/**
 * Định dạng thời gian cho danh sách phòng chat (RoomListScreen)
 * Chuẩn Facebook Messenger (Ảnh 1):
 * - Hôm nay: "10:25"
 * - Trong tuần (1-6 ngày trước): "Th 4", "Th 3", "CN"...
 * - Cũ hơn trong năm: "DD/MM" (hoặc "15/10")
 * - Khác năm: "DD/MM/YYYY"
 */
export function formatRoomListTime(ts: number): string {
  if (!ts) return '';
  const d = dayjs(ts);
  const now = dayjs();

  // Cùng ngày hôm nay -> hiện HH:mm
  if (d.isSame(now, 'day')) {
    return d.format('HH:mm');
  }

  // Trong vòng 7 ngày qua -> hiện Thứ (Th 4, Th 3, Th 2, CN...)
  const diffDays = now.diff(d, 'day');
  if (diffDays >= 0 && diffDays < 7) {
    const dayOfWeek = d.day(); // 0: CN, 1: T2, ..., 6: T7
    return WEEKDAYS_SHORT[dayOfWeek];
  }

  // Khác năm
  if (!d.isSame(now, 'year')) {
    return d.format('DD/MM/YYYY');
  }

  // Cùng năm
  return d.format('DD/MM');
}

/**
 * Định dạng phân cách ngày/giờ căn giữa trong phòng chat (ChatRoomScreen)
 * Chuẩn Facebook Messenger (Ảnh 4):
 * - Cùng ngày hôm nay: "10:25"
 * - Hôm qua: "HÔM QUA LÚC 14:30"
 * - Trong tuần: "TH 4 LÚC 23:16"
 * - Cũ hơn: "15 THG 10, 2026 LÚC 14:00"
 */
export function formatChatDivider(ts: number): string {
  const d = dayjs(ts);
  const now = dayjs();

  if (d.isSame(now, 'day')) {
    return d.format('HH:mm');
  }

  const yesterday = now.subtract(1, 'day');
  if (d.isSame(yesterday, 'day')) {
    return `HÔM QUA LÚC ${d.format('HH:mm')}`;
  }

  const diffDays = now.diff(d, 'day');
  if (diffDays >= 0 && diffDays < 7) {
    const dayOfWeek = d.day();
    return `${WEEKDAYS_UPPER[dayOfWeek]} LÚC ${d.format('HH:mm')}`;
  }

  if (d.isSame(now, 'year')) {
    return `${d.format('DD')} THG ${d.format('MM')} LÚC ${d.format('HH:mm')}`;
  }

  return `${d.format('DD')} THG ${d.format('MM')}, ${d.format('YYYY')} LÚC ${d.format('HH:mm')}`;
}

/**
 * Định dạng thời gian tương đối cho tab Thông báo (NotificationsScreen)
 * Chuẩn Facebook Messenger (Ảnh 3):
 * "1 giờ", "2 ngày", "1 tuần", "2 tuần"
 */
export function formatRelativeTimeVN(ts: number): string {
  if (!ts) return '';
  const d = dayjs(ts);
  const now = dayjs();

  const diffMinutes = now.diff(d, 'minute');
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút`;

  const diffHours = now.diff(d, 'hour');
  if (diffHours < 24) return `${diffHours} giờ`;

  const diffDays = now.diff(d, 'day');
  if (diffDays < 7) return `${diffDays} ngày`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} tuần`;

  const diffMonths = now.diff(d, 'month');
  if (diffMonths < 12) return `${diffMonths} tháng`;

  return `${now.diff(d, 'year')} năm`;
}
