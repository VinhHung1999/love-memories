import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
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
      {/* T444 (Sprint 66, Build 114) — Boss-directed RADICAL pivot.
          Builds 109-113 all attacked the same angle (TextInput auto-
          grows on glyph height, fight it via padding / lineHeight /
          overflow:hidden parent). All failed. EditProfileSheet inputs
          DO render stable — only difference: they use Gorhom's
          `BottomSheetTextInput`. Try it standalone here.
          BottomSheetModalProvider is mounted at root (app/_layout.tsx),
          so the context is globally available even outside an actual
          sheet. Force `multiline={false}` + `numberOfLines={1}` so the
          component absolutely cannot reflow on glyph height. If this
          throws or crashes outside a sheet context, revert + try a
          different surface (e.g. react-native-paper). */}
      <BottomSheetTextInput
        // T444 — forwardRef typed against RN core TextInput; gorhom's
        // wrapper expects its own gesture-handler TextInput type. Cast
        // through `any` to keep the public Input API stable while the
        // BottomSheetTextInput experiment is in flight.
        ref={ref as any}
        placeholderTextColor={c.inkMute}
        multiline={false}
        numberOfLines={1}
        style={{
          height: 50,
          paddingHorizontal: 18,
          borderWidth: 1.5,
          borderRadius: 16,
          borderColor,
          backgroundColor: c.surface,
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
      {error ? (
        <Text className="font-body text-xs text-primary-deep mt-1">{error}</Text>
      ) : hint ? (
        <Text className="font-body text-xs text-ink-mute mt-1">{hint}</Text>
      ) : null}
    </View>
  );
});
