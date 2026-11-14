import axios from 'axios';
import { Platform } from 'react-native';
import type { UploadSignature } from '../types/chat';

export interface UploadResult {
  url: string;
  width: number;
  height: number;
  duration?: number;
}

// Upload thẳng lên Cloudinary bằng chữ ký do gateway cấp (file không đi qua gateway).
// Cố ý dùng axios riêng, không gắn JWT vào request gửi cho bên thứ ba.
export async function uploadMedia(
  sig: UploadSignature,
  file: { uri: string; name?: string; mimeType?: string },
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const isVideo = file.mimeType?.startsWith('video/') || sig.upload_url.includes('/video/');
  const isRaw = sig.upload_url.includes('/raw/') || (!isVideo && !file.mimeType?.startsWith('image/'));
  const fileName = file.name || (isVideo ? 'video.mp4' : isRaw ? 'document.bin' : 'photo.jpg');

  const form = new FormData();
  if (Platform.OS === 'web') {
    // Trên web uri là blob:/data: URL, phải đổi thành Blob
    const blob = await (await fetch(file.uri)).blob();
    form.append('file', blob, fileName);
  } else {
    // React Native: FormData nhận object { uri, name, type }
    form.append('file', {
      uri: file.uri,
      name: fileName,
      type: file.mimeType ?? (isVideo ? 'video/mp4' : isRaw ? 'application/octet-stream' : 'image/jpeg'),
    } as unknown as Blob);
  }
  form.append('api_key', sig.api_key);
  form.append('timestamp', String(sig.timestamp));
  form.append('public_id', sig.public_id);
  if (sig.transformation) {
    form.append('transformation', sig.transformation);
  }
  form.append('signature', sig.signature);

  let lastReported = -1;
  const { data } = await axios.post(sig.upload_url, form, {
    timeout: 120000, // Video dung lượng lớn hơn nên để timeout 2 phút
    onUploadProgress: (e) => {
      if (!onProgress || !e.total) return;
      // Báo theo bước 5% để không render lại liên tục
      const percent = Math.min(99, Math.floor((e.loaded / e.total) * 20) * 5);
      if (percent !== lastReported) {
        lastReported = percent;
        onProgress(percent);
      }
    },
  });

  return {
    url: data.secure_url,
    width: data.width || 0,
    height: data.height || 0,
    duration: data.duration,
  };
}

export const uploadImage = uploadMedia;
