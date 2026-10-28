import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type Props = TextInputProps & { isPassword?: boolean };

export default function AuthInput({ isPassword, style, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!isPassword);

  return (
    <View style={styles.wrapper}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
        style={[styles.input, style]}
        placeholderTextColor={colors.subtext}
        secureTextEntry={hidden}
      />
      {isPassword ? (
        <Pressable onPress={() => setHidden((h) => !h)} style={styles.eye} hitSlop={8}>
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.subtext}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center', marginBottom: 12 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  eye: { position: 'absolute', right: 14 },
});
