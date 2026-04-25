import { Pencil } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import type { LetterRow as LetterRowType } from '@/api/letters';
import { paletteFor, PAL_GRADIENTS } from '../palette';

// T421 (Sprint 65) — compact letter row used for non-hero items in Inbox /
// Sent, and for ALL items in Scheduled / Drafts. Prototype `letters.jsx`
// L230-258. Layout:
//
//   [44×44 mood-gradient tile] [title + 1-line preview]   [trailing time]
//
// `draftMode` (Lu approved Q4) prefixes a "Nháp" chip to the title row and
// renders an edit pencil in the trailing slot to make tap-to-edit obvious.

type Props = {
  letter: LetterRowType;
  trailingLabel: string;
  draftMode?: boolean;
  draftChipLabel?: string;
  // D68 (Sprint 65 Build 92 hot-fix): when the letter shipped with the
  // single-space title placeholder (Compose ships drafts via the BE Zod
  // min(1) bypass), the row used to render an empty title slot. Mirror
  // D65 in LetterHeroCard / PaperCard — fall back to the Dancing
  // Script "Gửi {recipientName}," greeting. Caller resolves the right
  // name (Inbox → currentUser, Sent → partner, Drafts → partner).
  greetingPrefix: string;
  recipientDisplayName: string;
  onPress: () => void;
};

export function LetterRow({
  letter,
  trailingLabel,
  draftMode,
  draftChipLabel,
  greetingPrefix,
  recipientDisplayName,
  onPress,
}: Props) {
  const c = useAppColors();
  const palette = paletteFor(letter);
  const grad = PAL_GRADIENTS[palette];
  const moodGlyph = letter.mood ?? '✉️';
  const titleIsEmpty = letter.title.trim().length === 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-3.5 py-3.5 rounded-2xl bg-surface border border-line-on-surface mb-2 active:opacity-90"
    >
      <LinearGradient
        colors={grad as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-11 h-11 rounded-[10px] items-center justify-center"
      >
        <Text className="text-[20px] leading-[22px]">{moodGlyph}</Text>
      </LinearGradient>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          {draftMode && draftChipLabel ? (
            <View className="px-1.5 py-0.5 rounded-[6px] bg-accent-soft">
              <Text className="font-bodyBold text-accent text-[9px] tracking-[0.5px] uppercase">
                {draftChipLabel}
              </Text>
            </View>
          ) : null}
          {titleIsEmpty ? (
            <Text
              numberOfLines={1}
              className="flex-1 font-script text-ink text-[18px] leading-[20px]"
            >
              {greetingPrefix} {recipientDisplayName},
            </Text>
          ) : (
            <Text
              numberOfLines={1}
              className="flex-1 font-displayMedium text-ink text-[15px] leading-[18px]"
            >
              {letter.title}
            </Text>
          )}
        </View>
        {letter.content ? (
          <Text
            numberOfLines={1}
            className="font-body text-ink-mute text-[12px] leading-[16px] mt-0.5"
          >
            {letter.content}
          </Text>
        ) : null}
      </View>

      {draftMode ? (
        <Pencil size={14} strokeWidth={2.2} color={c.inkMute} />
      ) : (
        <Text className="font-body text-ink-mute text-[11px] ml-1">
          {trailingLabel}
        </Text>
      )}
    </Pressable>
  );
}
