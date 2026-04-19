import { ActivityIndicator, Pressable, Text } from 'react-native';

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

const FILL: Record<Variant, string> = {
  ink: 'bg-ink',
  primary: 'bg-primary',
};

export function AuthBigBtn({
  label,
  onPress,
  disabled,
  loading,
  trailing = '→',
  variant = 'ink',
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`w-full flex-row items-center justify-center rounded-full py-4 px-5 ${
        isDisabled
          ? 'bg-surface'
          : `${FILL[variant]} shadow-lg active:opacity-90`
      }`}
    >
      {loading ? (
        <ActivityIndicator color={isDisabled ? undefined : '#FFFFFF'} />
      ) : (
        <>
          <Text
            className={`font-bodyBold text-[15px] ${isDisabled ? 'text-ink-mute' : 'text-bg'}`}
          >
            {label}
          </Text>
          {trailing ? (
            <Text
              className={`font-bodyBold text-[15px] ml-2 ${
                isDisabled ? 'text-ink-mute' : 'text-bg'
              }`}
            >
              {trailing}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

