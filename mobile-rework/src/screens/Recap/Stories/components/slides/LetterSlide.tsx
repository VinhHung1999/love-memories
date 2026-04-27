// Sprint 67 T459 + D2 — Letter slide router. 4 visual variants cycled
// per letter id (composer assigns from id-hash). All variants share:
//   • kicker line (sender + delivered date)
//   • title (display)
//   • excerpt (5-6 lines, BE-trimmed to 200 chars)
//   • "Re-read it" pill → router.push to /letter-read?id=letterId
//
// Variants:
//   • classic — paper texture + rotated wax-seal heart corner
//   • polaroid — small thumbnail photo on top + signature underneath
//   • envelope — wide stamp corner + tear-edge bottom + airmail strip
//   • postcard — horizontal 2-col layout (text left, thumb right)

import { useRouter } from 'expo-router';
import type { Slide } from '../../types';
import { LetterClassic } from './letter/LetterClassic';
import { LetterEnvelope } from './letter/LetterEnvelope';
import { LetterPolaroid } from './letter/LetterPolaroid';
import { LetterPostcard } from './letter/LetterPostcard';

type LetterSlide = Extract<Slide, { kind: 'letter' }>;

type Props = { slide: LetterSlide };

export function LetterSlide({ slide }: Props) {
  const router = useRouter();
  const onOpen = () => {
    router.push({ pathname: '/letter-read', params: { id: slide.letterId } });
  };
  switch (slide.variant) {
    case 'polaroid':
      return <LetterPolaroid slide={slide} onOpen={onOpen} />;
    case 'envelope':
      return <LetterEnvelope slide={slide} onOpen={onOpen} />;
    case 'postcard':
      return <LetterPostcard slide={slide} onOpen={onOpen} />;
    case 'classic':
    default:
      return <LetterClassic slide={slide} onOpen={onOpen} />;
  }
}
