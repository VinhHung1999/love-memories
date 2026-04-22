import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, MoreHorizontal, Share2 } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme/ThemeProvider';

import { GlassButton } from './GlassButton';
import { StoriesProgressBar } from './StoriesProgressBar';
import { ThumbnailStrip } from './ThumbnailStrip';

// T396 (Sprint 63) — 520px hero composing the redesign from prototype
// moments.jsx L401-533. Stitches together:
//   - background LinearGradient (primary-soft → primary → primary-deep,
//     diagonal 145deg) — tag-color palette swap is a later polish; using
//     theme primary is the shipping default.
//   - dark radial overlay via a second translucent gradient for depth
//   - photo FlatList (pagingEnabled) filling the 520 — zero photos still
//     renders the gradient so the layout doesn't collapse
//   - Stories progress bars (auto-advance 6s/photo, wraps to 0)
//   - Glass top controls: back, share stub, more stub
//   - Bottom overlay: title (30px) + optional location pill with MapPin
//   - Floating thumbnail strip overlapping the hero by -28px
//
// Bottom black→transparent linear overlay gives the white title enough
// contrast regardless of photo content (prototype L470).

const HERO_HEIGHT = 520;

type Photo = { id: string; url: string; filename: string };

type Props = {
  photos: Photo[];
  title: string;
  location: string | null;
  activeIndex: number;
  onIndexChange: (index: number) => void;
  onBack: () => void;
  onShare: () => void;
  onMore: () => void;
  onPhotoPress: (index: number) => void;
};

export function HeroGallery({
  photos,
  title,
  location,
  activeIndex,
  onIndexChange,
  onBack,
  onShare,
  onMore,
  onPhotoPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const c = useAppColors();
  const listRef = useRef<FlatList<Photo>>(null);

  const hasPhotos = photos.length > 0;

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / Math.max(width, 1));
      if (nextIndex !== activeIndex) onIndexChange(nextIndex);
    },
    [activeIndex, onIndexChange, width],
  );

  const handleThumbSelect = useCallback(
    (index: number) => {
      onIndexChange(index);
      listRef.current?.scrollToIndex({ index, animated: true });
    },
    [onIndexChange],
  );

  const handleAdvance = useCallback(() => {
    if (photos.length <= 1) return;
    const next = (activeIndex + 1) % photos.length;
    onIndexChange(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [activeIndex, onIndexChange, photos.length]);

  return (
    <View style={{ height: HERO_HEIGHT }} className="relative">
      {/* Base gradient — primary-soft → primary → primary-deep, diagonal */}
      <LinearGradient
        colors={[c.primarySoft, c.primary, c.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Photo pager */}
      {hasPhotos ? (
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => onPhotoPress(index)}
              accessibilityRole="imagebutton"
              accessibilityLabel={item.filename}
              style={{ width, height: HERO_HEIGHT }}
            >
              <Image
                source={{ uri: item.url }}
                resizeMode="cover"
                className="w-full h-full"
              />
            </Pressable>
          )}
        />
      ) : null}

      {/* Bottom darken overlay for title legibility — black → transparent */}
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 240 }}
        pointerEvents="none"
      />

      {/* Stories progress bars — top 4px below safe area */}
      <View
        className="absolute left-0 right-0 z-20"
        style={{ top: insets.top + 4 }}
        pointerEvents="none"
      >
        <StoriesProgressBar
          count={photos.length}
          activeIndex={activeIndex}
          onAdvance={handleAdvance}
        />
      </View>

      {/* Top controls row */}
      <View
        className="absolute left-0 right-0 z-20 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 14 }}
      >
        <GlassButton onPress={onBack} accessibilityLabel="Back">
          <ArrowLeft size={16} strokeWidth={2.4} color="#FFFFFF" />
        </GlassButton>
        <View className="flex-row gap-2">
          <GlassButton onPress={onShare} accessibilityLabel="Share">
            <Share2 size={15} strokeWidth={2.2} color="#FFFFFF" />
          </GlassButton>
          <GlassButton onPress={onMore} accessibilityLabel="More">
            <MoreHorizontal size={16} strokeWidth={2.4} color="#FFFFFF" />
          </GlassButton>
        </View>
      </View>

      {/* Bottom title + location — sits just above the -28px thumbnail overlap */}
      <View
        className="absolute left-0 right-0 bottom-10 z-10 px-5"
        pointerEvents="none"
      >
        <Text
          className="font-displayMedium text-white text-[30px] leading-[34px]"
          style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 20 }}
          numberOfLines={3}
        >
          {title}
        </Text>
        {location ? (
          <View className="flex-row items-center gap-1.5 mt-2.5">
            <MapPin size={11} strokeWidth={2} color="rgba(255,255,255,0.9)" />
            <Text className="font-body text-white/90 text-[12px]">{location}</Text>
          </View>
        ) : null}
      </View>

      {/* Floating thumbnail strip — overlaps hero bottom by -28px */}
      <ThumbnailStrip
        photos={photos}
        activeIndex={activeIndex}
        onSelect={handleThumbSelect}
      />
    </View>
  );
}
