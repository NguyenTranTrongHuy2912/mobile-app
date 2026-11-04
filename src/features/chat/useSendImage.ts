import { useCallback } from 'react';
import {
  chatApi,
  useGetUploadSignatureMutation,
  useSendMessageMutation,
} from '../../api/chatApi';
import { uploadMedia } from '../../api/uploadApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { newId } from '../../utils/newId';
import type { Message } from '../../types/chat';

export interface PickedMedia {
  uri: string;
  type?: 'image' | 'video';
  width?: number;
  height?: number;
  mimeType?: string;
  duration?: number;
}

export type PickedImage = PickedMedia;

// Gửi ảnh / video: hiện ngay bằng file trên máy -> xin chữ ký -> upload Cloudinary -> gửi tin nhắn kèm URL.
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
      source: PickedMedia,
      uploadedUrl?: string,
    ) => {
      const isVideo = source.type === 'video' || source.mimeType?.startsWith('video/');
      patch(localId, (m) => {
        m.status = 'sending';
        m.uploadProgress = uploadedUrl ? 100 : 0;
      });
      try {
        let url = uploadedUrl;
        let width = source.width;
        let height = source.height;
        let duration = source.duration;

        if (!url) {
          if (!source.uri) throw new Error('Không còn file để gửi lại');
          const sig = await getSignature({ resourceType: isVideo ? 'video' : 'image' }).unwrap();
          const up = await uploadMedia(
            sig,
            { uri: source.uri, mimeType: source.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg') },
            (p) =>
              patch(localId, (m) => {
                m.uploadProgress = p;
              }),
          );
          url = up.url;
          width = up.width;
          height = up.height;
          duration = duration ?? (up.duration ? Math.round(up.duration * 1000) : undefined);

          patch(localId, (m) => {
            if (isVideo) {
              m.videoUrl = url;
              m.videoDurationMs = duration;
            } else {
              m.imageUrl = url;
            }
            m.imageWidth = width;
            m.imageHeight = height;
            m.uploadProgress = 100;
          });
        }

        // onQueryStarted của sendMessage sẽ cập nhật trạng thái sent/failed
        await sendMessage({
          roomId,
          senderId: userId,
          type: isVideo ? 'video' : 'image',
          content: '',
          localId,
          imageUrl: isVideo ? undefined : url,
          videoUrl: isVideo ? url : undefined,
          imageWidth: width,
          imageHeight: height,
          durationMs: duration,
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
    async (images: PickedMedia[]) => {
      // Hiện hết tin tạm trước, rồi gửi lần lượt để giữ đúng thứ tự
      const items = images.map((img) => ({ img, localId: newId() }));
      dispatch(
        chatApi.util.updateQueryData('getMessages', roomId, (draft) => {
          for (const { img, localId } of items) {
            const isVideo = img.type === 'video' || img.mimeType?.startsWith('video/');
            draft.messages.push({
              id: localId,
              roomId,
              senderId: userId,
              type: isVideo ? 'video' : 'image',
              content: '',
              timestamp: Date.now(),
              status: 'sending',
              localUri: img.uri,
              imageWidth: img.width,
              imageHeight: img.height,
              videoDurationMs: img.duration,
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

  const retryMedia = useCallback(
    (m: Message) =>
      process(
        m.id,
        {
          uri: m.localUri ?? '',
          type: m.type === 'video' ? 'video' : 'image',
          width: m.imageWidth,
          height: m.imageHeight,
          duration: m.videoDurationMs,
        },
        m.type === 'video' ? m.videoUrl : m.imageUrl,
      ),
    [process],
  );

  return { sendImages, sendMedia: sendImages, retryImage: retryMedia, retryMedia };
}
