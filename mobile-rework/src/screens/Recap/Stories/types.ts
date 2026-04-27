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
      // Sprint 67 D1 — collage support. 1 photo = single full-bleed, 2-3 =
      // tilted stack, 4+ = 2x2 collage. Falls back to hero gradient when
      // empty.
      bgPhotoUrls?: string[];
      kicker: string;             // 'RECAP · Tháng 3, 2026' / 'RECAP · Tuần 17, 21-27 thg 4'
      titleLine1: string;         // 'Tuần này' / 'Tháng 3'
      titleLine2: string;         // 'của mình' / '2026'
      coupleNamesScript: string;  // 'Hùng & Như'
      people: [StoriesPerson, StoriesPerson];
      scrollHint?: string;        // optional "chạm để xem tiếp"
    }
  | {
      kind: 'stat';
      // Sprint 67 D1 — backdrop = 3x3 grid of dim photos behind the
      // number. `bgPhotoUrls` overrides single `bgPhotoUrl`. Empty = the
      // gradient fallback.
      bgPhotoUrls?: string[];
      value: number | string;     // 48 → counts up; '2.1k' → renders literal
      label: string;              // 'KHOẢNH KHẮC'
      tone: 'primary' | 'secondary' | 'accent';
      sub?: string;               // optional caption under label
    }
  | {
      kind: 'topMoment';
      momentId: string;
      // Sprint 67 D1 — primary photo + filmstrip thumbnails. The primary
      // (`bgPhotoUrl`) goes full-bleed Ken Burns; `filmstrip` shows a
      // bottom strip of up to 5 thumbnails. Falls back gracefully if
      // filmstrip is empty.
      bgPhotoUrl: string;
      filmstrip?: string[];
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
      // Sprint 67 D1 — Polaroid-stack support. Each place can carry up to
      // 3 photos for a tilted fanned layout; cells with `photos` empty
      // fall back to a soft gradient placeholder.
      thumbnails: { name: string; photos: string[] }[]; // up to 4 cells
    }
  | {
      kind: 'firsts';
      firstId: string;
      bgPhotoUrl?: string;        // primary photo behind text
      // Sprint 67 D1 — 2-3 corner mosaic thumbnails next to the main.
      mosaic?: string[];
      sticker: string;            // '🎉'
      kicker: string;             // 'Lần đầu của mình'
      title: string;              // moment title
    }
  | {
      // Sprint 67 D8 — replaces the per-letter slide pattern (Sprint 67
      // D2 → D7) with one consolidated slide that vertically stacks
      // ALL letters in a single PaperSheet ScrollView. Boss intent
      // 2026-04-27: "phải hiển thị TOÀN BỘ mấy cái lá thư" — all
      // letters together, read-style, in one place.
      kind: 'lettersCollection';
      kicker: string;             // 'THƯ TÌNH · {{count}}'
      headline: string;           // 'Mình viết cho nhau'
      ctaLabel: string;           // 'Đọc lại trong Inbox'
      letters: {
        id: string;
        kicker: string;           // 'Từ Hùng · 22.04'
        title: string;
        content: string;          // full body (BE field, D7)
        senderName: string;
        thumb?: string;           // first letter photo if any
      }[];
    }
  | {
      kind: 'topQuestion';
      text: string;               // wrapped in “”
      meta: string;               // 'Mình đã hỏi nhau 4 lần trong tháng'
      initialA: string;
      initialB: string;
    }
  | {
      kind: 'photoReel';          // Sprint 67 D1 — full-screen 3x3 mosaic
      headline: string;           // 'Cả tháng / tuần qua một lần nữa'
      caption: string;            // '12 trong 48 ảnh' / similar
      photos: string[];           // up to 9
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
