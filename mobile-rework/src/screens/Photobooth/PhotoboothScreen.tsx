import { CameraView } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import type { BoothLayout } from './usePhotoboothViewModel';
import { usePhotoboothViewModel } from './usePhotoboothViewModel';

// T404 — Photobooth full flow. MVVM per mobile-rework rules.
// Build-61 hotfix: PB1 full-screen (no top insets), PB2 layout picker
// (grid-4/col-4/single), PB3 shutter flash+haptic, PB4 symmetric strip.
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

// ─── Layout config ──────────────────────────────────────────────────────────

type LayoutCfg = { id: BoothLayout; name: string; cols: number; rows: number; count: number };

const LAYOUTS: LayoutCfg[] = [
  { id: 'grid-4', name: 'Lưới 4',  cols: 2, rows: 2, count: 4 },
  { id: 'col-4',  name: 'Dọc 4',   cols: 1, rows: 4, count: 4 },
  { id: 'single', name: 'Đơn',     cols: 1, rows: 1, count: 1 },
];

// PB2: small glyph icon showing the grid shape
function LayoutGlyph({ cfg, active }: { cfg: LayoutCfg; active: boolean }) {
  const color = active ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
  const cells = Array.from({ length: cfg.count });
  return (
    <View
      style={{
        width: 32, height: 32,
        flexDirection: 'row', flexWrap: 'wrap',
        gap: 2, alignContent: 'center', justifyContent: 'center',
      }}
    >
      {cells.map((_, i) => (
        <View
          key={i}
          style={{
            width: cfg.cols === 1 ? 20 : 12,
            height: cfg.rows <= 2 ? 12 : 6,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

// ─── Mode step ──────────────────────────────────────────────────────────────

function ModeStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const c = useAppColors();
  // PB1: no top insets — full-screen gradient, content starts behind status bar
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        className="absolute inset-0"
      />
      <View
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderBottomLeftRadius: 320, borderBottomRightRadius: 320 }}
        className="absolute top-0 left-0 right-0 h-72"
      />

      {/* PB1: use insets.top only for safe area, no extra +8 buffer */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6 mt-2">
          <Pressable
            onPress={vm.onClose}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            hitSlop={8}
          >
            <Text className="text-white text-base font-bodyMedium">✕</Text>
          </Pressable>
          <Text className="font-displayMedium text-white text-[22px]">Photo Booth</Text>
        </View>

        {/* Headline */}
        <Text className="font-script text-white/90 text-2xl leading-8 mb-6">
          {t('compose.photobooth.headline')}
        </Text>

        {/* Mode cards */}
        <View className="gap-3 mb-6">
          <ModeCard emoji="📷" title={t('compose.photobooth.captureNow')} sub={t('compose.photobooth.captureNowSub')} onPress={vm.onStartCamera} />
          <ModeCard emoji="🖼" title={t('compose.photobooth.fromGallery')} sub={t('compose.photobooth.fromGallerySub')} onPress={vm.onPickGallery} />
        </View>

        {/* PB2: Layout picker — 3 buttons matching prototype L145-165 */}
        <Text className="font-bodySemibold text-white/75 text-[11px] uppercase tracking-widest mb-3">
          Bố cục
        </Text>
        <View className="flex-row gap-2">
          {LAYOUTS.map((l) => {
            const active = vm.layout === l.id;
            return (
              <Pressable
                key={l.id}
                onPress={() => vm.setLayout(l.id)}
                className="flex-1 rounded-2xl py-2.5 items-center gap-1.5 active:opacity-80"
                style={{ backgroundColor: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)' }}
              >
                <LayoutGlyph cfg={l} active={active} />
                <Text
                  className="font-bodyBold text-[10px] uppercase tracking-widest"
                  style={{ color: active ? c.primary : '#fff' }}
                >
                  {l.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ModeCard({ emoji, title, sub, onPress }: { emoji: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-3xl p-5 active:opacity-80"
      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
    >
      <Text className="text-3xl">{emoji}</Text>
      <View className="flex-1">
        <Text className="font-bodyBold text-white text-[16px] leading-[22px]">{title}</Text>
        <Text className="font-body text-white/75 text-[12.5px] leading-[17px] mt-0.5">{sub}</Text>
      </View>
    </Pressable>
  );
}

// ─── Capture step ────────────────────────────────────────────────────────────

function CaptureStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isCapturing = vm.countdown > 0;
  const canStart = !isCapturing && vm.shots.length < vm.totalShots;

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={vm.cameraRef} className="flex-1" facing="front" />

      {/* PB3: white flash overlay — Animated so it can fire outside of worklet */}
      <Animated.View
        className="absolute inset-0 bg-white"
        style={{ opacity: vm.flashOpacity }}
        pointerEvents="none"
      />

      {/* Top bar */}
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

        {/* Shot progress bars */}
        <View className="flex-row gap-2">
          {Array.from({ length: vm.totalShots }).map((_, i) => (
            <View
              key={i}
              className="h-1 w-10 rounded-full"
              style={{
                backgroundColor:
                  i < vm.shots.length ? '#fff'
                    : i === vm.shotIndex && isCapturing ? 'rgba(255,255,255,0.6)'
                    : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </View>

        <Text
          className="font-bodyBold text-white text-xs rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 5 }}
        >
          {t('compose.photobooth.shotCounter', { current: vm.shots.length + (isCapturing ? 1 : 0), total: vm.totalShots })}
        </Text>
      </View>

      {/* Countdown */}
      {vm.countdown > 0 && (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <Text
            className="font-displayBold text-white"
            style={{ fontSize: 120, opacity: 0.9, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 }}
          >
            {vm.countdown}
          </Text>
        </View>
      )}

      {/* Bottom */}
      <View className="absolute left-0 right-0 items-center" style={{ bottom: insets.bottom + 24 }}>
        {canStart && (
          <Pressable
            onPress={vm.onStartCountdown}
            className="rounded-full px-10 py-4 active:opacity-80"
            style={{ backgroundColor: '#fff' }}
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

// ─── Review step ─────────────────────────────────────────────────────────────

// PB4: cell dims per prototype StripPreview L598-611
const STRIP_DIMS: Record<BoothLayout, { cols: number; cellW: number; cellH: number; stripW: number }> = {
  'grid-4': { cols: 2, cellW: 138, cellH: 166, stripW: 292 },  // 2×138 + 16gap = 292; symmetric p-4 on card
  'col-4':  { cols: 1, cellW: 224, cellH: 140, stripW: 224 },
  'single': { cols: 1, cellW: 240, cellH: 290, stripW: 240 },
};

function ReviewStep({ vm }: { vm: ReturnType<typeof usePhotoboothViewModel> }) {
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const dim = STRIP_DIMS[vm.layout];
  const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <View className="flex-1 bg-bg">
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

      <View className="flex-1 items-center justify-center px-6">
        {/* PB4: ViewShot-capturable strip with symmetric padding */}
        <View
          ref={vm.stripRef}
          className="bg-white rounded-2xl p-4 pb-10"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
          }}
        >
          {/* Photo grid — symmetric: 2×cellW + 1×gap = stripW, p-4 on both sides */}
          <View
            style={{
              width: dim.stripW,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: dim.cols === 2 ? 16 : 8,
              justifyContent: 'center',
            }}
          >
            {Array.from({ length: vm.totalShots }).map((_, i) => (
              <View
                key={i}
                className="rounded-lg overflow-hidden"
                style={{ width: dim.cellW, height: dim.cellH }}
              >
                {vm.shots[i] ? (
                  <Image source={{ uri: vm.shots[i] }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full bg-surface items-center justify-center">
                    <Text className="text-2xl">📷</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Polaroid caption */}
          <View className="mt-3 flex-row items-center justify-between px-1">
            <Text className="font-script text-[16px]" style={{ color: c.primary }}>memoura ♥</Text>
            <Text className="font-body text-[10px]" style={{ color: c.inkMute, fontFamily: 'Courier' }}>{today}</Text>
          </View>
        </View>
      </View>

      <View className="px-5 gap-3" style={{ paddingBottom: insets.bottom + 20 }}>
        <Pressable
          onPress={vm.onAccept}
          disabled={vm.isSaving}
          className="rounded-2xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: c.primary, opacity: vm.isSaving ? 0.6 : 1 }}
        >
          <Text className="font-bodyBold text-white text-[15px]">
            {vm.isSaving ? t('compose.photobooth.saving') : t('compose.photobooth.accept')}
          </Text>
        </Pressable>
        <Pressable
          onPress={vm.onRetake}
          className="rounded-2xl py-4 items-center border border-line-on-surface active:opacity-70"
        >
          <Text className="font-bodyMedium text-ink-soft text-[15px]">{t('compose.photobooth.retake')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
