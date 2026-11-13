import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface AnimatedMessageItemProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Component tạo hiệu ứng FadeInUp nhẹ nhàng khi tin nhắn xuất hiện
 * Đáp ứng tiêu chí "Animation basic" chuẩn trải nghiệm người dùng.
 */
export default function AnimatedMessageItem({ style, children }: AnimatedMessageItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
