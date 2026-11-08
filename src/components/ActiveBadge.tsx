import React from 'react';
import { View } from 'tamagui';

type Props = { size?: number } & React.ComponentProps<typeof View>;

export function ActiveBadge({ size = 14, ...rest }: Props) {
  const borderWidth = Math.max(2, Math.round(size / 6));
  return (
    <View
      borderColor="background"
      backgroundColor="#31A24C"
      style={{
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: borderWidth,
      }}
      aria-label="Đang hoạt động"
      {...rest}
    />
  );
}