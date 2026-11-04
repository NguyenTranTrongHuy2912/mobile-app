import axios from 'axios';
import { Platform } from 'react-native';
import type { UploadSignature } from '../types/chat';

export interface UploadResult {
  url: string;
  width: number;
  height: number;
}

// Upload thẳng lên Cloudinary bằng chữ ký do gateway cấp (ảnh không đi qua gateway).
// Cố ý dùng axios riêng, không gắn JWT vào request gửi cho bên thứ ba.
export async function uploadImage(
  sig: UploadSignature,
  file: { uri: string; mimeType?: string },
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // Trên web uri là blob:/data: URL, phải đổi thành Blob
    const blob = await (await fetch(file.uri)).blob();
    form.append('file', blob, 'photo.jpg');
  } else {
    // React Native: FormData nhận object { uri, name, type }
    form.append('file', {
      uri: file.uri,
      name: 'photo.jpg',
      type: file.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
  }
  form.append('api_key', sig.api_key);
  form.append('timestamp', String(sig.timestamp));
  form.append('public_id', sig.public_id);
  form.append('transformation', sig.transformation);
  form.append('signature', sig.signature);

  let lastReported = -1;
  const { data } = await axios.post(sig.upload_url, form, {
    timeout: 60000,
    onUploadProgress: (e) => {
      if (!onProgress || !e.total) return;
      // Báo theo bước 5% để không render lại danh sách tin liên tục
      const percent = Math.min(99, Math.floor((e.loaded / e.total) * 20) * 5);
      if (percent !== lastReported) {
        lastReported = percent;
        onProgress(percent);
      }
    },
  });

  return { url: data.secure_url, width: data.width, height: data.height };
}
