// Sprint 67 D4 — Shared paper-cream sheet used by all 4 letter slide
// variants. Lifts the look of LetterReadScreen's PaperCard (cream
// `#FDFAF5` + horizontal notebook rules every 28px) so each Stories
// letter slide reads as a real letter — Boss's D4 feedback "sao nó
// trắng tinh à, phải đề nhiều nhiều cái format giấy trắng giống lúc
// read vào". Centralised so all 4 variants stay in lockstep when the
// paper recipe changes.
//
// D5 (2026-04-27) — body Text used to live inside a `PaperBody` helper
// that took a `bodyClassName` param. NativeWind v4 silently dropped the
// templated className (`font-body ${bodyClassName}`) so excerpts
// rendered with no font/size/leading and were invisible against the
// cream paper. **Static className strings only** — each variant inlines
// its own body Text + signature Text rather than passing classes
// through a wrapper. Same lesson as Sprint 61 AuthField crash:
// NativeWind v4 needs literal class strings at the JSX site.
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

// Dancing-Script signature line — the ONE shared bit kept as a helper
// because every variant draws it identically (rotate -3°, primaryDeep
// ink). Body excerpt stays inline at the variant call-site so each
// variant can size its own font without passing dynamic className
// strings through this helper (NW v4 silently drops them).
type SignatureProps = {
  senderName: string;
  signaturePrefix?: string;
};

export function PaperSignature({ senderName, signaturePrefix = '—' }: SignatureProps) {
  return (
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
  );
}
