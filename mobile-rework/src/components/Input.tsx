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
      {/* T443 (Sprint 66, Build 113) — Boss diagnosed the smoking gun:
          's' (no ascender) → small box, 'h' (ascender) → larger box.
          The TextInput's glyph bbox is auto-growing per-character even
          with style.height:50. RN iOS does not strict-clamp height on
          the TextInput itself; the only reliable clamp is a parent
          View with `overflow: 'hidden'` + `justifyContent: 'center'`
          to vertical-centre the (now invisibly-growing) TextInput
          inside a hard-locked 50px box. Border + radius live on the
          container so it can clip the child cleanly. */}
      <View
        style={{
          height: 50,
          overflow: 'hidden',
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: c.surface,
          justifyContent: 'center',
        }}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={c.inkMute}
          style={{
            paddingHorizontal: 18,
            color: c.ink,
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
      </View>
      {error ? (
        <Text className="font-body text-xs text-primary-deep mt-1">{error}</Text>
      ) : hint ? (
        <Text className="font-body text-xs text-ink-mute mt-1">{hint}</Text>
      ) : null}
    </View>
  );
});
