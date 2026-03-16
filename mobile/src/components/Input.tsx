import React, { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useAppColors } from '../navigation/theme';
import { Caption } from './Typography';

/**
 * Styled TextInput — NativeWind for static styles, inline object for focus state.
 *
 * Blur  → border-border dark:border-darkBorder (light gray) — always visible
 * Focus → primary-tinted border + white background
 *
 * Pass `bottomSheet` prop when used inside a BottomSheet to enable keyboard avoiding.
 *
 * Default maxLength: 100 (single-line) / 500 (multiline).
 * Character counter appears at ≥80% of limit, turns red at limit.
 */
interface InputProps extends TextInputProps {
  bottomSheet?: boolean;
}

const DEFAULT_MAX_SINGLE = 100;
const DEFAULT_MAX_MULTI = 500;

export default function Input({ bottomSheet, ...props }: InputProps) {
  const colors = useAppColors();
  const [focused, setFocused] = useState(false);

  const Component = bottomSheet ? BottomSheetTextInput : TextInput;
  const maxLength = props.maxLength ?? (props.multiline ? DEFAULT_MAX_MULTI : DEFAULT_MAX_SINGLE);
  const currentLength = props.value?.length ?? 0;
  const showCounter = currentLength >= Math.floor(maxLength * 0.8);
  const isAtLimit = currentLength >= maxLength;

  return (
    <View className="mb-[10px]">
      <Component
        {...props}
        maxLength={maxLength}
        placeholderTextColor={colors.textLight}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
        className={`${props.multiline ? 'min-h-[72px] py-3' : 'h-[50px]'} rounded-2xl border-[1.5px] border-border dark:border-darkBorder px-[18px]`}
        style={[
          { backgroundColor: focused ? colors.inputFocusBg : colors.inputBg },
          { color: colors.textDark },
          focused && { borderColor: colors.inputBorderFocus },
          props.style,
        ]}
      />
      {showCounter && (
        <Caption
          className="text-right pr-1"
          style={{ color: isAtLimit ? '#EF4444' : colors.textLight }}
        >
          {`${currentLength}/${maxLength}`}
        </Caption>
      )}
    </View>
  );
}
