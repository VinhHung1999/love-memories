import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient, ScreenBackBtn } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePairInviteViewModel } from './usePairInviteViewModel';

// Ports `PairInviteScreen` from docs/design/prototype/memoura-v2/pairing.jsx:116.
// The prototype has a hard-coded 24h expiry note + 3-button share row + manual
// "Đã gửi rồi" CTA. Spec changes (docs/specs/sprint-60-pairing.md):
//   - codes don't expire server-side (no expiry text)
//   - single "Chia sẻ" button + "Lấy mã mới?" link
//   - auto-advance on partner-join via 3s polling (no manual continue)

export function PairInviteScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const {
    code,
    formattedCode,
    qrPayload,
    rotating,
    error,
    onRotate,
    onShare,
  } = usePairInviteViewModel();

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
        <View className="px-2 pt-2">
          <ScreenBackBtn />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-3">
            <Text className="font-displayMediumItalic text-ink text-[28px] leading-[32px]">
              {t('onboarding.pairing.invite.title')}
            </Text>
            <Text className="mt-1.5 font-body text-ink-mute text-[13px]">
              {t('onboarding.pairing.invite.subtitle')}
            </Text>
          </View>

          <View className="px-5 pt-7 pb-10">
            <View className="rounded-[28px] border border-line bg-bg-elev px-5 py-8 shadow-lg items-center">
              <Text className="font-displayItalic uppercase text-primary-deep text-[11px] tracking-[2px] mb-3">
                {t('onboarding.pairing.invite.codeLabel')}
              </Text>
              {code ? (
                <Text className="font-displayBold text-ink text-[48px] leading-[48px] tracking-[3px]">
                  {formattedCode}
                </Text>
              ) : (
                <View className="h-[48px] justify-center">
                  <ActivityIndicator />
                </View>
              )}

              <View className="mt-6 rounded-2xl bg-bg p-3">
                {qrPayload ? (
                  <QRCode
                    value={qrPayload}
                    size={192}
                    color={c.ink}
                    backgroundColor={c.bg}
                    quietZone={8}
                    ecl="M"
                  />
                ) : (
                  <View className="w-[208px] h-[208px] items-center justify-center">
                    <ActivityIndicator />
                  </View>
                )}
              </View>
            </View>

            <View className="mt-5">
              <Pressable
                onPress={code ? onShare : undefined}
                accessibilityRole="button"
                disabled={!code}
                className={`w-full flex-row items-center justify-center rounded-full py-4 px-5 ${
                  code ? 'bg-ink shadow-lg active:opacity-90' : 'bg-surface'
                }`}
              >
                <Text className={`font-bodyBold text-[15px] ${code ? 'text-bg' : 'text-ink-mute'}`}>
                  {t('onboarding.pairing.invite.shareCta')}
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 items-center">
              <Pressable
                onPress={code ? onRotate : undefined}
                accessibilityRole="button"
                disabled={!code || rotating}
                hitSlop={8}
                className="py-2"
              >
                <Text className="font-bodyMedium text-primary-deep text-[13px] underline">
                  {rotating
                    ? t('onboarding.pairing.invite.rotating')
                    : t('onboarding.pairing.invite.rotateCta')}
                </Text>
              </Pressable>
            </View>

            {error ? (
              <Text className="mt-3 font-body text-primary-deep text-[13px] text-center">
                {t('onboarding.pairing.errors.network')}
              </Text>
            ) : null}

            <View className="mt-7 items-center">
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={c.inkMute} />
                <Text className="font-bodyMedium text-ink-soft text-[13px]">
                  {t('onboarding.pairing.invite.waitingTitle')}
                </Text>
              </View>
              <Text className="mt-1.5 font-body text-ink-mute text-[12px] text-center px-6 leading-[18px]">
                {t('onboarding.pairing.invite.waitingSubtitle')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
