import { useCallback } from 'react';
import {
  chatApi,
  useGetUploadSignatureMutation,
  useSendMessageMutation,
} from '../../api/chatApi';
import { uploadImage } from '../../api/uploadApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { newId } from '../../utils/newId';
import type { Message } from '../../types/chat';

export interface PickedImage {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

// Gửi ảnh: hiện ngay bằng ảnh trên máy -> xin chữ ký -> upload Cloudinary -> gửi tin nhắn kèm URL.
// Lỗi ở bước nào thì tin ở trạng thái "failed", bấm gửi lại sẽ làm tiếp từ bước dang dở.
export function useSendImage(roomId: string) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((s) => s.session.userId);
  const [getSignature] = useGetUploadSignatureMutation();
  const [sendMessage] = useSendMessageMutation();

  const patch = useCallback(
    (id: string, update: (m: Message) => void) => {
      dispatch(
        chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
          const msg = draft.messages.find((m) => m.id === id);
          if (msg) update(msg);
        }),
      );
    },
    [dispatch, roomId],
  );

  const process = useCallback(
    async (
      localId: string,
      source: { uri?: string; mimeType?: string; width?: number; height?: number },
      uploadedUrl?: string,
    ) => {
      patch(localId, (m) => {
        m.status = 'sending';
        m.uploadProgress = uploadedUrl ? 100 : 0;
      });
      try {
        let url = uploadedUrl;
        let width = source.width;
        let height = source.height;

        if (!url) {
          if (!source.uri) throw new Error('Không còn ảnh để gửi lại');
          const sig = await getSignature().unwrap();
          const up = await uploadImage(sig, { uri: source.uri, mimeType: source.mimeType }, (p) =>
            patch(localId, (m) => {
              m.uploadProgress = p;
            }),
          );
          url = up.url;
          width = up.width;
          height = up.height;
          patch(localId, (m) => {
            m.imageUrl = url;
            m.imageWidth = width;
            m.imageHeight = height;
            m.uploadProgress = 100;
          });
        }

        // onQueryStarted của sendMessage sẽ cập nhật trạng thái sent/failed
        await sendMessage({
          roomId,
          senderId: userId,
          type: 'image',
          content: '',
          localId,
          imageUrl: url,
          imageWidth: width,
          imageHeight: height,
        }).unwrap();
      } catch {
        patch(localId, (m) => {
          m.status = 'failed';
        });
      }
    },
    [getSignature, patch, roomId, sendMessage, userId],
  );

  const sendImages = useCallback(
    async (images: PickedImage[]) => {
      // Hiện hết tin tạm trước, rồi gửi lần lượt để giữ đúng thứ tự
      const items = images.map((img) => ({ img, localId: newId() }));
      dispatch(
        chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
          for (const { img, localId } of items) {
            draft.messages.push({
              id: localId,
              roomId,
              senderId: userId,
              type: 'image',
              content: '',
              timestamp: Date.now(),
              status: 'sending',
              localUri: img.uri,
              imageWidth: img.width,
              imageHeight: img.height,
              uploadProgress: 0,
            });
          }
        }),
      );
      for (const { img, localId } of items) {
        await process(localId, img);
      }
    },
    [dispatch, process, roomId, userId],
  );

  const retryImage = useCallback(
    (m: Message) =>
      process(
        m.id,
        { uri: m.localUri, width: m.imageWidth, height: m.imageHeight },
        m.imageUrl, // đã upload xong thì chỉ gửi lại tin nhắn
      ),
    [process],
  );

  return { sendImages, retryImage };
}
