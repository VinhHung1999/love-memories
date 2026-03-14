import React, { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Heading, Label } from './Typography';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppColors } from '../navigation/theme';
import OverlayHeader from './OverlayHeader';
import { Heart, LucideIcon } from 'lucide-react-native';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DetailScreenLayoutProps {
  /** Screen/item title — shown in cover and faded into OverlayHeader on scroll */
  title: string;
  /** Optional line shown above title in cover (e.g. formatted date for PlanDetail) */
  coverSubtitle?: string;
  /** Cover photo URL. If absent, renders fallbackGradient instead */
  coverImageUri?: string;
  icon: LucideIcon;
  /** Two-stop gradient for when there's no cover photo.
   *  Default: [primary+'22', primary+'08'] */
  fallbackGradient?: [string, string];
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onHeroPress?: () => void;
  /** Screen-specific body — rendered inside the white rounded-t-3xl content card */
  children: ReactNode;
}

// Absolute-fill shorthand (reused for FastImage + LinearGradient)
const FILL = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

// OverlayHeader fade range: header fades in AFTER cover title scrolls away
const FADE_START = 160;
const FADE_END = 240;

// ── Component ─────────────────────────────────────────────────────────────────

export default function DetailScreenLayout({
  title,
  coverSubtitle,
  coverImageUri,
  fallbackGradient,
  onBack,
  icon: Icon = Heart,
  onEdit,
  onDelete,
  onHeroPress,
  children,
}: DetailScreenLayoutProps) {
  const colors = useAppColors();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => {
    const offset = Math.min(0, scrollY.value);
    return {
      position: 'absolute',
      top: offset,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const gradient: [string, string] = fallbackGradient ?? [
    colors.primary + '22',
    colors.primary + '08',
  ];

  // ScrollView background: dark behind cover (upward over-scroll), white below content
  const scrollBg = coverImageUri ? '#1A1624' : gradient[0];

  return (
    <View className="flex-1 bg-white">
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: scrollBg, flexGrow: 1 }}
      >
        {/* ── Full-bleed cover (280px) ── */}
        <Pressable onPress={onHeroPress} disabled={!onHeroPress}>
        <View style={{ height: 280 }}>
          {coverImageUri ? (
            <Animated.View style={heroStyle}>
              {/* Photo */}
              <FastImage
                source={{
                  uri: coverImageUri,
                  priority: FastImage.priority.high,
                }}
                style={FILL}
                resizeMode={FastImage.resizeMode.cover}
              />
              {/* Cinematic scrim: dark top (status bar) → clear middle → dark bottom (title) */}
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.12)',
                  'rgba(0,0,0,0.00)',
                  'rgba(0,0,0,0.00)',
                  'rgba(0,0,0,0.58)',
                ]}
                locations={[0, 0.3, 0.55, 1]}
                style={FILL}
              />
            </Animated.View>
          ) : (
            /* Gradient fallback when no photo */
            <>
              <LinearGradient colors={gradient} style={FILL} />
              <View
                className="w-full items-center justify-center bg-primary/10"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                <Icon size={32} color={colors.primary} strokeWidth={1.5} />
              </View>
            </>
          )}

          {/* Title block: optional subtitle above, title below — pinned to cover bottom */}
          <View
            style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}
          >
            {coverSubtitle ? (
              <Label
                className="font-semibold mb-1.5"
                style={{
                  fontSize: 13,
                  color: coverImageUri
                    ? 'rgba(255,255,255,0.85)'
                    : colors.primary,
                }}
                numberOfLines={1}
              >
                {coverSubtitle}
              </Label>
            ) : null}
            <Heading
              size="lg"
              style={{
                fontSize: 26,
                color: coverImageUri ? '#FFFFFF' : '#2D2D2D',
                lineHeight: 33,
                letterSpacing: -0.3,
              }}
              numberOfLines={2}
            >
              {title}
            </Heading>
          </View>
        </View>
        </Pressable>

        {/* ── Content card (slides up 24px over cover, rounded top corners) ── */}
        <View className="bg-white rounded-t-3xl -mt-6" style={{height: "100%"}}>
          {/* Drag pill — bottom-sheet affordance */}
          <View className="items-center pt-3 pb-1">
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#F0E6E3',
              }}
            />
          </View>
          {children}
        </View>
      </Animated.ScrollView>

      {/* Floating overlay header — transparent → white, fades after title scrolls away */}
      <OverlayHeader
        scrollY={scrollY}
        title={title}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
        fadeStart={FADE_START}
        fadeEnd={FADE_END}
      />
    </View>
  );
}
