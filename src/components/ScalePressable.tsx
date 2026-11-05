import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface ScalePressableProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
}

/**
 * Component nút bấm có hiệu ứng nảy (Scale/Spring animation)
 * Đáp ứng tiêu chí "Animation basic" theo yêu cầu của Giảng viên.
 */
export default function ScalePressable({
  style,
  scaleTo = 0.92,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
