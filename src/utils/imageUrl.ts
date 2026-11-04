// Ảnh Cloudinary cho phép đổi kích thước ngay trên URL (CDN tự tạo và cache bản nhỏ).
// Các URL không phải Cloudinary (hoặc ảnh trên máy) được trả về nguyên vẹn.
export function thumbUrl(url: string, width: number): string {
  const marker = '/image/upload/';
  const i = url.indexOf(marker);
  if (i === -1 || !url.includes('res.cloudinary.com')) return url;
  const cut = i + marker.length;
  return `${url.slice(0, cut)}c_limit,w_${width},q_auto,f_auto/${url.slice(cut)}`;
}
