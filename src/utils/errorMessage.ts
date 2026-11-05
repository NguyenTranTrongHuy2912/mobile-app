// Lỗi từ RTK Query có dạng { status, data: { detail } } hoặc { status: 'FETCH_ERROR', error }.
export function errorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null) {
    const err = e as {
      status?: unknown;
      data?: { detail?: unknown; message?: unknown };
      error?: unknown;
      message?: unknown;
    };
    if (typeof err.data?.detail === 'string' && err.data.detail.trim()) {
      return err.data.detail;
    }
    if (typeof err.data?.message === 'string' && err.data.message.trim()) {
      return err.data.message;
    }
    if (err.status === 'FETCH_ERROR') {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc gateway.';
    }
    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }
  }
  return fallback;
}
