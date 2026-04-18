import React from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  elev?: boolean;
};

export function Card({ children, onPress, className, elev }: Props) {
  const classes = [
    'bg-surface rounded-3xl p-5',
    elev ? 'shadow-sm' : 'border border-line-soft',
    className ?? '',
  ].join(' ');

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${classes} active:opacity-80`}>
        {children}
      </Pressable>
    );
  }
  return <View className={classes}>{children}</View>;
}
