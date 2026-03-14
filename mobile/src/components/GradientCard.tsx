import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface GradientCardProps {
  children: React.ReactNode;
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
  pressableClassName?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export function GradientCard({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  className = '',
  pressableClassName = '',
  style,
  onPress,
}: GradientCardProps) {
  if (!onPress) {
    return (
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={[{ borderRadius: 24 }, className ? {} : {}, style]}>
        {children}
      </LinearGradient>
    );
  }

  return (
    <Pressable onPress={onPress} style={[{ borderRadius: 24, overflow: 'hidden' }, pressableClassName ? {} : {}, style]}>
      <LinearGradient colors={colors} start={start} end={end}>
        {children}
      </LinearGradient>
    </Pressable>
  );
}
