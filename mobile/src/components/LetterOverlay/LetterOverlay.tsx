/**
 * LetterOverlay
 *
 * Full-screen overlay shown on app open when unread love letters exist.
 * - Swipeable list of letters (FlatList with pagingEnabled)
 * - Tap letter card → envelope flap opens (rotateX 0→180°) + content slides up
 * - Auto marks letter as READ via PATCH /api/love-letters/:id/mark-read
 * - Dismiss only available after all letters are read
 */

import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Heart, Mail, ChevronRight } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import type { LoveLetter } from '../../types';
import t from '../../locales/en';
import { useLetterOverlayViewModel } from './useLetterOverlayViewModel';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Envelope animation card ────────────────────────────────────────────────

interface LetterCardProps {
  letter: LoveLetter;
  isRead: boolean;
  onOpen: () => void;
}

function LetterCard({ letter, isRead, onOpen }: LetterCardProps) {
  const colors = useAppColors();
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);

  function handlePress() {
    if (isRead) return;
    // Letter content slides up + fades in
    contentOpacity.value = withSpring(1, { mass: 0.6, stiffness: 180, damping: 20 });
    contentTranslateY.value = withSpring(0, { mass: 0.6, stiffness: 180, damping: 20 });
    onOpen();
  }

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const senderName = letter.sender?.name ?? 'Your partner';

  return (
    <View
      className="items-center justify-center px-6"
      style={{ width: SCREEN_W }}
    >
      <Pressable onPress={handlePress} disabled={isRead} className="w-full" style={{ maxWidth: 360 }}>
        {/* Envelope body */}
        <View
          className="w-full rounded-3xl overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            shadowColor: 'rgba(232,120,138,0.3)',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 1,
            shadowRadius: 32,
            elevation: 12,
          }}
        >
          {/* Envelope flap */}
          <View>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' }}
            >
              <Mail size={36} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: '600',
                  marginTop: 10,
                  opacity: 0.9,
                  letterSpacing: 0.3,
                }}
              >
                {isRead ? '✓ Letter read' : t.letterOverlay.tapToOpen}
              </Text>
            </LinearGradient>
          </View>

          {/* Letter content */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 28 }}>
            {/* Sender info */}
            <View className="flex-row items-center gap-2 pt-5 pb-4 border-b" style={{ borderColor: colors.border }}>
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primaryMuted }}
              >
                <Heart size={14} color={colors.primary} fill={colors.primary} strokeWidth={0} />
              </View>
              <View>
                <Text style={{ fontSize: 10, color: colors.textLight, letterSpacing: 0.5 }}>
                  {t.letterOverlay.from.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textDark }}>
                  {senderName}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.textDark,
                marginTop: 16,
                marginBottom: 12,
                letterSpacing: -0.3,
              }}
            >
              {letter.title}
            </Text>

            {/* Content — slides up after tap */}
            <Animated.View style={contentStyle}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: SCREEN_H * 0.28 }}
              >
                <Text style={{ fontSize: 15, color: colors.textMid, lineHeight: 24 }}>
                  {letter.content}
                </Text>
              </ScrollView>

              {/* Mood tag */}
              {letter.mood ? (
                <View
                  className="self-start rounded-full px-3 py-1 mt-4"
                  style={{ backgroundColor: colors.primaryMuted }}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '500' }}>
                    {letter.mood}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ── Pagination dots ─────────────────────────────────────────────────────────

function PaginationDots({ total, current }: { total: number; current: number }) {
  const colors = useAppColors();
  if (total <= 1) return null;
  return (
    <View className="flex-row items-center justify-center gap-2 mt-5">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === current ? colors.primary : colors.primaryLighter,
          }}
        />
      ))}
    </View>
  );
}

// ── Main overlay ───────────────────────────────────────────────────────────

export default function LetterOverlay() {
  const colors = useAppColors();
  const vm = useLetterOverlayViewModel();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!vm.visible || !vm.unreadLetters) return null;

  const letters = vm.unreadLetters;
  const unreadCount = letters.length;
  const title = unreadCount === 1
    ? t.letterOverlay.title
    : t.letterOverlay.titlePlural.replace('{count}', String(unreadCount));

  function handleOpenLetter(letter: LoveLetter) {
    vm.markRead(letter.id);
  }

  function renderItem({ item }: ListRenderItemInfo<LoveLetter>) {
    return (
      <LetterCard
        letter={item}
        isRead={vm.readIds.has(item.id)}
        onOpen={() => handleOpenLetter(item)}
      />
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <LinearGradient
        colors={['#FFF0F4', '#FFF8F6', '#FFF8F6']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="items-center pt-4 pb-2 px-6">
            <View
              className="flex-row items-center gap-2 rounded-full px-4 py-2 mb-3"
              style={{ backgroundColor: colors.primaryMuted }}
            >
              <Mail size={14} color={colors.primary} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', letterSpacing: 0.3 }}>
                {title}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: colors.textDark,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              {unreadCount === 1 ? 'Someone wrote\nyou a letter 💌' : 'Love letters\nawaiting you 💌'}
            </Text>
          </View>

          {/* Swipeable letter list */}
          <FlatList
            ref={flatListRef}
            data={letters}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setCurrentIndex(idx);
            }}
            style={{ flexGrow: 0 }}
          />

          <PaginationDots total={letters.length} current={currentIndex} />

          {/* Hint text */}
          <View className="items-center mt-4 px-8">
            {vm.allRead ? (
              <Text style={{ fontSize: 13, color: colors.success, fontWeight: '600' }}>
                {t.letterOverlay.readAll}
              </Text>
            ) : (
              <Text style={{ fontSize: 12, color: colors.textLight, textAlign: 'center' }}>
                {t.letterOverlay.swipeHint}
              </Text>
            )}
          </View>

          {/* Dismiss CTA — only available after all read */}
          <View className="px-6 mt-4">
            <Pressable
              onPress={vm.allRead ? vm.dismiss : undefined}
              style={{ opacity: vm.allRead ? 1 : 0.4 }}
            >
              <LinearGradient
                colors={vm.allRead ? [colors.primary, colors.secondary] : ['#D0D0D0', '#C0C0C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  {t.letterOverlay.dismiss}
                </Text>
                <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
}
