import { ActivityIndicator, Pressable, Text } from 'react-native';

// Ports `AuthBigBtn` from docs/design/prototype/memoura-v2/auth.jsx:42.
// Full-width pill CTA. Dark ink bg when enabled, soft surface when disabled.

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  trailing?: string;
};

export function AuthBigBtn({ label, onPress, disabled, loading, trailing = '→' }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`w-full flex-row items-center justify-center rounded-full py-4 px-5 ${
        isDisabled
          ? 'bg-surface'
          : 'bg-ink shadow-lg active:opacity-90'
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

