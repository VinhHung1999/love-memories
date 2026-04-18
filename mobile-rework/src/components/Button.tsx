import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
};

const container: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-deep',
  secondary: 'bg-surface-alt active:bg-primary-soft',
  ghost: 'bg-transparent active:bg-surface-alt',
  outline: 'bg-transparent border border-line active:bg-surface-alt',
};

const label: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-ink',
  outline: 'text-ink',
};

const sizes: Record<Size, { box: string; text: string }> = {
  sm: { box: 'h-10 px-4 rounded-full', text: 'text-sm' },
  md: { box: 'h-12 px-5 rounded-full', text: 'text-base' },
  lg: { box: 'h-14 px-6 rounded-full', text: 'text-base' },
};

export function Button({
  label: text,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  leading,
  trailing,
  fullWidth,
  className,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={[
        'flex-row items-center justify-center',
        sizes[size].box,
        container[variant],
        isDisabled ? 'opacity-50' : '',
        fullWidth ? 'self-stretch' : 'self-start',
        className ?? '',
      ].join(' ')}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : undefined} />
      ) : (
        <>
          {leading ? <View className="mr-2">{leading}</View> : null}
          <Text className={`font-bodySemibold ${sizes[size].text} ${label[variant]}`}>{text}</Text>
          {trailing ? <View className="ml-2">{trailing}</View> : null}
        </>
      )}
    </Pressable>
  );
}
