// Lỗi từ RTK Query có dạng { status, data: { detail } }.
// Gateway chỉ để lộ nội dung lỗi (tiếng Việt, do backend viết) với mã 400;
// các mã khác dùng thông báo mặc định của màn hình.
export function errorMessage(e: unknown, fallback: string): string {
  const err = e as { status?: unknown; data?: { detail?: unknown } } | undefined;
  if (err?.status === 400 && typeof err.data?.detail === 'string' && err.data.detail) {
    return err.data.detail;
  }
  return fallback;
}