import { CameraView } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePhotoboothViewModel } from './usePhotoboothViewModel';

// T404 — Photobooth full flow. MVVM per mobile-rework rules.
// mode → capture (camera) / gallery (picker) → review (strip composite)
// Prototype: docs/design/prototype/memoura-v2/photobooth.jsx

export function PhotoboothScreen() {
  const vm = usePhotoboothViewModel();

  return (
    <View className="flex-1">
      {vm.step === 'mode' && <ModeStep vm={vm} />}
      {vm.step === 'capture' && <CaptureStep vm={vm} />}
      {vm.step === 'review' && <ReviewStep vm={vm} />}
    </View>
  );
}

// ─── Mode step ─────────────────────────────────────────────────────────────

function ModeStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      {/* Full-screen heroA → heroB → heroC gradient */}
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        className="absolute inset-0"
      />
      {/* Ambient radial highlight */}
      <View
        className="absolute top-0 left-0 right-0 h-80"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderBottomLeftRadius: 320, borderBottomRightRadius: 320 }}
      />

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flex: 1 }}>
        {/* Header row: close + title */}
        <View className="flex-row items-center gap-3 mb-8">
          <Pressable
            onPress={vm.onClose}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text className="text-white text-base font-bodyMedium">✕</Text>
          </Pressable>
          <Text className="font-displayMedium text-white text-[22px]">
            Photo Booth
          </Text>
        </View>

        {/* Headline */}
        <View className="mb-8">
          <Text className="font-script text-white/90 text-2xl leading-8">
            {t('compose.photobooth.headline')}
          </Text>
        </View>

        {/* Mode cards */}
        <View className="gap-3">
          <ModeCard
            emoji="📷"
            title={t('compose.photobooth.captureNow')}
            sub={t('compose.photobooth.captureNowSub')}
            onPress={vm.onStartCamera}
          />
          <ModeCard
            emoji="🖼"
            title={t('compose.photobooth.fromGallery')}
            sub={t('compose.photobooth.fromGallerySub')}
            onPress={vm.onPickGallery}
          />
        </View>
      </View>
    </View>
  );
}

function ModeCard({
  emoji,
  title,
  sub,
  onPress,
}: {
  emoji: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-3xl p-5 active:opacity-80"
      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
      accessibilityRole="button"
    >
      <Text className="text-3xl">{emoji}</Text>
      <View className="flex-1">
        <Text className="font-bodyBold text-white text-[16px] leading-[22px]">{title}</Text>
        <Text className="font-body text-white/75 text-[12.5px] leading-[17px] mt-0.5">{sub}</Text>
      </View>
    </Pressable>
  );
}

// ─── Capture step ──────────────────────────────────────────────────────────

function CaptureStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isCapturing = vm.countdown > 0;
  const canStart = !isCapturing && vm.shots.length < vm.totalShots;

  return (
    <View className="flex-1 bg-black">
      {/* Camera view fills screen */}
      <CameraView ref={vm.cameraRef} className="flex-1" facing="front" />

      {/* Top overlay: close + shot progress */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 12 }}
      >
        <Pressable
          onPress={vm.onClose}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          hitSlop={8}
        >
          <Text className="text-white text-base">✕</Text>
        </Pressable>

        {/* Shot progress bar */}
        <View className="flex-row gap-2">
          {Array.from({ length: vm.totalShots }).map((_, i) => (
            <View
              key={i}
              className="h-1 w-10 rounded-full"
              style={{
                backgroundColor:
                  i < vm.shots.length
                    ? '#fff'
                    : i === vm.shotIndex && isCapturing
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </View>

        <Text
          className="font-bodyBold text-white text-xs"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 }}
        >
          {t('compose.photobooth.shotCounter', {
            current: vm.shots.length + (isCapturing ? 1 : 0),
            total: vm.totalShots,
          })}
        </Text>
      </View>

      {/* Countdown overlay */}
      {vm.countdown > 0 && (
        <View className="absolute inset-0 items-center justify-center">
          <Text
            className="font-displayBold text-white"
            style={{ fontSize: 120, opacity: 0.9, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 }}
          >
            {vm.countdown}
          </Text>
        </View>
      )}

      {/* Bottom bar: start button */}
      <View
        className="absolute left-0 right-0 items-center pb-2"
        style={{ bottom: insets.bottom + 24 }}
      >
        {canStart && (
          <Pressable
            onPress={vm.onStartCountdown}
            className="rounded-full px-10 py-4 active:opacity-80"
            style={{ backgroundColor: '#fff' }}
            accessibilityRole="button"
          >
            <Text className="font-bodyBold text-[16px]" style={{ color: '#000' }}>
              {t('compose.photobooth.start')}
            </Text>
          </Pressable>
        )}
        {isCapturing && (
          <View className="w-16 h-16 rounded-full items-center justify-center border-4 border-white" />
        )}
      </View>
    </View>
  );
}

// ─── Review step ───────────────────────────────────────────────────────────

function ReviewStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <View className="flex-1 bg-bg">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12 }} className="px-5 flex-row items-center gap-3 pb-4">
        <Pressable
          onPress={vm.onRetake}
          className="w-9 h-9 rounded-full items-center justify-center bg-surface border border-line-on-surface"
          hitSlop={8}
        >
          <Text className="text-ink text-sm">←</Text>
        </Pressable>
        <Text className="font-displayMedium text-ink text-[20px]">Photo Booth</Text>
      </View>

      {/* Strip composite — this View is captured by view-shot */}
      <View className="flex-1 items-center justify-center px-6">
        <View
          ref={vm.stripRef}
          className="bg-white rounded-2xl p-4"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
          }}
        >
          {/* 2×2 photo grid */}
          <View className="flex-row flex-wrap gap-2" style={{ width: 296 }}>
            {Array.from({ length: vm.totalShots }).map((_, i) => (
              <View key={i} className="rounded-lg overflow-hidden" style={{ width: 140, height: 168 }}>
                {vm.shots[i] ? (
                  <Image
                    source={{ uri: vm.shots[i] }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-surface items-center justify-center">
                    <Text className="text-2xl">📷</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Polaroid caption strip */}
          <View className="mt-3 flex-row items-center justify-between px-1">
            <Text className="font-script text-[16px]" style={{ color: c.primary }}>
              memoura ♥
            </Text>
            <Text className="font-body text-[10px]" style={{ color: c.inkMute, fontFamily: 'Courier' }}>
              {today}
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View className="px-5 gap-3" style={{ paddingBottom: insets.bottom + 20 }}>
        <Pressable
          onPress={vm.onAccept}
          disabled={vm.isSaving}
          className="rounded-2xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: c.primary, opacity: vm.isSaving ? 0.6 : 1 }}
          accessibilityRole="button"
        >
          <Text className="font-bodyBold text-white text-[15px]">
            {vm.isSaving ? t('compose.photobooth.saving') : t('compose.photobooth.accept')}
          </Text>
        </Pressable>
        <Pressable
          onPress={vm.onRetake}
          className="rounded-2xl py-4 items-center border border-line-on-surface active:opacity-70"
          accessibilityRole="button"
        >
          <Text className="font-bodyMedium text-ink-soft text-[15px]">
            {t('compose.photobooth.retake')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
