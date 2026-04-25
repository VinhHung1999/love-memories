import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import type { LetterRow } from '@/api/letters';
import { paletteFor, PAL_GRADIENTS } from '../palette';

// T421 (Sprint 65) — hero envelope card for the FIRST letter in Inbox / Sent
// tabs. Mirrors prototype `letters.jsx` L141-227 1:1:
//
//   • 160px header — linear gradient @135° from PAL_GRADIENTS[palette]
//   • mood stamp top-right (52×52, rotate 8°, near-white surface)
//   • unread pulse pill top-left when status === 'DELIVERED' (recipient hasn't
//     opened yet; READ + SCHEDULED + DRAFT never render this pill)
//   • Dancing Script "Gửi {recipientName}," bottom-left, on the gradient
//   • body card — 22px mini-avatar of the sender (gradient initial OR real
//     avatar) + senderName + ago, display title 22px, 2-line preview clamp,
//     primary "Chạm để mở →" CTA hint
//
// Q3 (Lu approved): recipientName = currentUserName for Inbox (you are the
// recipient), partnerName for Sent/Drafts/Scheduled.
// Q5 (Lu approved): mini-avatar = sender's avatar/initial; falls back to a
// gradient-initial chip when no avatar URL.

type Props = {
  letter: LetterRow;
  recipientDisplayName: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  agoLabel: string;
  unreadPillLabel: string;
  ctaLabel: string;
  greetingPrefix: string; // e.g. "Gửi" / "Dear"
  onPress: () => void;
};

export function LetterHeroCard({
  letter,
  recipientDisplayName,
  senderDisplayName,
  senderAvatarUrl,
  agoLabel,
  unreadPillLabel,
  ctaLabel,
  greetingPrefix,
  onPress,
}: Props) {
  const c = useAppColors();
  const palette = paletteFor(letter);
  const grad = PAL_GRADIENTS[palette];
  const isUnread = letter.status === 'DELIVERED';

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isUnread) return;
    pulse.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isUnread, pulse]);

  const senderInitial =
    senderDisplayName.trim().charAt(0).toUpperCase() || '·';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // D64-redo4 (Sprint 65 Build 91 hot-fix): shadow-card restored.
      // Boss clarified the "lụm" wasn't the hero shadow at all — it was
      // the ScrollView itself flashing over the TabsBar during the brute
      // `key={activeTab}` remount (D64-redo2). The shadow was a wrong
      // suspect; re-adding so the card keeps the soft elevation that
      // separates it from the bg gradient on the Sent tab's lighter
      // palettes (butter / mint).
      className="rounded-[26px] overflow-hidden bg-surface border border-line-on-surface shadow-card mb-3.5 active:opacity-90"
    >
      <LinearGradient
        colors={grad as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-[160px]"
      >
        {letter.mood ? (
          <View className="absolute top-3.5 right-3.5 w-[52px] h-[52px] rounded-xl bg-white/95 items-center justify-center shadow-card rotate-[8deg]">
            <Text className="text-[22px] leading-[24px]">{letter.mood}</Text>
            <Text className="font-bodyBold text-ink-mute text-[7px] tracking-[0.6px] uppercase mt-px">
              MEMOURA
            </Text>
          </View>
        ) : null}

        {isUnread ? (
          <View
            className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full flex-row items-center"
            style={{ backgroundColor: c.primary }}
          >
            <Animated.View
              className="w-1.5 h-1.5 rounded-full bg-white"
              style={{ opacity: pulse, marginRight: 6 }}
            />
            <Text className="font-bodyBold text-white text-[10px] tracking-[1px] uppercase">
              {unreadPillLabel}
            </Text>
          </View>
        ) : null}

        <View className="absolute bottom-3.5 left-4">
          <Text className="font-script text-white/90 text-[24px] leading-[26px]">
            {greetingPrefix} {recipientDisplayName},
          </Text>
        </View>
      </LinearGradient>

      <View className="px-5 py-5">
        <View className="flex-row items-center gap-2 mb-1.5">
          <View className="w-[22px] h-[22px] rounded-full overflow-hidden">
            {senderAvatarUrl ? (
              <Image
                source={{ uri: senderAvatarUrl }}
                resizeMode="cover"
                className="w-full h-full"
              />
            ) : (
              <LinearGradient
                colors={[c.secondary, c.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-full items-center justify-center"
              >
                <Text className="font-bodyBold text-white text-[10px] leading-[12px]">
                  {senderInitial}
                </Text>
              </LinearGradient>
            )}
          </View>
          <Text className="font-bodySemibold text-ink-soft text-[12px]">
            {senderDisplayName} · {agoLabel}
          </Text>
        </View>

        {/* D65 (Sprint 65 Build 86 hot-fix): the BE Zod schema requires
            title.min(1), so the Compose flow seeds a single-space
            placeholder and the user can ship a letter without ever
            typing a title. Treat that as "use the greeting" — render
            the Dancing Script "Gửi {recipient}" line in the title slot
            instead of an empty display row. */}
        {letter.title.trim().length > 0 ? (
          <Text
            className="font-displayMedium text-ink text-[22px] leading-[26px]"
            numberOfLines={2}
          >
            {letter.title}
          </Text>
        ) : (
          <Text
            className="font-script text-ink text-[26px] leading-[30px]"
            numberOfLines={1}
          >
            {greetingPrefix} {recipientDisplayName},
          </Text>
        )}

        {letter.content.trim().length > 0 ? (
          <Text
            className="font-body text-ink-soft text-[13px] leading-[19px] mt-1.5"
            numberOfLines={2}
          >
            {letter.content}
          </Text>
        ) : null}

        <Text className="font-bodySemibold text-primary text-[11px] mt-3">
          {ctaLabel}
        </Text>
      </View>
    </Pressable>
  );
}
