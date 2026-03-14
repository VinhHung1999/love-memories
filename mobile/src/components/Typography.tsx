import React, { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

interface TypographyProps {
  children: ReactNode;
  className?: string;
  numberOfLines?: number;
  onPress?: () => void;
}

// ── Heading — BeVietnamPro-Bold ────────────────────────────────────────────────
// size: 'xl'=32px | 'lg'=22px | 'md'=18px | 'sm'=16px  (default: 'md')
interface HeadingProps extends TypographyProps {
  size?: 'xl' | 'lg' | 'md' | 'sm';
}

const headingSizeClass: Record<NonNullable<HeadingProps['size']>, string> = {
  xl: 'text-[32px]',
  lg: 'text-[22px]',
  md: 'text-[18px]',
  sm: 'text-[16px]',
};

export function Heading({ size = 'md', children, className, numberOfLines, onPress }: HeadingProps) {
  const base = `font-heading text-textDark ${headingSizeClass[size]}`;
  const text = (
    <Text className={`${base}${className ? ` ${className}` : ''}`} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
  if (onPress) return <Pressable onPress={onPress}>{text}</Pressable>;
  return text;
}

// ── Body — BeVietnamPro-Regular ────────────────────────────────────────────────
// size: 'lg'=16px | 'md'=14px | 'sm'=12px  (default: 'md')
interface BodyProps extends TypographyProps {
  size?: 'lg' | 'md' | 'sm';
}

const bodySizeClass: Record<NonNullable<BodyProps['size']>, string> = {
  lg: 'text-[16px]',
  md: 'text-[14px]',
  sm: 'text-[12px]',
};

export function Body({ size = 'md', children, className, numberOfLines, onPress }: BodyProps) {
  const base = `font-body text-textDark ${bodySizeClass[size]}`;
  const text = (
    <Text className={`${base}${className ? ` ${className}` : ''}`} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
  if (onPress) return <Pressable onPress={onPress}>{text}</Pressable>;
  return text;
}

// ── Caption — BeVietnamPro-Light, 11px, textLight ─────────────────────────────
export function Caption({ children, className, numberOfLines, onPress }: TypographyProps) {
  const base = 'font-bodyLight text-[11px] text-textLight';
  const text = (
    <Text className={`${base}${className ? ` ${className}` : ''}`} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
  if (onPress) return <Pressable onPress={onPress}>{text}</Pressable>;
  return text;
}

// ── Label — BeVietnamPro-Medium, 13px ─────────────────────────────────────────
export function Label({ children, className, numberOfLines, onPress }: TypographyProps) {
  const base = 'font-bodyMedium text-[13px] text-textDark';
  const text = (
    <Text className={`${base}${className ? ` ${className}` : ''}`} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
  if (onPress) return <Pressable onPress={onPress}>{text}</Pressable>;
  return text;
}

// ── Cursive — Borel-Regular, decorative ───────────────────────────────────────
export function Cursive({ children, className, numberOfLines, onPress }: TypographyProps) {
  const base = 'font-cursive text-textDark';
  const text = (
    <Text className={`${base}${className ? ` ${className}` : ''}`} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
  if (onPress) return <Pressable onPress={onPress}>{text}</Pressable>;
  return text;
}
