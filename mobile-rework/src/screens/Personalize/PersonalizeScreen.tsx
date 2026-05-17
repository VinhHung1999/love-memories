import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AuthBigBtn, AuthField, LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import {
  COLOR_KEYS,
  type ColorKey,
  usePersonalizeViewModel,
} from './usePersonalizeViewModel';

// Sprint 68 D1prime — Personalize 1:1 with prototype `pairing.jsx` L968-1100.
// Big 128×128 rounded-36 gradient tile (NOT circle) with white initial,
// camera badge bottom-right for "upload photo later", nick rendered under
// the tile, then AuthField, then 6-swatch grid. Each swatch carries a
// radial wash overlay (white/0.5 → transparent at 60%, ellipse at 28% 22%)
// so the gradient reads as soft 3D rather than flat fill.

type GradientResolver = (
  c: ReturnType<typeof useAppColors>,
) => Record<ColorKey, [string, string]>;

const gradientFor: GradientResolver = (c) => ({
  primary: [c.primary, c.secondary],
  accent: [c.accent, c.primary],
  secondary: [c.secondary, c.accent],
  primaryDeep: [c.primaryDeep, c.primary],
  // Sprint 68 D1prime — additions matching prototype L975-981.
  sunset: [c.heroA, c.heroC],
  mint: ['#7EC8B5', c.accent],
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
    avatarUploading,
    onPickAvatar,
    onSubmit,
  } = usePersonalizeViewModel();

  const previewName = nick.trim() || t('onboarding.personalize.previewPlaceholder');
  const initial = previewName.charAt(0).toUpperCase();
  const gradients = gradientFor(c);
  const [from, to] = gradients[color];
  const swatchLabel = t(`onboarding.personalize.colorNames.${color}`);
  // BUG-2: surface the persisted avatar URL (set after successful upload)
  // so the big tile swaps gradient + initial → photo. Reads from authStore
  // so a freshly uploaded picker URI shows up immediately.
  const avatarUrl = useAuthStore((s) => s.user?.avatarUrl ?? null);

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[280px]">
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

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BigAvatarPreview
            initial={initial}
            from={from}
            to={to}
            avatarUrl={avatarUrl}
            uploading={avatarUploading}
            disabled={submitting}
            onCameraPress={onPickAvatar}
          />

          <View className="items-center mt-2.5 min-h-7">
            <Text
              className={`font-displayItalic text-[22px] leading-[24px] ${
                nick.trim() ? 'text-ink' : 'text-ink-mute'
              }`}
            >
              {previewName}
            </Text>
          </View>

          <View className="px-5 pt-6">
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
              maxLength={60}
            />

            <View className="mt-1">
              <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[0.96px] mb-2.5 pl-1">
                {t('onboarding.personalize.colorLabel')}
              </Text>
              <View className="flex-row gap-2">
                {COLOR_KEYS.map((key) => (
                  <View key={key} className="flex-1">
                    <ColorSwatch
                      from={gradients[key][0]}
                      to={gradients[key][1]}
                      selected={color === key}
                      disabled={submitting}
                      onPress={() => setColor(key)}
                    />
                  </View>
                ))}
              </View>
              <Text className="mt-2 font-script text-ink-mute text-center text-[16px]">
                {swatchLabel}
              </Text>
            </View>

            {formError ? (
              <Text className="mt-3 font-body text-primary-deep text-[13px] text-center">
                {t(`onboarding.personalize.errors.${formError.kind}`)}
              </Text>
            ) : null}

            <View className="mt-7 pb-10">
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// 128×128 rounded-36 (not circle) avatar tile. Renders the uploaded photo
// when `avatarUrl` is set; otherwise gradient + initial. Radial wash sits
// inside the tile so the highlight stays clipped by the rounded corners.
function BigAvatarPreview({
  initial,
  from,
  to,
  avatarUrl,
  uploading,
  disabled,
  onCameraPress,
}: {
  initial: string;
  from: string;
  to: string;
  avatarUrl: string | null;
  uploading: boolean;
  disabled?: boolean;
  onCameraPress: () => void;
}) {
  const c = useAppColors();
  return (
    <View className="items-center pt-5 pb-1.5">
      <View className="w-[128px] h-[128px]">
        <Pressable
          onPress={disabled ? undefined : onCameraPress}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled, busy: uploading }}
          disabled={disabled}
          className="w-[128px] h-[128px] rounded-[36px] overflow-hidden border-4 border-bg shadow-hero active:opacity-90"
          style={{ opacity: disabled ? 0.7 : 1 }}
        >
          {avatarUrl ? (
            // BUG-2: render the uploaded photo when present so the picker
            // result shows up immediately. Photo wins over gradient since
            // the user explicitly chose it.
            <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <>
              <LinearGradient
                colors={[from, to]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              <Svg
                pointerEvents="none"
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <Defs>
                  <RadialGradient id="avatarWash" cx="0.28" cy="0.22" rx="0.60" ry="0.60" fx="0.28" fy="0.22">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
                    <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#avatarWash)" />
              </Svg>
              <View className="flex-1 items-center justify-center">
                <Text
                  className="font-displayBold text-white text-[64px]"
                  style={{ letterSpacing: -0.04 * 64 }}
                >
                  {initial}
                </Text>
              </View>
            </>
          )}
          {uploading ? (
            <View className="absolute inset-0 items-center justify-center bg-black/35">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={disabled ? undefined : onCameraPress}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled, busy: uploading }}
          hitSlop={8}
          disabled={disabled}
          className="absolute -right-1 -bottom-1 w-9 h-9 rounded-full items-center justify-center bg-white border-[1.5px] border-line shadow-chip active:opacity-80"
        >
          {uploading ? (
            <ActivityIndicator size="small" color={c.inkSoft} />
          ) : (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 5l1.5-2h3L15 5h4a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4z"
                stroke={c.inkSoft}
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              <Circle cx={12} cy={13} r={3.5} stroke={c.inkSoft} strokeWidth={1.8} />
            </Svg>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// Avatar-style swatch. Aspect-square per grid column, rounded-16, gradient
// + radial wash. BUG-1: unselected swatches drop the border entirely
// (prototype L1062-1063 uses a soft drop shadow only, not a border).
// Selected = wrapper-padded double-ring (2px bg gap then 2.5px ink) + the
// same drop shadow. Selected check is now a lucide Check inside a 14×14
// white circle so it reads as system-grade rather than a plain "✓" glyph.
function ColorSwatch({
  from,
  to,
  selected,
  disabled,
  onPress,
}: {
  from: string;
  to: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const c = useAppColors();
  return (
    <View
      className="aspect-square rounded-2xl"
      style={{
        opacity: disabled ? 0.7 : 1,
        // Outer ring: ink border on selected, transparent on unselected.
        // Wrapper exists so the inner gradient tile retains its full
        // 1×1 aspect ratio and rounded corners regardless of state.
        padding: selected ? 2 : 0,
        backgroundColor: selected ? c.ink : 'transparent',
      }}
    >
      <Pressable
        onPress={disabled ? undefined : onPress}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        hitSlop={4}
        className="w-full h-full rounded-[14px] overflow-hidden"
        style={
          selected
            ? {
                // Inner bg gap so the ink ring isn't flush with the gradient.
                borderWidth: 2,
                borderColor: c.bg,
                shadowColor: '#000000',
                shadowOpacity: 0.12,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }
            : {
                shadowColor: '#000000',
                shadowOpacity: 0.08,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }
        }
      >
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <Svg
          pointerEvents="none"
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Defs>
            <RadialGradient id={`swatchWash-${from}-${to}`} cx="0.28" cy="0.22" rx="0.60" ry="0.60" fx="0.28" fy="0.22">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#swatchWash-${from}-${to})`} />
        </Svg>
        {selected ? (
          <View className="absolute right-1 top-1 w-3.5 h-3.5 rounded-full bg-white items-center justify-center">
            <Check size={10} color={c.ink} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
