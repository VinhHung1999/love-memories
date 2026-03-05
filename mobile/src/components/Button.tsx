import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  Text,
  Vibration,
  ViewStyle,
} from 'react-native';
import { useAppColors } from '../navigation/theme';

interface ButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  /** 'primary' = solid rose fill | 'outline' = white bg with border */
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

/**
 * Reusable button — NativeWind for static layout, inline for animation + shadow.
 *
 * Variants:
 *   primary — solid #E8788A background, white text, coloured shadow
 *   outline  — white background, dark text, gray border
 */
export default function Button({
  onPress,
  label,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: ButtonProps) {
  const colors = useAppColors();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
    if (!disabled && !loading) {
      Vibration.vibrate(8);
      onPress();
    }
  };

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}>
      <Animated.View
        className="h-[50px] rounded-2xl items-center justify-center mb-3"
        style={[
          { opacity: (disabled || loading) ? 0.65 : 1 },
          isPrimary
            ? {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 16,
                elevation: 10,
              }
            : {
                backgroundColor: colors.white,
                borderWidth: 1.5,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              },
          style,
          { transform: [{ scale }] },
        ]}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
        ) : (
          <Text
            className={
              isPrimary
                ? 'text-white text-base font-bold tracking-[0.4px]'
                : 'text-textDark text-[15px] font-semibold tracking-[0.1px]'
            }>
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
