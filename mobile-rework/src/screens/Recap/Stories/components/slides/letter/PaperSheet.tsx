// Sprint 67 D4 — Shared paper-cream sheet used by all 4 letter slide
// variants. Lifts the look of LetterReadScreen's PaperCard (cream
// `#FDFAF5` + horizontal notebook rules every 28px) so each Stories
// letter slide reads as a real letter — Boss's D4 feedback "sao nó
// trắng tinh à, phải đề nhiều nhiều cái format giấy trắng giống lúc
// read vào". Centralised so all 4 variants stay in lockstep when the
// paper recipe changes.
//
// Carve-out from "no `style` prop" rule: the cream colour + line ink
// are not theme-derived (paper is its own visual identity, doesn't
// flip in dark mode — matches PaperCard precedent), and absolute-
// positioned 1-pixel rules for the rules need explicit pixel `top`.

import { Text, View } from 'react-native';

const PAPER_BG = '#FDFAF5';
const PAPER_LINE = 'rgba(42,26,30,0.06)';
export const PAPER_INK = '#2A1A1E';
export const PAPER_INK_SOFT = 'rgba(42,26,30,0.72)';
export const PAPER_INK_MUTE = 'rgba(42,26,30,0.55)';
export const PAPER_SIGNATURE_INK = '#8E1F34'; // Evolve light primaryDeep

const LINE_GAP = 28;

type Props = {
  children: React.ReactNode;
  // Approximate height in px so we render enough horizontal rules to
  // fill the sheet without leaving the bottom blank. Defaults to 360
  // (~13 lines) which covers a typical excerpt + signature block.
  approxHeight?: number;
  // Tailwind classes applied to the outer card. Lets each variant
  // pick its own corner radius / margins / shadow / rotate-wrapper
  // strategy without rewriting the lined-paper guts.
  className?: string;
};

export function PaperSheet({ children, approxHeight = 360, className }: Props) {
  const lineCount = Math.ceil(approxHeight / LINE_GAP) + 2;
  return (
    <View
      className={`overflow-hidden ${className ?? ''}`}
      style={{ backgroundColor: PAPER_BG }}
    >
      {/* Notebook horizontal rules — stacked Views since RN can't render a
          repeating-linear-gradient. */}
      <View pointerEvents="none" className="absolute inset-0">
        {Array.from({ length: lineCount }).map((_, i) => (
          <View
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{ top: i * LINE_GAP + 27, backgroundColor: PAPER_LINE }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

// Shared paper-body block: excerpt body in readable body font + Dancing-
// Script signature. Variants compose this inside their `PaperSheet` so
// all 4 read like the same hand-written letter.
type BodyProps = {
  /** The 100-200 char excerpt — kept in readable body font. */
  excerpt: string;
  /** Sender name for the signature line. */
  senderName: string;
  /** "—" signature dash prefix. */
  signaturePrefix?: string;
  /** Override line-clamp (default 8). */
  numberOfLines?: number;
  /** Override body font size class — default `text-[15px] leading-[24px]`. */
  bodyClassName?: string;
};

export function PaperBody({
  excerpt,
  senderName,
  signaturePrefix = '—',
  numberOfLines = 8,
  bodyClassName = 'text-[15px] leading-[24px]',
}: BodyProps) {
  return (
    <>
      <Text
        className={`font-body ${bodyClassName}`}
        style={{ color: PAPER_INK }}
        numberOfLines={numberOfLines}
      >
        {excerpt}
      </Text>
      <Text
        className="mt-4 font-script text-[28px] leading-[32px]"
        style={{
          color: PAPER_SIGNATURE_INK,
          transform: [{ rotate: '-3deg' }],
          alignSelf: 'flex-start',
        }}
      >
        {signaturePrefix} {senderName}
      </Text>
    </>
  );
}
