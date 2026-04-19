import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { useAppColors } from '@/theme/ThemeProvider';
import { useOnboardingDoneViewModel } from './useOnboardingDoneViewModel';

// Ports `OnboardingDoneScreen` from docs/design/prototype/memoura-v2/pairing.jsx:456.
// Full-bleed 165° hero gradient (heroA → heroB → heroC), Fraunces title,
// white pill CTA at bottom. Back gesture is disabled at the Stack level
// (app/(auth)/_layout.tsx) so the user can only move forward into (tabs).
//
// T316: joiner path now hydrates inviter name via authStore.pendingPartner
// (set on /validate-invite during PairJoin). Creator path leaves it null —
// the partner hasn't joined yet — so the "người ấy" fallback still applies.

export function OnboardingDoneScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { selfName, entering, onEnter } = useOnboardingDoneViewModel();
  const pendingPartner = useAuthStore((s) => s.pendingPartner);

  const self = (selfName ?? '').trim() || t('onboarding.done.titleSelfFallback');
  const partner =
    pendingPartner?.name?.trim() || t('onboarding.done.titlePartnerFallback');
  const names = `${self} & ${partner}`;

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-1 px-7 justify-end pb-32">
          <Text className="font-displayItalic text-white/85 text-[13px] uppercase tracking-[2.4px] mb-4">
            {t('onboarding.done.eyebrow')}
          </Text>
          <Text
            className="font-displayMedium text-white text-[48px] leading-[52px]"
            style={{ textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 24 }}
          >
            {t('onboarding.done.title', { names })}
          </Text>
          <Text className="mt-5 font-body text-white/85 text-[15px] leading-[22px] max-w-[320px]">
            {t('onboarding.done.body')}
          </Text>
        </View>

        <View className="px-7 pb-10">
          <Pressable
            onPress={entering ? undefined : onEnter}
            accessibilityRole="button"
            accessibilityState={{ busy: entering }}
            className="w-full flex-row items-center justify-center rounded-full bg-white py-4 px-5 shadow-hero active:opacity-90"
          >
            {entering ? (
              <ActivityIndicator color={c.ink} />
            ) : (
              <>
                <Text className="font-bodyBold text-ink text-[15px]">
                  {t('onboarding.done.cta')}
                </Text>
                <Text className="font-bodyBold text-ink text-[15px] ml-2">→</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
