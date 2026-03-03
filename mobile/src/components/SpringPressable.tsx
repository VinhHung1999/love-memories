import React, { useRef } from 'react';
import { Animated, Pressable, Vibration } from 'react-native';

// style prop kept: Animated.Value transform cannot be expressed as a className
export default function SpringPressable({
  onPress,
  disabled,
  children,
  className: cls,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
    if (!disabled) { Vibration.vibrate(8); onPress(); }
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View className={cls} style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
