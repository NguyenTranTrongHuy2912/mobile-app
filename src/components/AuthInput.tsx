import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, XStack } from 'tamagui';
import type { InputProps } from 'tamagui';
import { colors } from '../theme';

type Props = InputProps & { isPassword?: boolean };

export default function AuthInput({ isPassword, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!isPassword);

  return (
    <XStack
      alignItems="center"
      height={52}
      borderWidth={1}
      borderColor={colors.border}
      borderRadius={10}
      backgroundColor={colors.background}
      paddingHorizontal={16}
      marginBottom={12}
    >
      <Input
        flex={1}
        height={50}
        borderWidth={0}
        backgroundColor="transparent"
        paddingHorizontal={0}
        fontSize={16}
        color={colors.text}
        placeholderTextColor={colors.subtext}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
        secureTextEntry={hidden}
      />
      {isPassword ? (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.subtext}
          />
        </Pressable>
      ) : null}
    </XStack>
  );
}