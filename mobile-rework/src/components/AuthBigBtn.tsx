import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useAppColors } from '@/theme/ThemeProvider';

// Ports `AuthBigBtn` from docs/design/prototype/memoura-v2/auth.jsx:42.
// Full-width pill CTA. Dark ink bg when enabled, soft surface when disabled.
//
// T292 (bug #3): added `variant` prop. Default 'ink' keeps the original
// auth-form rhythm (5 callers: Login/SignUp/Forgot/Personalize/PairJoin).
// 'primary' flips fill to bg-primary so threshold CTAs (Permissions) read as
// hero against a screen full of primary-tinted cards instead of "sinking"
// into a plain ink button. Text stays text-bg in both variants since both
// fills are dark enough in light mode and saturated enough in dark.

type Variant = 'ink' | 'primary';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  trailing?: string;
  variant?: Variant;
};

export function AuthBigBtn({
  label,
  onPress,
  disabled,
  loading,
  trailing = '→',
  variant = 'ink',
}: Props) {
  const c = useAppColors();
  const isDisabled = disabled || loading;

  // NativeWind v4 crashes ("Couldn't find a navigation context") when a
  // className string toggles an interactive modifier like `active:opacity-90`
  // via ternary interpolation. Drive all conditional styling through `style`
  // + `useAppColors()` and keep `className` a single static string.
  const containerStyle = isDisabled
    ? { backgroundColor: c.surface }
    : {
        backgroundColor: variant === 'ink' ? c.ink : c.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
        elevation: 10,
      };
  const textColor = isDisabled ? c.inkMute : c.bg;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className="w-full flex-row items-center justify-center rounded-full py-4 px-5 active:opacity-90"
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={isDisabled ? undefined : '#FFFFFF'} />
      ) : (
        <>
          <Text
            className="font-bodyBold text-[15px]"
            style={{ color: textColor }}
          >
            {label}
          </Text>
          {trailing ? (
            <Text
              className="font-bodyBold text-[15px] ml-2"
              style={{ color: textColor }}
            >
              {trailing}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

