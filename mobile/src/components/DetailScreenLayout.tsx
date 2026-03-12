import React, { ReactNode } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppColors } from '../navigation/theme';
import OverlayHeader from './OverlayHeader';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DetailScreenLayoutProps {
  /** Screen/item title — shown in cover and faded into OverlayHeader on scroll */
  title: string;
  /** Optional line shown above title in cover (e.g. formatted date for PlanDetail) */
  coverSubtitle?: string;
  /** Cover photo URL. If absent, renders fallbackGradient instead */
  coverImageUri?: string;
  /** Two-stop gradient for when there's no cover photo.
   *  Default: [primary+'22', primary+'08'] */
  fallbackGradient?: [string, string];
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Screen-specific body — rendered inside the white rounded-t-3xl content card */
  children: ReactNode;
}

// Absolute-fill shorthand (reused for FastImage + LinearGradient)
const FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

// ── Component ─────────────────────────────────────────────────────────────────

export default function DetailScreenLayout({
  title,
  coverSubtitle,
  coverImageUri,
  fallbackGradient,
  onBack,
  onEdit,
  onDelete,
  children,
}: DetailScreenLayoutProps) {
  const colors = useAppColors();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const gradient: [string, string] = fallbackGradient ?? [
    colors.primary + '22',
    colors.primary + '08',
  ];

  return (
    <View className="flex-1 bg-white">
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Full-bleed cover (280px) ── */}
        <View style={{ height: 280 }}>
          {coverImageUri ? (
            <>
              {/* Photo */}
              <FastImage
                source={{ uri: coverImageUri, priority: FastImage.priority.high }}
                style={FILL}
                resizeMode={FastImage.resizeMode.cover}
              />
              {/* Scrim: subtle top darkening + stronger bottom for title readability */}
              <LinearGradient
                colors={['rgba(0,0,0,0.28)', 'transparent', 'rgba(0,0,0,0.52)']}
                locations={[0, 0.38, 1]}
                style={FILL}
              />
            </>
          ) : (
            /* Gradient fallback when no photo */
            <LinearGradient colors={gradient} style={FILL} />
          )}

          {/* Title block: optional subtitle above, title below — pinned to cover bottom */}
          <View
            style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}
          >
            {coverSubtitle ? (
              <Text
                className="font-semibold mb-1.5"
                style={{
                  fontSize: 13,
                  color: coverImageUri ? 'rgba(255,255,255,0.85)' : colors.primary,
                }}
                numberOfLines={1}
              >
                {coverSubtitle}
              </Text>
            ) : null}
            <Text
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: coverImageUri ? '#FFFFFF' : '#2D2D2D',
                lineHeight: 32,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        </View>

        {/* ── Content card (slides up 24px over cover, rounded top corners) ── */}
        <View className="bg-white rounded-t-3xl -mt-6">
          {children}
        </View>
      </Animated.ScrollView>

      {/* Floating overlay header — transparent → white, fade driven by scrollY */}
      <OverlayHeader
        scrollY={scrollY}
        title={title}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </View>
  );
}
