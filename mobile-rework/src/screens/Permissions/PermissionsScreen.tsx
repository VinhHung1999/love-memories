import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePermissionsViewModel, type CardStatus } from './usePermissionsViewModel';

// Ports `PermissionsScreen` from docs/design/prototype/memoura-v2/pairing.jsx:373.
// Spec deviations (PO-confirmed):
//   - 2 cards only (notif + photos) — location dropped because Map/FoodSpots
//     is out of rework scope.
//   - Per-card Allow/Skip buttons replace prototype's pre-set toggles.
//     "Soft-ask" per Boss = each card is an explicit choice.

type CardKey = 'notif' | 'photos';

export function PermissionsScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { status, onAllow, onSkip, onContinue } = usePermissionsViewModel();

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[240px]">
        <LinearGradient
          colors={[c.accentSoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <ScreenHeader
          showBack
          title={t('onboarding.permissions.title')}
          subtitle={t('onboarding.permissions.subtitle')}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-3">
            <PermissionCard
              cardKey="notif"
              status={status}
              onAllow={onAllow}
              onSkip={onSkip}
              icon={t('onboarding.permissions.notif.icon')}
              title={t('onboarding.permissions.notif.title')}
              body={t('onboarding.permissions.notif.body')}
              allowLabel={t('onboarding.permissions.allow')}
              skipLabel={t('onboarding.permissions.skip')}
              grantedLabel={t('onboarding.permissions.granted')}
              deniedLabel={t('onboarding.permissions.denied')}
            />
            <PermissionCard
              cardKey="photos"
              status={status}
              onAllow={onAllow}
              onSkip={onSkip}
              icon={t('onboarding.permissions.photos.icon')}
              title={t('onboarding.permissions.photos.title')}
              body={t('onboarding.permissions.photos.body')}
              allowLabel={t('onboarding.permissions.allow')}
              skipLabel={t('onboarding.permissions.skip')}
              grantedLabel={t('onboarding.permissions.granted')}
              deniedLabel={t('onboarding.permissions.denied')}
            />
          </View>

          <View className="px-5 pt-6 pb-10">
            <AuthBigBtn
              label={t('onboarding.permissions.cta')}
              onPress={onContinue}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type CardProps = {
  cardKey: CardKey;
  status: CardStatus;
  onAllow: (k: CardKey) => void;
  onSkip: (k: CardKey) => void;
  icon: string;
  title: string;
  body: string;
  allowLabel: string;
  skipLabel: string;
  grantedLabel: string;
  deniedLabel: string;
};

function PermissionCard({
  cardKey,
  status,
  onAllow,
  onSkip,
  icon,
  title,
  body,
  allowLabel,
  skipLabel,
  grantedLabel,
  deniedLabel,
}: CardProps) {
  const state = status[cardKey];
  const granted = state === 'granted';
  const denied = state === 'denied';
  const requesting = state === 'requesting';
  const decided = granted || denied;

  return (
    <View
      className={`mb-2.5 rounded-[18px] border-[1.5px] bg-surface px-4 py-4 ${
        granted ? 'border-primary' : 'border-line'
      }`}
    >
      <View className="flex-row items-start gap-3.5">
        <View
          className={`w-11 h-11 rounded-2xl items-center justify-center ${
            granted ? 'bg-primary/15' : 'bg-surface-alt'
          }`}
        >
          <Text className="text-[22px]">{icon}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-bodyBold text-ink text-[14.5px] leading-[18px]">{title}</Text>
          <Text className="mt-1 font-body text-ink-mute text-[12.5px] leading-[18px]">
            {body}
          </Text>
        </View>
      </View>

      <View className="mt-3.5 flex-row items-center gap-2">
        {decided ? (
          <View
            className={`flex-1 items-center justify-center rounded-full py-2.5 ${
              granted ? 'bg-primary/15' : 'bg-surface-alt'
            }`}
          >
            <Text
              className={`font-bodySemibold text-[13px] ${
                granted ? 'text-primary' : 'text-ink-mute'
              }`}
            >
              {granted ? grantedLabel : deniedLabel}
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => onSkip(cardKey)}
              disabled={requesting}
              accessibilityRole="button"
              className="flex-1 items-center justify-center rounded-full bg-surface-alt py-2.5 active:opacity-90"
            >
              <Text className="font-bodySemibold text-ink-soft text-[13px]">{skipLabel}</Text>
            </Pressable>
            <Pressable
              onPress={() => onAllow(cardKey)}
              disabled={requesting}
              accessibilityRole="button"
              accessibilityState={{ busy: requesting }}
              className="flex-1 items-center justify-center rounded-full bg-ink py-2.5 active:opacity-90"
            >
              {requesting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bodySemibold text-bg text-[13px]">{allowLabel}</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
