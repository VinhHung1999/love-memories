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
    letterCta: string;             // 'Đọc lại'
    letterKicker: (sender: string, date: string) => string;
    topQuestionMeta: (count: number) => string;
    closingTitleWithPartner: (partner: string) => string;
    closingTitleSolo: string;
    closingBody: string;
    actionsSave: string;
    actionsShare: string;
    actionsDetail: string;
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

  const coverPhoto = data.topMoments[0]?.thumbnail ?? data.moments.highlights[0]?.photos?.[0] ?? undefined;
  const statPhotoA = data.moments.highlights[1]?.photos?.[0] ?? coverPhoto;
  const statPhotoB = data.moments.highlights[2]?.photos?.[0] ?? coverPhoto;

  const slides: Slide[] = [];

  // Cover
  slides.push({
    kind: 'cover',
    bgPhotoUrl: coverPhoto,
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
      bgPhotoUrl: statPhotoA,
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
      value: totalLetters,
      label: labels.statLetters,
      tone: 'secondary',
    });
  }
  if (data.totalPhotoCount > 0) {
    slides.push({
      kind: 'stat',
      bgPhotoUrl: statPhotoB,
      value: data.totalPhotoCount,
      label: labels.statPhotos,
      tone: 'accent',
    });
  }

  // Top moment showcase — only first one, full-bleed
  const top = data.topMoments[0];
  if (top && top.thumbnail) {
    const sub = [
      top.location,
      top.photoCount > 0 ? `${top.photoCount} ảnh` : null,
      top.reactionCount > 0 ? `${top.reactionCount} tim` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    slides.push({
      kind: 'topMoment',
      momentId: top.id,
      bgPhotoUrl: top.thumbnail,
      rank: 1,
      title: top.title,
      sub,
      palette: top.palette,
      ctaLabel: labels.topMomentCta,
    });
  }

  // Places
  if (data.places.length > 0) {
    const headline = labels.placesHeadline(data.places.length);
    const caption = labels.placesCaption(data.places.length);
    const thumbnails = data.places.slice(0, 4).map((p) => {
      // Find first moment in highlights with matching location for a
      // photo thumbnail; otherwise fall back to gradient placeholder.
      const matched = data.moments.highlights.find(
        (m) =>
          // highlights don't carry location, so we approximate by index
          // — the highlights are already date-desc; just pull a photo.
          m.photos.length > 0,
      );
      return { name: p.name, photoUrl: matched?.photos?.[0] };
    });
    slides.push({
      kind: 'places',
      headline,
      caption,
      thumbnails,
    });
  }

  // Firsts — pick the first one for a focused slide
  const firstFirst = data.firsts[0];
  if (firstFirst) {
    const matchedMoment = data.moments.highlights.find((m) => m.id === firstFirst.id);
    slides.push({
      kind: 'firsts',
      firstId: firstFirst.id,
      bgPhotoUrl: matchedMoment?.photos?.[0],
      sticker: '🎉',
      kicker: labels.firstsKicker,
      title: firstFirst.title,
    });
  }

  // Letter highlight — skip if null
  if (data.letterHighlight) {
    const lh = data.letterHighlight;
    const dateLabel = lh.deliveredAt
      ? new Date(lh.deliveredAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
          day: '2-digit',
          month: '2-digit',
        })
      : '';
    slides.push({
      kind: 'letter',
      letterId: lh.id,
      kicker: labels.letterKicker(lh.senderName, dateLabel),
      title: lh.title,
      excerpt: lh.excerpt,
      ctaLabel: labels.letterCta,
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
