import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Camera, Check, Folder, Image as ImageIcon, Paperclip, Share2, SlidersHorizontal, Smile, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../navigation/theme';
import { Body, Caption, Heading, Label } from '../../components/Typography';
import { usePhotoBoothViewModel, type FilterType, type FrameType } from './usePhotoBoothViewModel';
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

// ── Sticker emoji categories ───────────────────────────────────────────────────

const STICKERS: Record<'love' | 'fun' | 'text', string[]> = {
  love: ['❤️', '💕', '🌹', '💌', '💖', '🥰'],
  fun:  ['😄', '🎉', '✨', '🌈', '🎊', '😂'],
  text: ['You & Me', 'Forever', 'Our Story', '♥ Always', 'Memoura'],
};

// ── Frame component ───────────────────────────────────────────────────────────

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
        end={{ x: 1, y: 1 }}
        style={{ padding: 6 }}>
        <View style={{ backgroundColor: '#fff', padding: 2 }}>
          {children}
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
  // 'none'
  return <>{children}</>;
}

// ── FilterStrip ───────────────────────────────────────────────────────────────

function FilterStrip({
  selected,
  onSelect,
}: {
  selected: FilterType;
  onSelect: (f: FilterType) => void;
}) {
  const { t } = useTranslation();
  const colors = useAppColors();

  const filters: FilterType[] = ['original', 'grayscale', 'sepia', 'warm', 'cool', 'rose', 'vintage', 'softglow'];
  const filterLabels: Record<FilterType, string> = {
    original:  t('photoBooth.filters.original'),
    grayscale: t('photoBooth.filters.grayscale'),
    sepia:     t('photoBooth.filters.sepia'),
    warm:      t('photoBooth.filters.warm'),
    cool:      t('photoBooth.filters.cool'),
    rose:      t('photoBooth.filters.rose'),
    vintage:   t('photoBooth.filters.vintage'),
    softglow:  t('photoBooth.filters.softglow'),
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-3 px-3">
      <View className="flex-row gap-3">
        {filters.map(f => {
          const isSelected = f === selected;
          return (
            <Pressable key={f} onPress={() => onSelect(f)} className="items-center gap-1">
              {/* Preview swatch */}
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: FILTER_PREVIEW_BG[f],
                  borderWidth: isSelected ? 2.5 : 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                {/* Overlay simulating filter */}
                {f !== 'original' && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: FILTER_OVERLAYS[f].color,
                      opacity: FILTER_OVERLAYS[f].opacity,
                    }}
                  />
                )}
                {isSelected && (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Check size={12} color="#fff" strokeWidth={2.5} />
                  </View>
                )}
              </View>
              <Caption className="text-white/80 text-[10px]" numberOfLines={1}>
                {filterLabels[f]}
              </Caption>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── FrameStrip ────────────────────────────────────────────────────────────────

function FrameStrip({
  selected,
  onSelect,
}: {
  selected: FrameType;
  onSelect: (f: FrameType) => void;
}) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const frames: FrameType[] = ['none', 'polaroid', 'floral', 'minimal'];
  const frameLabels: Record<FrameType, string> = {
    none:     t('photoBooth.frames.none'),
    polaroid: t('photoBooth.frames.polaroid'),
    floral:   t('photoBooth.frames.floral'),
    minimal:  t('photoBooth.frames.minimal'),
  };

  const FramePreview = ({ frame }: { frame: FrameType }) => {
    if (frame === 'none') {
      return <View style={{ flex: 1, backgroundColor: '#555', borderRadius: 8 }} />;
    }
    if (frame === 'polaroid') {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 3, paddingBottom: 8, borderRadius: 4 }}>
          <View style={{ flex: 1, backgroundColor: '#aaa', borderRadius: 2 }} />
        </View>
      );
    }
    if (frame === 'floral') {
      return (
        <LinearGradient colors={['#E8788A', '#F4A261']} style={{ flex: 1, padding: 3, borderRadius: 8 }}>
          <View style={{ flex: 1, backgroundColor: '#aaa', borderRadius: 4 }} />
        </LinearGradient>
      );
    }
    // minimal
    return (
      <View style={{ flex: 1, borderWidth: 2, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#555' }} />
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-3 px-3">
      <View className="flex-row gap-3">
        {frames.map(f => {
          const isSelected = f === selected;
          return (
            <Pressable key={f} onPress={() => onSelect(f)} className="items-center gap-1">
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  borderWidth: isSelected ? 2.5 : 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  overflow: 'hidden',
                  padding: 2,
                }}>
                <FramePreview frame={f} />
              </View>
              <Caption className="text-white/80 text-[10px]" numberOfLines={1}>
                {frameLabels[f]}
              </Caption>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── StickerPanel ──────────────────────────────────────────────────────────────

function StickerPanel({
  category,
  onCategoryChange,
  onAddSticker,
}: {
  category: 'love' | 'fun' | 'text';
  onCategoryChange: (c: 'love' | 'fun' | 'text') => void;
  onAddSticker: (content: string) => void;
}) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const categories: ('love' | 'fun' | 'text')[] = ['love', 'fun', 'text'];
  const categoryLabels: Record<'love' | 'fun' | 'text', string> = {
    love: t('photoBooth.stickers.love'),
    fun:  t('photoBooth.stickers.fun'),
    text: t('photoBooth.stickers.text'),
  };

  return (
    <View className="px-4 py-3">
      {/* Category tabs */}
      <View className="flex-row gap-2 mb-3">
        {categories.map(c => (
          <Pressable
            key={c}
            onPress={() => onCategoryChange(c)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: c === category ? colors.primary : 'rgba(255,255,255,0.12)',
            }}>
            <Label
              className=""
              style={{ color: c === category ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {categoryLabels[c]}
            </Label>
          </Pressable>
        ))}
      </View>
      {/* Sticker grid */}
      <View className="flex-row flex-wrap gap-3">
        {STICKERS[category].map((sticker, idx) => (
          <Pressable
            key={idx}
            onPress={() => onAddSticker(sticker)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontSize: category === 'text' ? 10 : 24 }} numberOfLines={2}>
              {sticker}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function PhotoBoothScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const vm = usePhotoBoothViewModel();

  // ── Camera / Gallery Mode ─────────────────────────────────────────────────

  if (vm.mode !== 'edit') {
    return (
      <SafeAreaView className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
          <Pressable
            onPress={() => {}}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center', justifyContent: 'center',
            }}>
            <X size={18} color="#fff" strokeWidth={2} />
          </Pressable>

          <Heading size="sm" style={{ color: '#fff' }}>
            {t('photoBooth.title')}
          </Heading>

          {/* Mode toggle */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: 2,
            }}>
            {(['camera', 'gallery'] as const).map(m => (
              <Pressable
                key={m}
                onPress={() => {}}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 18,
                  backgroundColor: vm.mode === m ? colors.primary : 'transparent',
                }}>
                <Label style={{ color: '#fff', fontSize: 12 }}>
                  {m === 'camera' ? t('photoBooth.cameraMode') : t('photoBooth.galleryMode')}
                </Label>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Camera placeholder */}
        <View className="flex-1 items-center justify-center mx-6">
          <View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              borderWidth: 2,
              borderColor: colors.primary,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(232,120,138,0.06)',
            }}>
            <Camera size={48} color={colors.primary} strokeWidth={1.2} />
            <Body
              size="sm"
              style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, textAlign: 'center' }}>
              {t('photoBooth.subtitle')}
            </Body>
          </View>
        </View>

        {/* Countdown overlay */}
        {vm.countdown !== null && (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontSize: 120,
                fontWeight: '900',
                color: colors.primary,
                fontFamily: 'BeVietnamPro-Bold',
              }}>
              {vm.countdown}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View className="px-6 pb-8 gap-3">
          <Pressable
            onPress={vm.handleLaunchCamera}
            disabled={vm.countdown !== null}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: vm.countdown !== null ? 0.5 : 1,
              }}>
              <Camera size={20} color="#fff" strokeWidth={2} />
              <Heading size="sm" style={{ color: '#fff' }}>
                {t('photoBooth.cameraMode')}
              </Heading>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={vm.handleLaunchGallery}
            style={{
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.25)',
            }}>
            <Folder size={20} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
            <Heading size="sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {t('photoBooth.galleryMode')}
            </Heading>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Edit Mode ─────────────────────────────────────────────────────────────

  const overlay = FILTER_OVERLAYS[vm.selectedFilter];

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1">
        {/* Header row */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={vm.handleRetake}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}>
            <X size={14} color="#fff" strokeWidth={2} />
            <Label style={{ color: '#fff', fontSize: 13 }}>
              {t('photoBooth.retake')}
            </Label>
          </Pressable>

          <Heading size="sm" style={{ color: '#fff' }}>
            {t('photoBooth.title')}
          </Heading>

          {/* Watermark indicator */}
          <View style={{ width: 72, alignItems: 'flex-end' }}>
            <Caption style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
              Memoura ❤️
            </Caption>
          </View>
        </View>

        {/* Photo composition area */}
        <View className="items-center">
          <ViewShot
            ref={vm.viewShotRef}
            options={{ format: 'jpg', quality: 0.9 }}
            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}>
            <FrameWrapper frame={vm.selectedFrame}>
              {/* Base photo */}
              <Image
                source={{ uri: vm.photo! }}
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                resizeMode="cover"
              />

              {/* Filter overlay */}
              {overlay.opacity > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: overlay.color,
                    opacity: overlay.opacity,
                  }}
                />
              )}

              {/* Stickers */}
              {vm.stickers.map(sticker => (
                <View
                  key={sticker.id}
                  style={{
                    position: 'absolute',
                    left: sticker.x,
                    top: sticker.y,
                    transform: [{ scale: sticker.scale }],
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text style={{ fontSize: 32 }}>{sticker.content}</Text>
                  {/* Remove button — won't show in saved image but useful in preview */}
                  <Pressable
                    onPress={() => vm.removeSticker(sticker.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 2,
                      marginTop: -12,
                    }}>
                    <X size={10} color="#fff" strokeWidth={2.5} />
                  </Pressable>
                </View>
              ))}

              {/* Watermark */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 10,
                }}>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 11,
                    fontFamily: 'BeVietnamPro-Regular',
                  }}>
                  {t('photoBooth.watermark')}
                </Text>
              </View>
            </FrameWrapper>
          </ViewShot>
        </View>

        {/* Panel area (filters / frames / stickers) */}
        {vm.activePanel === 'filters' && (
          <View style={{ backgroundColor: 'rgba(30,10,20,0.92)' }}>
            <FilterStrip
              selected={vm.selectedFilter}
              onSelect={vm.setSelectedFilter}
            />
          </View>
        )}

        {vm.activePanel === 'frames' && (
          <View style={{ backgroundColor: 'rgba(30,10,20,0.92)' }}>
            <FrameStrip
              selected={vm.selectedFrame}
              onSelect={vm.setSelectedFrame}
            />
          </View>
        )}

        {vm.activePanel === 'stickers' && (
          <View style={{ backgroundColor: 'rgba(30,10,20,0.92)' }}>
            <StickerPanel
              category={vm.stickerCategory}
              onCategoryChange={vm.setStickerCategory}
              onAddSticker={content => {
                vm.addSticker(content);
              }}
            />
          </View>
        )}

        {/* Tool action row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.08)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.08)',
          }}>
          {/* Filters */}
          <Pressable
            onPress={() => vm.togglePanel('filters')}
            style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: vm.activePanel === 'filters'
                  ? colors.primary
                  : 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}>
              <SlidersHorizontal size={18} color="#fff" strokeWidth={1.5} />
            </View>
            <Caption style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
              {t('photoBooth.filters.title')}
            </Caption>
          </Pressable>

          {/* Frames */}
          <Pressable
            onPress={() => vm.togglePanel('frames')}
            style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: vm.activePanel === 'frames'
                  ? colors.primary
                  : 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}>
              <ImageIcon size={18} color="#fff" strokeWidth={1.5} />
            </View>
            <Caption style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
              {t('photoBooth.frames.title')}
            </Caption>
          </Pressable>

          {/* Stickers */}
          <Pressable
            onPress={() => vm.togglePanel('stickers')}
            style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: vm.activePanel === 'stickers'
                  ? colors.primary
                  : 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}>
              <Smile size={18} color="#fff" strokeWidth={1.5} />
            </View>
            <Caption style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
              {t('photoBooth.stickers.title')}
            </Caption>
          </Pressable>
        </View>

        {/* Bottom action bar — Save / Share / Attach */}
        <View
          className="flex-1 justify-end pb-6 px-4">
          <View className="flex-row gap-3">
            {/* Save */}
            <Pressable
              onPress={vm.handleSaveToGallery}
              disabled={vm.isProcessing}
              style={{ flex: 1 }}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 14,
                  padding: 13,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: vm.isProcessing ? 0.6 : 1,
                }}>
                <Check size={16} color="#fff" strokeWidth={2.5} />
                <Label style={{ color: '#fff', fontSize: 13 }}>
                  {t('photoBooth.save')}
                </Label>
              </LinearGradient>
            </Pressable>

            {/* Share */}
            <Pressable
              onPress={vm.handleShare}
              disabled={vm.isProcessing}
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 13,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.25)',
                opacity: vm.isProcessing ? 0.6 : 1,
              }}>
              <Share2 size={16} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
              <Label style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                {t('photoBooth.share')}
              </Label>
            </Pressable>

            {/* Attach to Moment */}
            <Pressable
              onPress={vm.handleAttachToMoment}
              disabled={vm.isProcessing}
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 13,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.25)',
                opacity: vm.isProcessing ? 0.6 : 1,
              }}>
              <Paperclip size={16} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
              <Label style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                {t('photoBooth.attachToMoment')}
              </Label>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
