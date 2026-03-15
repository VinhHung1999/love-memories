import React, { useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useAppColors } from '../navigation/theme';

/**
 * Styled TextInput — NativeWind for static styles, inline object for focus state.
 *
 * Blur  → border-border (light gray) — always visible
 * Focus → primary-tinted border + white background
 */
export default function Input(props: TextInputProps) {
  const colors = useAppColors();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textLight}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e); }}
      className={`${props.multiline ? 'min-h-[72px] py-3' : 'h-[50px]'} rounded-2xl border-[1.5px] border-border px-[18px] mb-[10px]`}
      style={[
        { backgroundColor: focused ? colors.inputFocusBg : colors.inputBg },
        focused && { borderColor: colors.inputBorderFocus },
        props.style,
      ]}
    />
  );
}
