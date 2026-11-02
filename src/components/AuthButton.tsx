import React, { useState } from 'react';
import { Button, Spinner } from 'tamagui';
import { colors } from '../theme';

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

   return (
    <Button
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      height={52}
      borderRadius={26}
      backgroundColor={outline ? colors.background : colors.primary}
      borderWidth={outline ? 1 : 0}
      borderColor={colors.primary}
      color={outline ? colors.primary : '#fff'}
      fontSize={17}
      fontWeight="600"
      opacity={disabled || pressed ? 0.6 : 1}
    >
      {loading ? <Spinner color={outline ? colors.primary : '#fff'} /> : title}
    </Button>
  );
}