import React, { useCallback, useRef } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import ViewShot from 'react-native-view-shot';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import type { Camera as VisionCameraHandle } from 'react-native-vision-camera';
import { Camera, Check, Download, Image as ImageIcon, RotateCcw, Share2, SlidersHorizontal, Smile, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../navigation/theme';
import { Body, Caption, Heading, Label } from '../../components/Typography';
import { usePhotoBoothViewModel, type FilterType, type FrameType, type PhotoCount } from './usePhotoBoothViewModel';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = SCREEN_WIDTH;

// ── Filter config ─────────────────────────────────────────────────────────────

interface FilterOverlay {
  color: string;
  opacity: number;
}

const FILTER_OVERLAYS: Record<FilterType, FilterOverlay> = {
  original:  { color: 'transparent', opacity: 0 },
  grayscale: { color: '#808080', opacity: 0.65 },
  sepia:     { color: '#704214', opacity: 0.35 },
  warm:      { color: '#FF8C00', opacity: 0.18 },
  cool:      { color: '#0066CC', opacity: 0.18 },
  rose:      { color: '#FF69B4', opacity: 0.25 },
  vintage:   { color: '#8B4513', opacity: 0.30 },
  softglow:  { color: '#FFFFFF', opacity: 0.18 },
};

const FILTER_PREVIEW_BG: Record<FilterType, string> = {
  original:  '#E8778A',
  grayscale: '#9E9E9E',
  sepia:     '#C4A265',
  warm:      '#F4A261',
  cool:      '#64B5F6',
  rose:      '#F48FB1',
  vintage:   '#A1887F',
  softglow:  '#FFF9C4',
};

const STICKERS: Record<'love' | 'fun' | 'text', string[]> = {
  love: ['❤️', '💕', '🌹', '💌', '💖', '🥰'],
  fun:  ['😄', '🎉', '✨', '🌈', '🎊', '😂'],
  text: ['You & Me', 'Forever', 'Our Story', '♥ Always', 'Memoura'],
};

// ── PhotoGrid ─────────────────────────────────────────────────────────────────

function PhotoGrid({ photos, photoCount, size }: { photos: string[]; photoCount: PhotoCount; size: number }) {
  if (photoCount === 1) {
    return photos[0]
      ? <Image source={{ uri: photos[0] }} style={{ width: size, height: size }} resizeMode="cover" />
      : <View style={{ width: size, height: size, backgroundColor: '#111' }} />;
  }
  const cols = 2;
  const rows = photoCount / cols; // 2 for 4-photo, 3 for 6-photo
  const cellW = size / cols;
  const cellH = size / rows;
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: photoCount }).map((_, i) => (
        <View key={i} style={{ width: cellW, height: cellH }}>
          {photos[i] ? (
            <Image source={{ uri: photos[i] }} style={{ width: cellW, height: cellH }} resizeMode="cover" />
          ) : (
            <View style={{ width: cellW, height: cellH, backgroundColor: '#222' }} />
          )}
        </View>
      ))}
    </View>
  );
}

// ── FrameWrapper ──────────────────────────────────────────────────────────────

function FrameWrapper({ frame, children }: { frame: FrameType; children: React.ReactNode }) {
  if (frame === 'polaroid') {
    return (
      <View style={{ backgroundColor: '#FFFFFF', padding: 8, paddingBottom: 28 }}>
        {children}
      </View>
    );
  }
  if (frame === 'floral') {
    return (
      <LinearGradient
        colors={['#E8788A', '#F4A261']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={{ padding: 6 }}>
          <View style={{ backgroundColor: '#fff', padding: 2 }}>
            {children}
          </View>
        </View>
      </LinearGradient>
    );
  }
  if (frame === 'minimal') {
    return (
      <View style={{ borderWidth: 2, borderColor: '#FFFFFF' }}>
        {children}
      </View>
    );
  }
  return <View style={{ flex: 1 }}>{children}</View>;
}

// ── FilterStrip ───────────────────────────────────────────────────────────────

function FilterStrip({ selected, onSelect }: { selected: FilterType; onSelect: (f: FilterType) => void }) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const filters: FilterType[] = ['original', 'grayscale', 'sepia', 'warm', 'cool', 'rose', 'vintage', 'softglow'];
  const filterLabels: Record<FilterType, string> = {
    original: t('photoBooth.filters.original'), grayscale: t('photoBooth.filters.grayscale'),
    sepia: t('photoBooth.filters.sepia'), warm: t('photoBooth.filters.warm'),
    cool: t('photoBooth.filters.cool'), rose: t('photoBooth.filters.rose'),
    vintage: t('photoBooth.filters.vintage'), softglow: t('photoBooth.filters.softglow'),
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 px-3">
      <View className="flex-row gap-3">
        {filters.map(f => {
          const isSelected = f === selected;
          return (
            <Pressable key={f} onPress={() => onSelect(f)} className="items-center gap-1">
              <View style={{
                width: 56, height: 56, borderRadius: 12,
                backgroundColor: FILTER_PREVIEW_BG[f],
                borderWidth: isSelected ? 2.5 : 1,
                borderColor: isSelected ? colors.primary : colors.border,
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {f !== 'original' && (
                  <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: FILTER_OVERLAYS[f].color, opacity: FILTER_OVERLAYS[f].opacity,
                  }} />
                )}
                {isSelected && (
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={12} color="#fff" strokeWidth={2.5} />
                  </View>
                )}
              </View>
              <Caption className="text-white/80 text-[10px]" numberOfLines={1}>{filterLabels[f]}</Caption>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── FrameStrip ────────────────────────────────────────────────────────────────

function FrameStrip({ selected, onSelect }: { selected: FrameType; onSelect: (f: FrameType) => void }) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const frames: FrameType[] = ['none', 'polaroid', 'floral', 'minimal'];
  const frameLabels: Record<FrameType, string> = {
    none: t('photoBooth.frames.none'), polaroid: t('photoBooth.frames.polaroid'),
    floral: t('photoBooth.frames.floral'), minimal: t('photoBooth.frames.minimal'),
  };
  const FramePreview = ({ frame }: { frame: FrameType }) => {
    if (frame === 'none') return <View style={{ flex: 1, backgroundColor: '#555', borderRadius: 8 }} />;
    if (frame === 'polaroid') return (
      <View style={{ flex: 1, backgroundColor: '#fff', padding: 3, paddingBottom: 8, borderRadius: 4 }}>
        <View style={{ flex: 1, backgroundColor: '#aaa', borderRadius: 2 }} />
      </View>
    );
    if (frame === 'floral') return (
      <LinearGradient colors={['#E8788A', '#F4A261']} style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 3, borderRadius: 8 }}>
          <View style={{ flex: 1, backgroundColor: '#aaa', borderRadius: 4 }} />
        </View>
      </LinearGradient>
    );
    return <View style={{ flex: 1, borderWidth: 2, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#555' }} />;
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 px-3">
      <View className="flex-row gap-3">
        {frames.map(f => {
          const isSelected = f === selected;
          return (
            <Pressable key={f} onPress={() => onSelect(f)} className="items-center gap-1">
              <View style={{
                width: 56, height: 56, borderRadius: 12,
                borderWidth: isSelected ? 2.5 : 1,
                borderColor: isSelected ? colors.primary : colors.border,
                overflow: 'hidden', padding: 2,
              }}>
                <FramePreview frame={f} />
              </View>
              <Caption className="text-white/80 text-[10px]" numberOfLines={1}>{frameLabels[f]}</Caption>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── StickerPanel ──────────────────────────────────────────────────────────────

function StickerPanel({ category, onCategoryChange, onAddSticker }: {
  category: 'love' | 'fun' | 'text';
  onCategoryChange: (c: 'love' | 'fun' | 'text') => void;
  onAddSticker: (content: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const categories: ('love' | 'fun' | 'text')[] = ['love', 'fun', 'text'];
  const categoryLabels: Record<'love' | 'fun' | 'text', string> = {
    love: t('photoBooth.stickers.love'), fun: t('photoBooth.stickers.fun'),
    text: t('photoBooth.stickers.text'),
  };
  return (
    <View className="px-4 py-3">
      <View className="flex-row gap-2 mb-3">
        {categories.map(c => (
          <Pressable key={c} onPress={() => onCategoryChange(c)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              backgroundColor: c === category ? colors.primary : 'rgba(255,255,255,0.12)',
            }}>
            <Label style={{ color: c === category ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {categoryLabels[c]}
            </Label>
          </Pressable>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-3">
        {STICKERS[category].map((sticker, idx) => (
          <Pressable key={idx} onPress={() => onAddSticker(sticker)}
            style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: category === 'text' ? 10 : 24 }} numberOfLines={2}>{sticker}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── CameraScreen — single screen with pill tabs + live preview + Bắt đầu ──────

function CameraScreen({ vm }: {
  vm: ReturnType<typeof usePhotoBoothViewModel>;
}) {
  const { t } = useTranslation();
  const colors = useAppColors();

  const [cameraPosition, setCameraPosition] = React.useState<'back' | 'front'>('front');
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const cameraRef = useRef<VisionCameraHandle>(null);
  const isCapturingRef = useRef(false);

  const device = useCameraDevice(cameraPosition);
  const { hasPermission, requestPermission } = useCameraPermission();

  React.useEffect(() => {
    if (!hasPermission) requestPermission();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerCapture = useCallback(async () => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    setCountdown(3);
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    setCountdown(2);
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    setCountdown(1);
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    setCountdown(null);
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto();
        vm.addPhoto(`file://${photo.path}`);
      }
    } catch { /* ignore */ }
    isCapturingRef.current = false;
  }, [vm]);

  // Start auto-capture when vm.isCapturing becomes true
  React.useEffect(() => {
    if (vm.isCapturing && !isCapturingRef.current) {
      triggerCapture();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.isCapturing]);

  // Auto-restart after each photo captured
  React.useEffect(() => {
    if (vm.isCapturing && vm.capturedCount > 0 && vm.capturedCount < vm.photoCount) {
      const timer = setTimeout(() => triggerCapture(), 800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.capturedCount]);

  const COUNTS: PhotoCount[] = [1, 4, 6];

  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
        <Camera size={48} color={colors.primary} strokeWidth={1.2} />
        <Body size="lg" style={{ color: '#fff', textAlign: 'center', marginTop: 16, marginBottom: 24 }}>
          {t('photoBooth.cameraPermission')}
        </Body>
        <Pressable onPress={requestPermission}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 14 }}>
            <View style={{ paddingHorizontal: 32, paddingVertical: 14 }}>
              <Label style={{ color: '#fff' }}>{t('photoBooth.grantPermission')}</Label>
            </View>
          </LinearGradient>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Body size="md" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('photoBooth.noCamera')}</Body>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* TOP: Count selector pills (hidden during capture) */}
      {!vm.isCapturing && (
        <SafeAreaView>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
            {/* Close button */}
            <Pressable
              onPress={vm.handleClose}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#fff" strokeWidth={2} />
            </Pressable>

            {/* Pill tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 24, padding: 3, gap: 2 }}>
              {COUNTS.map(count => {
                const isActive = count === vm.photoCount;
                return (
                  <Pressable
                    key={count}
                    onPress={() => vm.handleSetPhotoCount(count)}
                    style={{
                      paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: isActive ? colors.primary : 'transparent',
                    }}>
                    <Label style={{ color: '#fff', fontSize: 13, fontWeight: isActive ? '700' : '400' }}>
                      {count}
                    </Label>
                  </Pressable>
                );
              })}
            </View>

            {/* Gallery picker */}
            <Pressable
              onPress={vm.handlePickFromGallery}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={18} color="#fff" strokeWidth={1.8} />
            </Pressable>
          </View>
        </SafeAreaView>
      )}

      {/* MIDDLE: Live camera preview */}
      <View style={{ flex: 1 }}>
        <VisionCamera
          ref={cameraRef}
          style={{ flex: 1 }}
          device={device}
          isActive={true}
          photo
        />

        {/* Progress counter — visible whenever at least 1 photo captured */}
        {vm.capturedCount > 0 && (
          <View style={{ position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
              {Array.from({ length: vm.photoCount }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i < vm.capturedCount ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i < vm.capturedCount ? colors.primary : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                {vm.capturedCount}/{vm.photoCount}
              </Text>
            </View>
          </View>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 120, fontWeight: '900', color: colors.primary, fontFamily: 'BeVietnamPro-Bold' }}>
              {countdown}
            </Text>
          </View>
        )}
      </View>

      {/* BOTTOM: Bắt đầu button + flip (hidden during capture) */}
      {!vm.isCapturing && (
        <SafeAreaView>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, paddingTop: 12, gap: 16 }}>
            {/* Start button */}
            <Pressable onPress={vm.handleStartCapture} style={{ flex: 1 }}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16 }}>
                <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Heading size="sm" style={{ color: '#fff' }}>
                    {t('photoBooth.startCapture')}
                  </Heading>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Flip camera */}
            <Pressable
              onPress={() => setCameraPosition(p => p === 'back' ? 'front' : 'back')}
              style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={22} color="#fff" strokeWidth={1.8} />
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PhotoBoothScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const vm = usePhotoBoothViewModel();
  const stickerStartPos = useRef<Record<string, { x: number; y: number }>>({});

  // ── Camera Mode ────────────────────────────────────────────────────────────
  if (vm.mode === 'camera') {
    return <CameraScreen vm={vm} />;
  }

  // ── Edit Mode ──────────────────────────────────────────────────────────────
  const overlay = FILTER_OVERLAYS[vm.selectedFilter];

  const frameInnerSize = (() => {
    if (vm.selectedFrame === 'polaroid') return PHOTO_SIZE - 16; // padding 8 each side
    if (vm.selectedFrame === 'floral')   return PHOTO_SIZE - 18; // padding 6 + innerPadding 2 + 1px border each side
    if (vm.selectedFrame === 'minimal')  return PHOTO_SIZE - 4;  // borderWidth 2 each side
    return PHOTO_SIZE;
  })();

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        {/* Header row */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={vm.handleRetake}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' }}>
            <X size={14} color="#fff" strokeWidth={2} />
            <Label style={{ color: '#fff', fontSize: 13 }}>{t('photoBooth.retake')}</Label>
          </Pressable>

          <Heading size="sm" style={{ color: '#fff' }}>{t('photoBooth.title')}</Heading>

          <View style={{ width: 72, alignItems: 'flex-end' }}>
            <Caption style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Memoura ❤️</Caption>
          </View>
        </View>

        {/* Photo composition */}
        <View className="items-center">
          <View style={{ position: 'relative' }}>
            {/* Capture layer — everything rendered here goes into the exported image */}
            <ViewShot
              ref={vm.viewShotRef}
              options={{ format: 'jpg', quality: 0.9 }}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, overflow: 'hidden' }}>
              <FrameWrapper frame={vm.selectedFrame}>
                <PhotoGrid photos={vm.photos} photoCount={vm.photoCount} size={frameInnerSize} />

                {/* Filter overlay */}
                {overlay.opacity > 0 && (
                  <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: overlay.color, opacity: overlay.opacity,
                  }} />
                )}

                {/* Sticker emojis — captured in output image, no gesture here */}
                {vm.stickers.map(sticker => (
                  <View
                    key={sticker.id}
                    style={{ position: 'absolute', left: sticker.x, top: sticker.y, transform: [{ scale: sticker.scale }] }}>
                    <Text style={{ fontSize: 32 }}>{sticker.content}</Text>
                  </View>
                ))}

                {/* Watermark */}
                <View style={{ position: 'absolute', bottom: 8, right: 10 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'BeVietnamPro-Regular' }}>
                    {t('photoBooth.watermark')}
                  </Text>
                </View>
              </FrameWrapper>
            </ViewShot>

            {/* Gesture overlay — drag handles + remove buttons, NOT captured in image */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: PHOTO_SIZE, height: PHOTO_SIZE }} pointerEvents="box-none">
              {vm.stickers.map(sticker => (
                <PanGestureHandler
                  key={sticker.id}
                  onHandlerStateChange={(e) => {
                    if (e.nativeEvent.state === State.BEGAN) {
                      stickerStartPos.current[sticker.id] = { x: sticker.x, y: sticker.y };
                    }
                  }}
                  onGestureEvent={(e) => {
                    const start = stickerStartPos.current[sticker.id];
                    if (start) {
                      vm.setStickerPosition(
                        sticker.id,
                        start.x + e.nativeEvent.translationX,
                        start.y + e.nativeEvent.translationY,
                      );
                    }
                  }}>
                  <View style={{ position: 'absolute', left: sticker.x, top: sticker.y }}>
                    {/* Transparent drag target sized to sticker */}
                    <View style={{ width: 52, height: 52, backgroundColor: 'transparent' }} />
                    {/* Remove button — positioned outside drag area so it doesn't conflict */}
                    <Pressable
                      onPress={() => vm.removeSticker(sticker.id)}
                      style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={10} color="#fff" strokeWidth={2.5} />
                    </Pressable>
                  </View>
                </PanGestureHandler>
              ))}
            </View>
          </View>
        </View>

        {/* Panels */}
        {vm.activePanel === 'filters' && (
          <View style={{ backgroundColor: 'rgba(30,10,20,0.92)' }}>
            <FilterStrip selected={vm.selectedFilter} onSelect={vm.setSelectedFilter} />
          </View>
        )}
        {vm.activePanel === 'frames' && (
          <View style={{ backgroundColor: 'rgba(30,10,20,0.92)' }}>
            <FrameStrip selected={vm.selectedFrame} onSelect={vm.setSelectedFrame} />
          </View>
        )}
        {vm.activePanel === 'stickers' && (
          <View style={{ backgroundColor: 'rgba(30,10,20,0.92)' }}>
            <StickerPanel
              category={vm.stickerCategory}
              onCategoryChange={vm.setStickerCategory}
              onAddSticker={vm.addSticker}
            />
          </View>
        )}

        {/* Tool row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
          {[
            { key: 'filters' as const, Icon: SlidersHorizontal, label: t('photoBooth.filters.title') },
            { key: 'frames' as const, Icon: ImageIcon, label: t('photoBooth.frames.title') },
            { key: 'stickers' as const, Icon: Smile, label: t('photoBooth.stickers.title') },
          ].map(({ key, Icon, label }) => (
            <Pressable key={key} onPress={() => vm.togglePanel(key)} style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: vm.activePanel === key ? colors.primary : 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="#fff" strokeWidth={1.5} />
              </View>
              <Caption style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{label}</Caption>
            </Pressable>
          ))}
        </View>

        {/* Bottom action bar */}
        <View className="flex-1 justify-end">
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 24 }}>
            {/* Save to Memories — gradient fill */}
            <Pressable onPress={vm.handleSaveToMemories} disabled={vm.isProcessing} style={{ flex: 1, opacity: vm.isProcessing ? 0.6 : 1 }}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 14 }}>
                <View style={{ paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                  <Check size={16} color="#fff" strokeWidth={2.5} />
                  <Label style={{ color: '#fff', fontSize: 13 }}>{t('photoBooth.save')}</Label>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Share — outline */}
            <Pressable onPress={vm.handleShare} disabled={vm.isProcessing}
              style={{ flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', opacity: vm.isProcessing ? 0.6 : 1 }}>
              <Share2 size={16} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
              <Label style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{t('photoBooth.share')}</Label>
            </Pressable>

            {/* Save to Gallery — small icon button */}
            <Pressable onPress={vm.handleSaveToGallery} disabled={vm.isProcessing}
              style={{ width: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', opacity: vm.isProcessing ? 0.6 : 1 }}>
              <Download size={18} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
            </Pressable>

          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
