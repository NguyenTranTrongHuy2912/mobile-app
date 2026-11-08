import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, XStack, useTheme } from 'tamagui';
import type { InputProps } from 'tamagui';

type Props = InputProps & { isPassword?: boolean };

export default function AuthInput({ isPassword, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!isPassword);
  const theme = useTheme();

  return (
    <XStack
      style={{
        alignItems: 'center',
        height: 52,
        borderWidth: 1,
        borderColor: theme.line.get() as string,
        borderRadius: 10,
        backgroundColor: theme.background.get() as string,
        paddingHorizontal: 16,
        marginBottom: 12,
      }}
    >
      <Input
        style={{
          flex: 1,
          height: 50,
          borderWidth: 0,
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          fontSize: 16,
          color: theme.ink.get() as string,
        }}
        placeholderTextColor={theme.muted.get() as any}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={hidden}
        {...rest}
      />
      {isPassword ? (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={theme.muted.get() as string}
          />
        </Pressable>
      ) : null}
    </XStack>
  );
}