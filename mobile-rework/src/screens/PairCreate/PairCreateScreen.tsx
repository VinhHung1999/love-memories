import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { usePairCreateViewModel } from './usePairCreateViewModel';

type PairAccent = 'primary' | 'accent';

// Sprint 68 T470 — PairChoice. Two cards, single decision: Create vs Join.
// Sprint 60's invite-state UI (existing code + QR + Share + Regenerate) is
// gone — couple creation flow runs through T466 CoupleForm now. The screen
// stays on the route name `pair-create` to avoid breaking deep-links and
// gate redirects; the React component is conceptually PairChoice.

export function PairCreateScreen() {
  const { t } = useTranslation();
  const userName = useAuthStore((s) => s.user?.name ?? null);
  const { onCreate, onJoin } = usePairCreateViewModel();
  const initial = (userName?.trim()?.charAt(0) ?? 'L').toUpperCase();

  return (
    <View className="flex-1 bg-bg">
      <TopWash />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* T294 carry-over: no back. Once the user has typed in their
            profile and reached the chooser, popping back to Personalize
            is allowed via the navigator gesture (T470 push, not reset),
            so the header itself doesn't surface a back button. */}
        <ScreenHeader
          title={t('onboarding.pairing.choice.title')}
          subtitle={t('onboarding.pairing.choice.subtitle')}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PairedHeartsComposite initial={initial} />

          <View className="px-5 pt-4 pb-10">
            <PairOption
              accent="primary"
              icon="✉"
              title={t('onboarding.pairing.choice.create.title')}
              subtitle={t('onboarding.pairing.choice.create.subtitle')}
              onPress={onCreate}
            />
            <PairOption
              accent="accent"
              icon="⚘"
              title={t('onboarding.pairing.choice.join.title')}
              subtitle={t('onboarding.pairing.choice.join.subtitle')}
              onPress={onJoin}
            />

            <View className="mt-7 flex-row items-center gap-2.5 rounded-2xl border border-line-on-surface border-dashed bg-surface-alt px-4 py-3.5">
              <Text className="text-lg">🔒</Text>
              <Text className="flex-1 font-body text-ink-soft text-[12.5px] leading-[18px]">
                {t('onboarding.pairing.choice.lockNote')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TopWash() {
  const c = useAppColors();
  return (
    <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[260px]">
      <LinearGradient
        colors={[c.primarySoft, c.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="absolute inset-0"
      />
    </View>
  );
}

// Sprint 68 D2 (Boss build 131 feedback) — paired-hearts letter composite,
// 1:1 with prototype `pairing.jsx` L31-54. Two 80px circles with gradient
// fills + white display-bold initial / "?" + a 💞 sticker centered between
// them. Replaces the two flat lucide hearts.
function PairedHeartsComposite({ initial }: { initial: string }) {
  const c = useAppColors();
  return (
    <View className="items-center pt-3">
      <View className="w-[180px] h-[130px]">
        <View
          pointerEvents="none"
          className="absolute left-[10px] top-[20px] w-20 h-20 rounded-full overflow-hidden border-[3px] border-bg shadow-hero"
        >
          <LinearGradient
            colors={[c.primary, c.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          <View className="flex-1 items-center justify-center">
            <Text className="font-displayBold text-white text-[32px]">{initial}</Text>
          </View>
        </View>
        <View
          pointerEvents="none"
          className="absolute right-[10px] top-[30px] w-20 h-20 rounded-full overflow-hidden border-[3px] border-bg shadow-hero"
        >
          <LinearGradient
            colors={[c.accent, c.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          <View className="flex-1 items-center justify-center">
            <Text className="font-displayBold text-white text-[32px]">?</Text>
          </View>
        </View>
        {/* Centered 💞 — translateX -50% via -ml-3 (text glyph ≈ 24px wide
            so half-width ≈ 12px, expressed as ml-[-12px]). */}
        <View
          pointerEvents="none"
          className="absolute left-[90px] top-[55px] z-10 ml-[-12px]"
        >
          <Text className="text-2xl">💞</Text>
        </View>
      </View>
    </View>
  );
}

type PairOptionProps = {
  accent: PairAccent;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

// Sprint 68 D2 — emoji glyph icons (✉ / ⚘) replace the lucide Heart / Users.
// Tint background stays from the existing palette (primary / accent /22).
function PairOption({ accent, icon, title, subtitle, onPress }: PairOptionProps) {
  const c = useAppColors();
  const tint = accent === 'primary' ? c.primary : c.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      className="mt-3 flex-row items-center bg-surface rounded-2xl px-4 py-4 border border-line-on-surface active:opacity-90 shadow-chip"
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center mr-3.5"
        style={{ backgroundColor: tint + '22' }}
      >
        <Text className="text-[22px]">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-bodyBold text-ink text-[15px]">{title}</Text>
        <Text className="font-body text-ink-soft text-[13px] mt-0.5">{subtitle}</Text>
      </View>
      <Text className="font-body text-ink-mute text-[18px] ml-2">›</Text>
    </Pressable>
  );
}
