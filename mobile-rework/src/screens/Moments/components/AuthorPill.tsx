import { Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

// T387 — "by Partner" pill per prototype moments2.jsx L355-376.
// Sits top-left on the cover photo / hero gradient so the reader can tell
// at a glance who logged the moment. Gradient variant flips based on whose
// moment this is:
//   currentUserId === author.id  →  heroA → heroB   (warm / "me")
//   else                         →  secondary → primary  (accent / "partner")
// Name is the author display name; initial is the uppercase first letter.

type Props = {
  authorId: string;
  authorName: string;
  currentUserId: string | null;
};

export function AuthorPill({ authorId, authorName, currentUserId }: Props) {
  const c = useAppColors();
  const isSelf = currentUserId !== null && currentUserId === authorId;
  const gradientColors: readonly [string, string] = isSelf
    ? [c.heroA, c.heroB]
    : [c.secondary, c.primary];

  const initial = authorName.trim().charAt(0).toUpperCase() || '·';

  return (
    // D37 (Sprint 64 Build 74): was `bg-white/[0.92]` which kept the pill
    // white in dark mode and made the dark `text-ink` content melt into the
    // pill on a dark-photo cover. Switch to `bg-surface/[0.92]` so the pill
    // fill tracks the theme (near-white in light mode, dark charcoal in
    // dark mode) — `text-ink` on `surface` has the right contrast in both.
    // The inner 20×20 gradient initial badge stays white-on-gradient since
    // the LinearGradient uses brand tokens that work against any theme.
    <View className="flex-row items-center gap-1.5 rounded-full bg-surface/[0.92] shadow-chip pl-[5px] pr-2.5 py-[5px]">
      <LinearGradient
        colors={gradientColors as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-5 h-5 rounded-full items-center justify-center"
      >
        <Text className="font-bodyBold text-white text-[10px] leading-[12px]">
          {initial}
        </Text>
      </LinearGradient>
      <Text
        numberOfLines={1}
        className="font-bodySemibold text-ink text-[11px] leading-[14px]"
      >
        {authorName}
      </Text>
    </View>
  );
}
