import { forwardRef, useState, type ReactNode } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { useAppColors } from '@/theme/ThemeProvider';

// Ports `AuthField` from docs/design/prototype/memoura-v2/auth.jsx:5.
// Labeled rounded input with focus border, leading icon glyph, optional trailing slot.

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: string;
  trailing?: ReactNode;
  error?: string;
  className?: string;
};

export const AuthField = forwardRef<TextInput, Props>(function AuthField(
  { label, icon, trailing, error, className, onFocus, onBlur, ...rest },
  ref,
) {
  const c = useAppColors();
  const [focused, setFocused] = useState(false);
  const borderClass = error
    ? 'border-primary-deep'
    : focused
      ? 'border-primary'
      : 'border-line';

  return (
    <View className={`mb-3.5 ${className ?? ''}`}>
      {label ? (
        <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center bg-surface rounded-2xl px-4 py-3.5 border-[1.5px] ${borderClass}`}
      >
        {icon ? (
          <Text className="font-body text-ink-mute text-base mr-2.5">{icon}</Text>
        ) : null}
        <TextInput
          ref={ref}
          className="flex-1 font-bodyMedium text-[15px] text-ink"
          placeholderTextColor={c.inkMute}
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
        {trailing ? <View className="ml-2">{trailing}</View> : null}
      </View>
      {error ? (
        <Text className="font-body text-xs text-primary-deep mt-1.5 pl-1">{error}</Text>
      ) : null}
    </View>
  );
});
