import React from 'react';
import { Image, Text, View } from 'react-native';

type Size = 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  uri?: string | null;
  name?: string;
  size?: Size;
  className?: string;
};

const sizes: Record<Size, { box: string; text: string }> = {
  sm: { box: 'w-8 h-8 rounded-full', text: 'text-xs' },
  md: { box: 'w-10 h-10 rounded-full', text: 'text-sm' },
  lg: { box: 'w-14 h-14 rounded-full', text: 'text-base' },
  xl: { box: 'w-24 h-24 rounded-full', text: 'text-2xl' },
};

function initials(name?: string) {
  if (!name) return '·';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ uri, name, size = 'md', className }: Props) {
  const s = sizes[size];
  const base = `${s.box} bg-primary-soft items-center justify-center overflow-hidden ${className ?? ''}`;
  if (uri) {
    return (
      <View className={base}>
        <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
      </View>
    );
  }
  return (
    <View className={base}>
      <Text className={`font-bodySemibold text-primary-deep ${s.text}`}>{initials(name)}</Text>
    </View>
  );
}
