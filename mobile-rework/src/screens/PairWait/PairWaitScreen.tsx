import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 68 T466 stub — placeholder so the CoupleForm CommonActions.reset
// target resolves. T467 will replace this with the real Wait UI (gradient
// hero, code pill, polling, push listener, notif-perm prompt). Keep this
// file as a no-back, no-skip surface so swipe behaviour matches the final
// Wait screen — anything tighter is up to T467.
export function PairWaitScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute inset-0">
        <LinearGradient
          colors={[c.primarySoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 items-center justify-center px-8">
        <ActivityIndicator size="large" color={c.primary} />
        <Text className="font-displayBold text-ink text-2xl mt-6 text-center">
          {t('onboarding.pairWait.title')}
        </Text>
        <Text className="font-body text-ink-soft text-base mt-3 text-center">
          {t('onboarding.pairWait.body')}
        </Text>
      </SafeAreaView>
    </View>
  );
}
