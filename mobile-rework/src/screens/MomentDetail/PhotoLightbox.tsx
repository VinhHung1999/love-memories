import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Download, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Image,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// T379 (Sprint 62) — DIY lightbox. Chose not to pull in
// react-native-awesome-gallery: its active branches target Reanimated 3 and
// this repo is on Reanimated v4 (same family that crashed Mapbox UserLocation
// in Sprint 60). A minimal composed Pinch + DoubleTap + Pan dismiss covers
// the spec without adding a compat risk.
//
// T406 (Sprint 63) — upgrade to multi-photo swipe + Download:
//   - FlatList horizontal pagingEnabled lets users swipe between photos of
//     the same moment without closing the lightbox. `scrollEnabled` is
//     flipped off when any photo is zoomed so the user can pan a zoomed
//     image without accidentally paging.
//   - Close X matches the PairJoin QR scanner style — bg-black/40,
//     strokeWidth 2.2, SafeAreaView edges top+bottom, pt-6 extra pad
//     (Dynamic Island crowding avoidance, see PairJoinScreen L179-182).
//   - Download button saves the currently-active photo to Photos via
//     expo-media-library. Photos live on the CDN, so we first
//     downloadAsync to cacheDirectory, then saveToLibraryAsync. Toast
//     feedback auto-dismisses in 2.5s.

type Photo = { id: string; url: string; filename?: string };

type Props = {
  visible: boolean;
  photos: readonly Photo[];
  initialIndex: number;
  onClose: () => void;
};

const MAX_SCALE = 4;
const MIN_SCALE = 1;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_PX = 120;
const TOAST_MS = 2500;

export function PhotoLightbox({ visible, photos, initialIndex, onClose }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Photo>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [anyZoomed, setAnyZoomed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Sync activeIndex whenever the lightbox opens with a different initial
  // photo. Without this the second open would always land on the previous
  // session's photo.
  useEffect(() => {
    if (!visible) return;
    setActiveIndex(initialIndex);
    setAnyZoomed(false);
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const next = Math.round(offsetX / Math.max(width, 1));
      if (next !== activeIndex) setActiveIndex(next);
    },
    [activeIndex, width],
  );

  const handleDownload = useCallback(async () => {
    const photo = photos[activeIndex];
    if (!photo || downloading) return;
    setDownloading(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        setToast(t('moments.detail.lightbox.permissionDenied'));
        return;
      }
      const filename = photo.filename || `moment-${photo.id}.jpg`;
      const localUri = `${cacheDirectory ?? ''}${filename}`;
      const result = await downloadAsync(photo.url, localUri);
      await MediaLibrary.saveToLibraryAsync(result.uri);
      setToast(t('moments.detail.lightbox.downloadSuccess'));
    } catch {
      setToast(t('moments.detail.lightbox.downloadError'));
    } finally {
      setDownloading(false);
    }
  }, [activeIndex, downloading, photos, t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <FlatList
          ref={listRef}
          data={photos as Photo[]}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          scrollEnabled={!anyZoomed}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, idx) => ({
            length: width,
            offset: width * idx,
            index: idx,
          })}
          onMomentumScrollEnd={onMomentumEnd}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 50);
          }}
          renderItem={({ item, index }) => (
            <ZoomablePhoto
              photo={item}
              width={width}
              active={index === activeIndex}
              onDismiss={onClose}
              onZoomChange={setAnyZoomed}
            />
          )}
        />

        <SafeAreaView
          edges={['top', 'bottom']}
          className="absolute left-0 right-0 top-0 bottom-0"
          pointerEvents="box-none"
        >
          {/* Close X — visually identical to PairJoinScreen QR close
              (bg-black/40, pt-6 to clear Dynamic Island, strokeWidth 2.2). */}
          <View className="px-4 pt-6 flex-row justify-end" pointerEvents="box-none">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={12}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center active:opacity-80"
            >
              <X size={20} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </View>

          <View className="flex-1" pointerEvents="none" />

          <View className="px-4 pb-4 items-center" pointerEvents="box-none">
            {photos.length > 1 ? (
              <View className="flex-row gap-1.5 mb-3">
                {photos.map((p, idx) => (
                  <View
                    key={p.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        idx === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </View>
            ) : null}
            <Pressable
              onPress={handleDownload}
              disabled={downloading || photos.length === 0}
              accessibilityRole="button"
              accessibilityLabel={t('moments.detail.lightbox.download')}
              accessibilityState={{ disabled: downloading }}
              hitSlop={8}
              className="flex-row items-center gap-2 rounded-full bg-black/50 px-5 h-11 active:opacity-80"
            >
              <Download size={16} color="#FFFFFF" strokeWidth={2.2} />
              <Text className="font-bodySemibold text-white text-[14px]">
                {t('moments.detail.lightbox.download')}
              </Text>
            </Pressable>
          </View>

          {toast ? (
            <View
              pointerEvents="none"
              className="absolute left-0 right-0 items-center px-6"
              style={{ top: 80 }}
            >
              <View className="rounded-full bg-black/80 px-4 py-2.5">
                <Text className="font-bodyMedium text-white text-[13px]">{toast}</Text>
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

type ZoomProps = {
  photo: Photo;
  width: number;
  active: boolean;
  onDismiss: () => void;
  onZoomChange: (zoomed: boolean) => void;
};

function ZoomablePhoto({ photo, width, active, onDismiss, onZoomChange }: ZoomProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateY = useSharedValue(0);

  // Reset transforms when this photo scrolls off-screen so the next time
  // the user swipes back to it, it opens unzoomed + re-centered.
  useEffect(() => {
    if (active) return;
    scale.value = 1;
    savedScale.value = 1;
    translateY.value = 0;
    onZoomChange(false);
  }, [active, onZoomChange, scale, savedScale, translateY]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(onZoomChange)(scale.value > 1.01);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomed = scale.value > 1.01;
      const next = zoomed ? MIN_SCALE : DOUBLE_TAP_SCALE;
      scale.value = withTiming(next, { duration: 200 });
      savedScale.value = next;
      runOnJS(onZoomChange)(!zoomed);
    });

  // Pan is vertical-only (activeOffsetY + failOffsetX) so horizontal swipes
  // reach the parent FlatList's paging. When zoomed, the outer FlatList is
  // scroll-disabled anyway — but the pan also gates dismiss on scale===1,
  // so a zoomed pan (which we don't support here) never dismisses.
  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-12, 12])
    .onUpdate((e) => {
      if (scale.value <= 1.01) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const canDismiss = scale.value <= 1.01 && Math.abs(e.translationY) > DISMISS_PX;
      if (canDismiss) {
        runOnJS(onDismiss)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const composed = Gesture.Simultaneous(pinch, Gesture.Exclusive(doubleTap, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <View style={{ width }} className="flex-1 items-center justify-center">
        <Animated.View style={animatedStyle} className="w-full h-full">
          <Image
            source={{ uri: photo.url }}
            resizeMode="contain"
            className="w-full h-full"
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
