import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface ActiveBadgeProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function ActiveBadge({ size = 14, style }: ActiveBadgeProps) {
  const borderWidth = Math.max(2, Math.round(size / 6));
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
        },
        style,
      ]}
      accessibilityLabel="Đang hoạt động"
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#31A24C',
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
});
