// Sprint 67 T460 — Pure composer: MonthlyRecapResponse + couple data
// → Slide[] for the Stories shell.
//
// Skip rules (per spec):
//   • letter slide skipped when data.letterHighlight === null
//   • topQuestion slide skipped when data.topQuestion === null
//   • firsts slide skipped when data.firsts is empty
//   • places slide skipped when data.places is empty
//   • topMoment slide skipped when data.topMoments is empty
// The cover + by-numbers stat trio + closing + actionsTray always
// render (closing is decorative, actionsTray gates the user out).
//
// Photo selection: cover bg falls back to topMoments[0].thumbnail; stat
// slides reuse other moment thumbnails for visual variety.

import type { Slide, StoriesPerson } from './types';
import type { MonthlyRecapResponse } from '../types';
import { describeMonth, nameInitial } from '../utils';

export type MonthlyComposeContext = {
  data: MonthlyRecapResponse;
  monthStr: string;
  isVi: boolean;
  user: { name: string | null } | null;
  partner: { name: string | null } | null;
  // Localised label functions (caller passes t() bindings so the
  // composer stays test-friendly without an i18n dep).
  labels: {
    coverScrollHint: string;       // 'chạm để xem tiếp'
    statMoments: string;           // 'KHOẢNH KHẮC'
    statLetters: string;           // 'THƯ TÌNH'
    statPhotos: string;            // 'ẢNH ĐÃ LƯU'
    statSubMoments?: string;       // optional caption
    topMomentCta: string;          // 'Xem chi tiết'
    placesHeadline: (count: number) => string;
    placesCaption: (count: number) => string;
    firstsKicker: string;          // 'Lần đầu của mình'
    // D8 — LettersCollection slide labels (replaces per-letter labels).
    lettersCollectionKicker: (count: number) => string; // 'THƯ TÌNH · 4 lá'
    lettersCollectionHeadline: string;                  // 'Mình viết cho nhau'
    lettersCollectionCta: string;                       // 'Đọc lại trong Inbox'
    letterKicker: (sender: string, date: string) => string;
    topQuestionMeta: (count: number) => string;
    closingTitleWithPartner: (partner: string) => string;
    closingTitleSolo: string;
    closingBody: string;
    actionsSave: string;
    actionsShare: string;
    actionsDetail: string;
    photoReelHeadline: string;
    photoReelCaption: (showing: number, of: number) => string;
  };
  handlers: {
    onSave: () => void;
    onShare: () => void;
    onDetail: () => void;
  };
};

export function composeMonthlySlides(ctx: MonthlyComposeContext): Slide[] {
  const { data, monthStr, isVi, user, partner, labels, handlers } = ctx;
  const md = describeMonth(monthStr);
  const initialA = nameInitial(user?.name);
  const initialB = nameInitial(partner?.name);
  const period = isVi ? md.formatted.vi : md.formatted.en;

  const people: [StoriesPerson, StoriesPerson] = [
    { initial: initialA, gradientKey: 'A' },
    { initial: initialB, gradientKey: 'B' },
  ];

  const coupleNamesScript =
    [user?.name, partner?.name].filter(Boolean).join(' & ') || '·';

  // Sprint 67 D1 — flatten all highlight photos into a global pool so
  // every photo-rich slide pulls visual variety from across the whole
  // period instead of leaning on the same single hero. dedupe + cap so
  // no slide stalls on missing thumbnails.
  const allPhotos = [
    ...new Set(
      data.moments.highlights.flatMap((m) => m.photos ?? []).filter(Boolean),
    ),
  ];
  const coverPhotos = allPhotos.slice(0, 4); // cover collage 2x2
  const statBackdropPhotos = allPhotos.slice(0, 9); // stat 3x3 mosaic
  const reelPhotos = allPhotos.slice(0, 9);

  // D8 — letter photos pool: flatten every letter's photos[] (BE caps
  // 4 each) so the BigStat letters slide backdrop pulls from real
  // letter attachments instead of the moment pool. Falls back to moment
  // pool when no letters have photos so the slide doesn't drop to the
  // cream gradient again (D6 lesson).
  const letterPhotos = [
    ...new Set(
      data.letters
        .flatMap((l) => l.photos ?? [])
        .filter(Boolean),
    ),
  ];
  const letterBackdrop = letterPhotos.length > 0
    ? letterPhotos.slice(0, 9)
    : statBackdropPhotos;

  const slides: Slide[] = [];

  // Cover
  slides.push({
    kind: 'cover',
    bgPhotoUrls: coverPhotos.length > 0 ? coverPhotos : undefined,
    kicker: `RECAP · ${period.toUpperCase()}`,
    titleLine1: isVi ? md.monthNameVi : 'Our',
    titleLine2: isVi ? 'của mình' : md.monthNameEn,
    coupleNamesScript,
    people,
    scrollHint: labels.coverScrollHint,
  });

  // Stat trio (always — moments + letters + photos). Skip a card whose
  // value is 0 so the slideshow doesn't lead with empty zeros.
  if (data.moments.count > 0) {
    slides.push({
      kind: 'stat',
      bgPhotoUrls: statBackdropPhotos,
      value: data.moments.count,
      label: labels.statMoments,
      tone: 'primary',
      sub: labels.statSubMoments,
    });
  }
  const totalLetters = data.loveLetters.sent + data.loveLetters.received;
  if (totalLetters > 0) {
    slides.push({
      kind: 'stat',
      // D8 — backdrop pulls from letterPhotos (real letter attachments)
      // when present, falling back to the moment pool only when no
      // letter carries an attachment. Boss intent: BigStat letters
      // should feel like letters, not moments.
      bgPhotoUrls: letterBackdrop,
      value: totalLetters,
      label: labels.statLetters,
      tone: 'secondary',
    });
  }
  if (data.totalPhotoCount > 0) {
    slides.push({
      kind: 'stat',
      bgPhotoUrls: statBackdropPhotos,
      value: data.totalPhotoCount,
      label: labels.statPhotos,
      tone: 'accent',
    });
  }

  // Top moment showcase — primary photo + filmstrip from the same moment
  const top = data.topMoments[0];
  if (top && top.thumbnail) {
    const sub = [
      top.location,
      top.photoCount > 0 ? `${top.photoCount} ảnh` : null,
      top.reactionCount > 0 ? `${top.reactionCount} tim` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    // Filmstrip: pull all photos from the matching highlight (excluding
    // the primary thumbnail to avoid duplicating the hero).
    const matching = data.moments.highlights.find((m) => m.id === top.id);
    const filmstrip = matching?.photos.filter((p) => p !== top.thumbnail) ?? [];
    slides.push({
      kind: 'topMoment',
      momentId: top.id,
      bgPhotoUrl: top.thumbnail,
      filmstrip: filmstrip.slice(0, 5),
      rank: 1,
      title: top.title,
      sub,
      palette: top.palette,
      ctaLabel: labels.topMomentCta,
    });
  }

  // Places — Polaroid stack per place. Each cell carries up to 3
  // photos picked from any moment in the highlights pool (BE
  // highlights doesn't expose location, so we round-robin photos from
  // the global pool to avoid empty cells).
  if (data.places.length > 0) {
    const headline = labels.placesHeadline(data.places.length);
    const caption = labels.placesCaption(data.places.length);
    const thumbnails = data.places.slice(0, 4).map((p, idx) => {
      // Allocate 3 photos per place, offset by index so cells don't all
      // show the same triplet. Wrap mod allPhotos.length for safety.
      const start = (idx * 3) % Math.max(1, allPhotos.length);
      const photos = allPhotos.length > 0
        ? [
            allPhotos[start % allPhotos.length]!,
            allPhotos[(start + 1) % allPhotos.length]!,
            allPhotos[(start + 2) % allPhotos.length]!,
          ]
        : [];
      return { name: p.name, photos };
    });
    slides.push({
      kind: 'places',
      headline,
      caption,
      thumbnails,
    });
  }

  // Firsts — main photo + 2-3 corner mosaic from the same moment
  const firstFirst = data.firsts[0];
  if (firstFirst) {
    const matchedMoment = data.moments.highlights.find((m) => m.id === firstFirst.id);
    const photos = matchedMoment?.photos ?? [];
    slides.push({
      kind: 'firsts',
      firstId: firstFirst.id,
      bgPhotoUrl: photos[0],
      mosaic: photos.slice(1, 4),
      sticker: '🎉',
      kicker: labels.firstsKicker,
      title: firstFirst.title,
    });
  }

  // D8 — single LettersCollection slide consolidating ALL letters.
  // Replaces the D2-D7 pattern of per-letter slides with paginated
  // variants (Classic/Polaroid/Envelope/Postcard). Boss directive
  // 2026-04-27: "phải hiển thị TOÀN BỘ mấy cái lá thư" — all letters
  // together, read-style, in one slide. Falls back to letterHighlight
  // for the BE deploy-gap (older BE without `letters[]`).
  const letterPool = data.letters.length > 0
    ? data.letters
    : data.letterHighlight
      ? [data.letterHighlight]
      : [];
  if (letterPool.length > 0) {
    const collectionItems = letterPool.map((lh) => {
      const dateLabel = lh.deliveredAt
        ? new Date(lh.deliveredAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
          })
        : '';
      return {
        id: lh.id,
        kicker: labels.letterKicker(lh.senderName, dateLabel),
        title: lh.title,
        // BE deploy-gap fallback: older response had only `excerpt`.
        content: (lh.content ?? lh.excerpt) || '',
        senderName: lh.senderName,
        thumb: lh.photos?.[0],
      };
    });
    slides.push({
      kind: 'lettersCollection',
      kicker: labels.lettersCollectionKicker(letterPool.length),
      headline: labels.lettersCollectionHeadline,
      ctaLabel: labels.lettersCollectionCta,
      letters: collectionItems,
    });
  }

  // Top question — skip if null
  if (data.topQuestion) {
    const qText = isVi
      ? data.topQuestion.textVi ?? data.topQuestion.text
      : data.topQuestion.text;
    slides.push({
      kind: 'topQuestion',
      text: `“${qText}”`,
      meta: labels.topQuestionMeta(data.topQuestion.count),
      initialA,
      initialB,
    });
  }

  // PhotoReel — 3x3 mosaic of up to 9 best photos. Slot before
  // Closing so the user sees the literal "this is what we made"
  // grid before the warm signoff.
  if (reelPhotos.length >= 4) {
    slides.push({
      kind: 'photoReel',
      headline: labels.photoReelHeadline,
      caption: labels.photoReelCaption(data.totalPhotoCount, reelPhotos.length),
      photos: reelPhotos,
    });
  }

  // Closing
  const partnerName = partner?.name ?? null;
  slides.push({
    kind: 'closing',
    title: partnerName
      ? labels.closingTitleWithPartner(partnerName)
      : labels.closingTitleSolo,
    body: labels.closingBody,
    signature: partnerName
      ? `${user?.name ?? '·'} & ${partnerName} · ${period}`
      : `${user?.name ?? '·'} · ${period}`,
    initialA,
    initialB,
  });

  // Actions tray (always last)
  slides.push({
    kind: 'actionsTray',
    saveLabel: labels.actionsSave,
    shareLabel: labels.actionsShare,
    detailLabel: labels.actionsDetail,
    onSave: handlers.onSave,
    onShare: handlers.onShare,
    onDetail: handlers.onDetail,
  });

  return slides;
}
