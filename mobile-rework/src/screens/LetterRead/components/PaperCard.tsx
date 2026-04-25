import { Text, View } from 'react-native';

import type { LetterRow } from '@/api/letters';

import { AudioInline } from './AudioInline';
import { PhotoStackPreview } from './PhotoStackPreview';

// T422 (Sprint 65) — the paper card itself. Cream-colored notebook stock
// (`#FDFAF5`) with horizontal repeating lines every 28px (achieved with a
// stack of <View> dividers — RN doesn't support repeating-linear-gradient
// natively). Mood stamp top-right, display title, body whitespace-pre-line,
// Dancing Script signature rotated -3°, optional photo stack + audio.
//
// Per spec the paper card uses fixed cream + dark-ink text regardless of
// theme — the cream sheet is the visual identity, not a theme surface.
// In dark mode the paper still reads cream (correct, intentional). The
// surrounding scrollable bg fades into the theme bg below the card.
//
// Prototype `letters.jsx` L344-394.

const PAPER_BG = '#FDFAF5';
const PAPER_INK = '#2A1A1E';
const PAPER_LINE = 'rgba(42,26,30,0.06)';
const PAPER_DASH = 'rgba(42,26,30,0.2)';
const SIGNATURE_INK = '#8E1F34'; // Evolve light primaryDeep — warm ink

const LINE_GAP = 28;
const LINE_COUNT = 32; // covers ~900px of card height; trims via overflow-hidden

type Props = {
  letter: LetterRow;
  signaturePrefix: string; // "—" before the signature
};

export function PaperCard({ letter, signaturePrefix }: Props) {
  return (
    <View
      className="mt-6 mx-5 rounded-[20px] px-6 pt-7 pb-6 shadow-elevated overflow-hidden"
      style={{ backgroundColor: PAPER_BG }}
    >
      {/* Notebook horizontal lines — stacked Views since RN can't render a
          repeating-linear-gradient. Each line at i*28+27 px from top. */}
      <View pointerEvents="none" className="absolute inset-0">
        {Array.from({ length: LINE_COUNT }).map((_, i) => (
          <View
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{ top: i * LINE_GAP + 27, backgroundColor: PAPER_LINE }}
          />
        ))}
      </View>

      {letter.mood ? (
        <View
          className="absolute -top-3.5 right-5 w-12 h-12 rounded-[10px] items-center justify-center shadow-card"
          style={{
            backgroundColor: PAPER_BG,
            transform: [{ rotate: '6deg' }],
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: PAPER_DASH,
          }}
        >
          <Text className="text-[22px] leading-[24px]">{letter.mood}</Text>
        </View>
      ) : null}

      <Text
        className="font-displayMedium text-[26px] leading-[30px] mb-4"
        style={{ color: PAPER_INK }}
      >
        {letter.title}
      </Text>

      <Text
        className="font-body text-[15px] leading-[24px]"
        style={{ color: PAPER_INK }}
      >
        {letter.content}
      </Text>

      <Text
        className="font-script text-[36px] leading-[40px] mt-5"
        style={{
          color: SIGNATURE_INK,
          transform: [{ rotate: '-3deg' }],
          alignSelf: 'flex-start',
        }}
      >
        {signaturePrefix} {letter.sender.name ?? ''}
      </Text>

      {letter.photos.length > 0 ? (
        <PhotoStackPreview photos={letter.photos} />
      ) : null}

      {letter.audio[0] ? (
        <AudioInline
          audioUrl={letter.audio[0].url}
          durationSeconds={letter.audio[0].duration}
        />
      ) : null}
    </View>
  );
}
