import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

// Real OAuth row — replaces the SocialRowStub used in T282. Wires Apple
// (iOS only) + Google to the parent VM via callbacks. Phone is intentionally
// a "Coming soon" placeholder — flagged for Sprint 65. On Android, Google is
// also "coming soon" (real Android wiring also Sprint 65).
//
// Loading state is per-button: the parent passes `loading: 'apple' | 'google'
// | null` so taps on the active button are absorbed and the row dims.

export type SocialKind = 'apple' | 'google';

type Props = {
  loading: SocialKind | null;
  onApple?: () => void | Promise<void>;
  onGoogle?: () => void | Promise<void>;
};

export function SocialRow({ loading, onApple, onGoogle }: Props) {
  const { t } = useTranslation();
  const disabled = loading !== null;

  const showAppleReal = Platform.OS === 'ios';
  const showGoogleReal = Platform.OS === 'ios';

  const showComingSoon = () => {
    Alert.alert(
      t('onboarding.auth.comingSoon.title'),
      t('onboarding.auth.comingSoon.body'),
      [{ text: t('onboarding.auth.comingSoon.ok'), style: 'default' }],
    );
  };

  const items: {
    key: SocialKind | 'phone';
    label: string;
    icon: string;
    classes: string;
    textClass: string;
    onPress: () => void | Promise<void>;
    visible: boolean;
  }[] = [
    {
      key: 'apple',
      label: t('onboarding.auth.signup.socialApple'),
      icon: '\uF8FF',
      classes: 'bg-ink',
      textClass: 'text-bg',
      onPress: showAppleReal && onApple ? onApple : showComingSoon,
      visible: showAppleReal,
    },
    {
      key: 'google',
      label: t('onboarding.auth.signup.socialGoogle'),
      icon: 'G',
      classes: 'bg-bg-elev border border-line-on-surface',
      textClass: 'text-ink',
      onPress: showGoogleReal && onGoogle ? onGoogle : showComingSoon,
      visible: true,
    },
    {
      key: 'phone',
      label: t('onboarding.auth.signup.socialPhone'),
      icon: '\u260E',
      classes: 'bg-surface border border-line-on-surface',
      textClass: 'text-ink',
      onPress: showComingSoon,
      visible: true,
    },
  ];

  const visibleItems = items.filter((it) => it.visible);

  return (
    <View className={`flex-row gap-2 ${disabled ? 'opacity-50' : ''}`}>
      {visibleItems.map((it) => {
        const isLoading = loading === it.key;
        return (
          <Pressable
            key={it.key}
            onPress={it.onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={it.label}
            className={`flex-1 flex-row items-center justify-center py-3.5 rounded-2xl ${it.classes}`}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={it.textClass === 'text-bg' ? '#FFFFFF' : '#000000'}
              />
            ) : (
              <>
                <Text
                  className={`font-bodyBold text-[15px] mr-2 ${it.textClass}`}
                >
                  {it.icon}
                </Text>
                <Text className={`font-bodyBold text-sm ${it.textClass}`}>
                  {it.label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
