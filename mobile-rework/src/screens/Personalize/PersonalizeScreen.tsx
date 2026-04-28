import { useRouter } from 'expo-router';
import { Camera, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, AuthField, LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import {
  COLOR_KEYS,
  type ColorKey,
  usePersonalizeViewModel,
} from './usePersonalizeViewModel';

// Sprint 68 T465 — user-level Personalize. Drops partner-name + start-date
// (moved to T466 CoupleForm). Live preview now shows a single-user identity
// (nick + color avatar), not the couple-level "{nick} & {partner}" pairing
// preview. Color values are token keys per Lu's Q3 nudge — visual stays
// gradient pairs from the active palette.

// Map each color token key to a [from, to] gradient pair using runtime theme
// colors. Reuses the same prototype mapping (pairing.jsx L278-283) but reads
// from `useAppColors()` so the swatches respect dark mode + custom palettes.
type GradientResolver = (
  c: ReturnType<typeof useAppColors>,
) => Record<ColorKey, [string, string]>;

const gradientFor: GradientResolver = (c) => ({
  primary: [c.primary, c.secondary],
  accent: [c.accent, c.primary],
  secondary: [c.secondary, c.accent],
  primaryDeep: [c.primaryDeep, c.primary],
});

export function PersonalizeScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const {
    nick,
    setNick,
    color,
    setColor,
    submitting,
    canSubmit,
    formError,
    avatarLocalUri,
    avatarUploading,
    onPickAvatar,
    onSubmit,
  } = usePersonalizeViewModel();

  const previewName = nick.trim() || t('onboarding.personalize.previewPlaceholder');
  const initial = previewName.charAt(0).toUpperCase();
  const gradients = gradientFor(c);
  const [from, to] = gradients[color];

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[260px]">
        <LinearGradient
          colors={[c.secondarySoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <ScreenHeader
          title={t('onboarding.personalize.title')}
          subtitle={t('onboarding.personalize.subtitle')}
          showBack
          onBack={() => router.back()}
        />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-6 pt-1 pb-1">
              <LivePreviewPill
                uri={avatarLocalUri}
                initial={initial}
                previewName={previewName}
                from={from}
                to={to}
                uploading={avatarUploading}
                disabled={submitting}
                onPickAvatar={onPickAvatar}
                greeting={t('onboarding.personalize.previewGreeting')}
              />
            </View>

            <View className="px-5 pt-7">
              <AuthField
                label={t('onboarding.personalize.nickLabel')}
                placeholder={t('onboarding.personalize.nickPlaceholder')}
                value={nick}
                onChangeText={setNick}
                icon={t('onboarding.personalize.nickIcon')}
                editable={!submitting}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
              />

              <View className="mb-3.5">
                <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
                  {t('onboarding.personalize.colorLabel')}
                </Text>
                <View className="flex-row gap-2.5">
                  {COLOR_KEYS.map((key) => (
                    <ColorSwatch
                      key={key}
                      from={gradients[key][0]}
                      to={gradients[key][1]}
                      selected={color === key}
                      onPress={() => setColor(key)}
                      disabled={submitting}
                    />
                  ))}
                </View>
              </View>

              {formError ? (
                <Text className="mt-2 font-body text-primary-deep text-[13px] text-center">
                  {t(`onboarding.personalize.errors.${formError.kind}`)}
                </Text>
              ) : null}
            </View>

            <View className="px-5 pt-6 pb-10">
              <AuthBigBtn
                label={
                  submitting
                    ? t('onboarding.personalize.saving')
                    : t('onboarding.personalize.cta')
                }
                trailing={submitting ? '' : '→'}
                onPress={onSubmit}
                disabled={!canSubmit}
                loading={submitting}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Sprint 68 D1 (Boss build 131 feedback) — Personalize live preview pill,
// 1:1 with prototype `pairing.jsx` L300-324. Replaces the standalone 112px
// AvatarPicker with a horizontal pill: avatar (46px) + nick + Dancing Script
// greeting. The avatar is the only pressable area — taps fire the image
// picker. Background gradient uses the same color pair as the swatch (alpha
// 0x22 ≈ 13.4%).
function LivePreviewPill({
  uri,
  initial,
  previewName,
  from,
  to,
  uploading,
  disabled,
  onPickAvatar,
  greeting,
}: {
  uri: string | null;
  initial: string;
  previewName: string;
  from: string;
  to: string;
  uploading: boolean;
  disabled?: boolean;
  onPickAvatar: () => void;
  greeting: string;
}) {
  return (
    <View
      className="rounded-[22px] border border-line flex-row items-center px-5 py-4 overflow-hidden"
    >
      {/* Soft gradient wash — alpha 0x22 on both stops mirrors prototype
          `${color[0]}22, ${color[1]}22`. Sits absolutely behind the row so
          children render in their natural place. */}
      <View pointerEvents="none" className="absolute inset-0">
        <LinearGradient
          colors={[`${from}22`, `${to}22`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <Pressable
        onPress={disabled ? undefined : onPickAvatar}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled, busy: uploading }}
        accessibilityLabel={greeting}
        hitSlop={8}
        disabled={disabled}
        className="w-[46px] h-[46px] rounded-full overflow-hidden border-2 border-bg shadow-hero active:opacity-90"
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        {uri ? (
          <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <>
            <LinearGradient
              colors={[from, to]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0"
            />
            <View className="flex-1 items-center justify-center">
              <Text className="font-displayBold text-white text-[20px]">{initial}</Text>
            </View>
          </>
        )}
        {uploading ? (
          <View className="absolute inset-0 items-center justify-center bg-black/35">
            <ActivityIndicator color="#FFFFFF" size="small" />
          </View>
        ) : null}
      </Pressable>

      <View className="flex-1 ml-3.5">
        <Text
          className="font-displayItalic text-ink text-[18px] leading-[20px]"
          numberOfLines={1}
        >
          {previewName}
        </Text>
        <Text className="font-script text-ink-soft text-[16px] mt-1">{greeting}</Text>
      </View>

      {uri && !uploading ? (
        <Pressable
          onPress={disabled ? undefined : onPickAvatar}
          accessibilityRole="button"
          hitSlop={8}
          disabled={disabled}
          className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-chip border-2 border-bg ml-2 active:opacity-80"
        >
          <Camera size={16} color="#1A1A1A" strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ColorSwatch({
  from,
  to,
  selected,
  onPress,
  disabled,
}: {
  from: string;
  to: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      hitSlop={6}
      className={`w-14 h-14 rounded-full overflow-hidden items-center justify-center ${
        selected ? 'border-[3px] border-ink' : 'border border-line'
      } shadow-chip`}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {selected ? <Check size={22} strokeWidth={2.5} color="#FFFFFF" /> : null}
    </Pressable>
  );
}
