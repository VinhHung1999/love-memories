import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient, ScreenBackBtn } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePairChoiceViewModel } from './usePairChoiceViewModel';

type PairAccent = 'primary' | 'accent';

// Ports `PairChoiceScreen` from docs/design/prototype/memoura-v2/pairing.jsx:5.
// Soft top wash (primarySoft → bg) + paired-hearts visual + 2 PairOption cards
// + dashed lock note. "Để sau" trailing chip is rendered visibly disabled per
// Boss decision (pairing required for MVP — see docs/specs/sprint-60-pairing.md).

export function PairChoiceScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { creating, error, onCreate, onJoin } = usePairChoiceViewModel();

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[260px]">
        <LinearGradient
          colors={[c.primarySoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="px-2 pt-2 flex-row items-center justify-between">
          <ScreenBackBtn />
          <View className="px-3.5 py-2 rounded-full bg-surface border border-line opacity-50">
            <Text className="font-bodySemibold text-ink-soft text-xs">
              {t('onboarding.pairing.choice.skip')}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-3">
            <Text className="font-displayMediumItalic text-ink text-[28px] leading-[32px]">
              {t('onboarding.pairing.choice.title')}
            </Text>
            <Text className="mt-1.5 font-body text-ink-mute text-[13px]">
              {t('onboarding.pairing.choice.subtitle')}
            </Text>
          </View>

          <PairedHearts />

          <View className="px-5 pt-4 pb-10">
            <PairOption
              accent="primary"
              icon={t('onboarding.pairing.choice.create.icon')}
              title={t('onboarding.pairing.choice.create.title')}
              subtitle={t('onboarding.pairing.choice.create.subtitle')}
              loading={creating}
              onPress={onCreate}
            />
            <PairOption
              accent="accent"
              icon={t('onboarding.pairing.choice.join.icon')}
              title={t('onboarding.pairing.choice.join.title')}
              subtitle={t('onboarding.pairing.choice.join.subtitle')}
              disabled={creating}
              onPress={onJoin}
            />

            {error ? (
              <Text className="mt-4 font-body text-primary-deep text-[13px] text-center">
                {t('onboarding.pairing.errors.network')}
              </Text>
            ) : null}

            <View className="mt-7 flex-row items-center gap-2.5 rounded-2xl border border-line border-dashed bg-surface-alt px-4 py-3.5">
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

// L + ? circles overlapping with a 💞 between — quick port of pairing.jsx:31.
// Uses NativeWind colors for the gradient avatars instead of the prototype's
// inline gradient (LinearGradient circles add native cost we don't need here).
function PairedHearts() {
  return (
    <View className="px-6 pt-6">
      <View className="self-center w-[180px] h-[130px] relative">
        <View className="absolute left-2.5 top-5 w-20 h-20 rounded-full bg-primary border-[3px] border-bg shadow-lg items-center justify-center">
          <Text className="font-displayBold text-white text-[32px]">L</Text>
        </View>
        <View className="absolute right-2.5 top-[30px] w-20 h-20 rounded-full bg-accent border-[3px] border-bg shadow-lg items-center justify-center">
          <Text className="font-displayBold text-white text-[32px]">?</Text>
        </View>
        <Text className="absolute left-1/2 top-[55px] -translate-x-1/2 text-2xl">💞</Text>
      </View>
    </View>
  );
}

type OptionProps = {
  accent: PairAccent;
  icon: string;
  title: string;
  subtitle: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const ICON_BG: Record<PairAccent, string> = {
  primary: 'bg-primary/15',
  accent: 'bg-accent/15',
};
const ICON_FG: Record<PairAccent, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
};

function PairOption({ accent, icon, title, subtitle, loading, disabled, onPress }: OptionProps) {
  const dim = !!disabled || !!loading;
  return (
    <Pressable
      onPress={dim ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: dim, busy: loading }}
      className={`flex-row items-center gap-3.5 rounded-[20px] border border-line bg-surface px-4 py-[18px] mb-2.5 shadow-sm ${
        dim ? 'opacity-60' : 'active:opacity-90'
      }`}
    >
      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${ICON_BG[accent]}`}>
        <Text className={`text-[22px] ${ICON_FG[accent]}`}>{icon}</Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-displayMedium text-ink text-[18px] leading-[21px]">{title}</Text>
        <Text className="mt-1 font-body text-ink-mute text-[12.5px] leading-[18px]">
          {subtitle}
        </Text>
      </View>
      <Text className="font-bodyMedium text-ink-mute text-lg">→</Text>
    </Pressable>
  );
}
