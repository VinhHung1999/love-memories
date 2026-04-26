import React, { forwardRef, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppColors } from '@/theme/ThemeProvider';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, hint, className, onFocus, onBlur, ...rest },
  ref,
) {
  const c = useAppColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? c.primaryDeep
    : focused
      ? c.primary
      : c.lineOnSurface;

  // T439 (Sprint 66): pivot to the proven EditProfileSheet pattern. The old
  // wrapper `<View h-12 justify-center>` with a child TextInput let the
  // input's natural text-block grow on type — RN iOS default vertical
  // padding shifts between empty + typed states, and Android adds extra
  // `includeFontPadding`; the parent stretched + the caret jittered every
  // keystroke (fired on plain ASCII too, not just diacritics — Boss
  // confirm 2026-04-26).
  //
  // Fix: drop the parent wrapper. Apply padding/border/bg directly on the
  // TextInput style. Height derives from `paddingVertical + fontSize +
  // lineHeight` and stays constant across the empty → 1-char → full-text
  // lifecycle. Pattern verified shipping in EditProfileSheet:279-289.
  // Label / error / hint slots stay above + below the TextInput.
  return (
    <View className={className}>
      {label ? (
        <Text className="font-bodyMedium text-sm text-ink-soft mb-2">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={c.inkMute}
        // T440 (Sprint 66, Build 110): match the EditProfileSheet pattern
        // 1:1. Build 109 added an explicit `lineHeight: 20` "for safety"
        // which on iOS reflows the rendered text bbox between empty and
        // typed states (font-intrinsic line metric ≠ 20) — that was the
        // last source of height jitter on plain ASCII. Drop it entirely;
        // let the font's natural line metric decide. Android-only props
        // (includeFontPadding / textAlignVertical) are no-ops on iOS so
        // also dropped to keep parity with the proven Profile shape.
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontFamily: 'BeVietnamPro_400Regular',
          fontSize: 15,
          backgroundColor: c.surface,
          color: c.ink,
          borderColor,
          borderWidth: 1,
          borderRadius: 16,
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <Text className="font-body text-xs text-primary-deep mt-1">{error}</Text>
      ) : hint ? (
        <Text className="font-body text-xs text-ink-mute mt-1">{hint}</Text>
      ) : null}
    </View>
  );
});
