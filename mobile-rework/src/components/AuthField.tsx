import { forwardRef, useState, type ReactNode } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { useAppColors } from '@/theme/ThemeProvider';

// Ports `AuthField` from docs/design/prototype/memoura-v2/auth.jsx:5.
// Labeled rounded input with focus border, leading icon glyph, optional trailing slot.

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  icon?: ReactNode;
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
      : 'border-line-on-surface';

  return (
    <View className={`mb-3.5 ${className ?? ''}`}>
      {label ? (
        <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
          {label}
        </Text>
      ) : null}
      {/* T298 (bug #1): NativeWind 1.5px border renders heavier on iOS than CSS
          1.5px (same calibration drift as T296 shadow). Tailwind default
          `border` (1px) matches Boss's eye-calibrated weight from the mock. */}
      <View
        className={`flex-row items-center bg-surface rounded-2xl px-4 py-3.5 border ${borderClass}`}
      >
        {/* T298 (bug #2): icon is now a ReactNode (lucide component) — render
            directly with mr-2.5 spacing. Old API wrapped a Text glyph; that
            stays out so lucide strokes render at native size. */}
        {icon ? <View className="mr-2.5">{icon}</View> : null}
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
