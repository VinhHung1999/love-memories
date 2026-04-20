import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

// T292 (bug #4): renders only when a Universal Link / deep-link arrived
// pre-auth and stashed an invite code in authStore.pendingPairCode. Without
// this banner, a user tapping a share link lands on bare Login/SignUp with
// zero context that they're mid-pair-flow. After they auth, the gate routes
// to /(auth)/pair-create which consumes the code and replaces into pair-join
// (see usePairCreateViewModel.ts:85-90 — same consume path for both Login
// and SignUp callers).

function formatHexCode(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 8) return upper;
  return `${upper.slice(0, 4)} ${upper.slice(4)}`;
}

export function PendingPairBanner() {
  const { t } = useTranslation();
  const code = useAuthStore((s) => s.pendingPairCode);
  if (!code) return null;
  return (
    <View className="mb-5 flex-row items-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
      <Text className="text-base">💞</Text>
      <Text className="flex-1 font-body text-ink-soft text-[12.5px] leading-[18px]">
        {t('onboarding.auth.pendingPair.banner', { code: formatHexCode(code) })}
      </Text>
    </View>
  );
}
