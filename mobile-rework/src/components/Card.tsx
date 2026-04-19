import React from 'react';
import { Pressable, View } from 'react-native';

// T296: shared Card with 4 prototype-derived variants. Caller controls
// padding via `className` — variants intentionally only set radius / border /
// background / shadow so PairOption (px-4 py-[18px]) and the InviteState code
// card (px-5 py-8) can share the component without one-size compromise.
type Variant = 'option' | 'elevated' | 'plain' | 'chip';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  variant?: Variant;
  accessibilityState?: { disabled?: boolean; busy?: boolean; selected?: boolean };
};

const VARIANTS: Record<Variant, string> = {
  option: 'rounded-[20px] border border-line bg-surface shadow-card',
  elevated: 'rounded-[28px] border border-line bg-bg-elev shadow-elevated',
  plain: 'rounded-3xl bg-surface border border-line-soft',
  chip: 'rounded-full border border-line bg-surface shadow-chip',
};

export function Card({
  children,
  onPress,
  className,
  variant = 'plain',
  accessibilityState,
}: Props) {
  const classes = `${VARIANTS[variant]} ${className ?? ''}`;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        className={`${classes} active:opacity-90`}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={classes}>{children}</View>;
}
