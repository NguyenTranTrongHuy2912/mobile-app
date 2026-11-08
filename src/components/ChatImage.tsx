import React from 'react';
import { Image, Spinner, Text, View } from 'tamagui';
import { thumbUrl } from '../utils/imageUrl';
import type { Message } from '../types/chat';

const WIDTH = 220;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 300;

interface Props {
  message: Message;
  onPress: () => void;
}

export default function ChatImage({ message, onPress }: Props) {
  const uri = message.imageUrl ? thumbUrl(message.imageUrl, 600) : message.localUri;
  if (!uri) return null;

  const ratio =
    message.imageWidth && message.imageHeight ? message.imageWidth / message.imageHeight : 1;
  const height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, WIDTH / ratio));
  const uploading = message.status === 'sending' && (message.uploadProgress ?? 100) < 100;

  return (
    <View
      backgroundColor="surface"
      style={{
        width: WIDTH,
        height: height,
        borderRadius: 12,
        overflow: 'hidden',
      }}
      onPress={onPress}
      aria-label="Xem ảnh"
    >
      <Image 
        src={uri} 
        style={{ width: '100%', height: '100%' }} 
        objectFit="cover" 
      />
      {uploading ? (
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spinner color="#fff" />
          <Text color="#fff" fontSize={13} fontWeight="600" style={{ marginTop: 6 }}>
            {message.uploadProgress ?? 0}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}