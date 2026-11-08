import React, { useState } from 'react';
import { Button, Spinner, Text, useTheme } from 'tamagui';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export default function AuthButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: Props) {
  const outline = variant === 'outline';
  const [pressed, setPressed] = useState(false);
  const theme = useTheme();

  const bgColor = outline ? theme.background.get() : theme.brand.get();
  const textColor = outline ? theme.brand.get() : '#fff';
  const borderColor = theme.brand.get();

  return (
    <Button
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      style={{
        height: 52,
        borderRadius: 26,
        backgroundColor: bgColor as string,
        borderWidth: outline ? 1 : 0,
        borderColor: borderColor as string,
        opacity: disabled || pressed ? 0.6 : 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {loading ? (
        <Spinner style={{ color: textColor as string }} />
      ) : (
        <Text style={{ color: textColor as string }} fontSize={17} fontWeight="600">
          {title}
        </Text>
      )}
    </Button>
  );
}