// Sprint 67 T459 — Slide discriminated union for the Stories shell.
//
// The shell takes `slides: Slide[]` and renders the right slide variant
// per the `kind` discriminator. T460 composes these from real BE data;
// T459 ships only the rendering primitives + a demo route with mock
// data so Boss can preview the look before wiring.
//
// Skip rules: T460 omits letter / topQuestion slides entirely when the
// underlying BE field is null, so the user never sees an empty Letter
// or empty Question slide.

import type { PaletteKey } from '@/theme/palettes';

export type StoriesPerson = { initial: string; gradientKey: 'A' | 'B' };

export type Slide =
  | {
      kind: 'cover';
      bgPhotoUrl?: string;        // optional photo full-bleed; falls back to hero gradient
      kicker: string;             // 'RECAP · Tháng 3, 2026' / 'RECAP · Tuần 17, 21-27 thg 4'
      titleLine1: string;         // 'Tuần này' / 'Tháng 3'
      titleLine2: string;         // 'của mình' / '2026'
      coupleNamesScript: string;  // 'Hùng & Như'
      people: [StoriesPerson, StoriesPerson];
      scrollHint?: string;        // optional "chạm để xem tiếp"
    }
  | {
      kind: 'stat';
      bgPhotoUrl?: string;        // dim 40% behind the number
      value: number | string;     // 48 → counts up; '2.1k' → renders literal
      label: string;              // 'KHOẢNH KHẮC'
      tone: 'primary' | 'secondary' | 'accent';
      sub?: string;               // optional caption under label
    }
  | {
      kind: 'topMoment';
      momentId: string;
      bgPhotoUrl: string;         // full-bleed
      rank: 1 | 2 | 3;
      title: string;
      sub: string;                // 'Đà Lạt · 12 ảnh · 6 tim'
      palette: PaletteKey;        // accent gradient on rank chip
      ctaLabel: string;           // 'Xem chi tiết'
    }
  | {
      kind: 'places';
      headline: string;           // 'Mình đã đến 4 nơi'
      caption: string;            // '6 địa điểm tháng này'
      thumbnails: { name: string; photoUrl?: string }[]; // up to 4 collage
    }
  | {
      kind: 'firsts';
      firstId: string;
      bgPhotoUrl?: string;
      sticker: string;            // '🎉'
      kicker: string;             // 'Lần đầu của mình'
      title: string;              // moment title
    }
  | {
      kind: 'letter';
      letterId: string;
      kicker: string;             // 'Từ Hùng · 22.04'
      title: string;
      excerpt: string;
      ctaLabel: string;           // 'Đọc lại'
    }
  | {
      kind: 'topQuestion';
      text: string;               // wrapped in “”
      meta: string;               // 'Mình đã hỏi nhau 4 lần trong tháng'
      initialA: string;
      initialB: string;
    }
  | {
      kind: 'closing';
      title: string;              // 'Cảm ơn Hùng\nvì tháng này.'
      body: string;
      signature: string;          // 'Hùng & Như · Tháng 3, 2026'
      initialA: string;
      initialB: string;
    }
  | {
      kind: 'actionsTray';        // T461
      saveLabel: string;
      shareLabel: string;
      detailLabel: string;
      onSave: () => void;
      onShare: () => void;
      onDetail: () => void;
    };

export type SlideKind = Slide['kind'];
