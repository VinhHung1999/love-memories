// Sprint 67 T460 — Pure composer: WeeklyRecapResponse → compact slide
// list. Same skip rules as monthly but a smaller deck:
//   1. Cover
//   2. Stat (moments)
//   3. Stat (letters or daily Q if non-zero)
//   4. Top moment showcase (when data exists)
//   5. Closing
//   6. ActionsTray
// Letter / topQuestion / firsts / places slides intentionally omitted —
// weekly stories want a sub-minute scroll per Boss spec.

import type { Slide, StoriesPerson } from './types';
import type { WeeklyRecapResponse } from '../types';
import { formatWeekRange, nameInitial } from '../utils';

export type WeeklyComposeContext = {
  data: WeeklyRecapResponse;
  weekStr: string;
  isVi: boolean;
  user: { name: string | null } | null;
  partner: { name: string | null } | null;
  labels: {
    coverScrollHint: string;
    coverTitleLine1: string;       // 'Tuần này' / 'This week'
    statMoments: string;
    statLetters: string;
    statQuestions: string;
    topMomentCta: string;
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

export function composeWeeklySlides(ctx: WeeklyComposeContext): Slide[] {
  const { data, weekStr, isVi, user, partner, labels, handlers } = ctx;
  const initialA = nameInitial(user?.name);
  const initialB = nameInitial(partner?.name);
  const range = formatWeekRange(data.startDate, data.endDate, isVi ? 'vi' : 'en');
  const period = range || weekStr;

  const people: [StoriesPerson, StoriesPerson] = [
    { initial: initialA, gradientKey: 'A' },
    { initial: initialB, gradientKey: 'B' },
  ];
  const coupleNamesScript =
    [user?.name, partner?.name].filter(Boolean).join(' & ') || '·';

  const coverPhoto =
    data.topMoments[0]?.thumbnail ?? data.moments.highlights[0]?.photoUrl;

  const slides: Slide[] = [];

  // Cover
  slides.push({
    kind: 'cover',
    bgPhotoUrl: coverPhoto,
    kicker: `RECAP · ${period.toUpperCase()}`,
    titleLine1: labels.coverTitleLine1,
    titleLine2: range,
    coupleNamesScript,
    people,
    scrollHint: labels.coverScrollHint,
  });

  // Moments stat — only when non-zero
  if (data.moments.count > 0) {
    slides.push({
      kind: 'stat',
      bgPhotoUrl: coverPhoto,
      value: data.moments.count,
      label: labels.statMoments,
      tone: 'primary',
    });
  }

  // Letters or daily-Q stat — pick whichever is more meaningful for the
  // week (letters > 0 wins; otherwise daily Q if > 0). Keeps the deck
  // short.
  const totalLetters = data.loveLetters.sent + data.loveLetters.received;
  if (totalLetters > 0) {
    slides.push({
      kind: 'stat',
      value: totalLetters,
      label: labels.statLetters,
      tone: 'secondary',
    });
  } else if (data.questions.count > 0) {
    slides.push({
      kind: 'stat',
      value: data.questions.count,
      label: labels.statQuestions,
      tone: 'accent',
    });
  }

  // Top moment of the week
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

  // Closing
  const partnerName = partner?.name ?? null;
  slides.push({
    kind: 'closing',
    title: partnerName ? `Cảm ơn ${partnerName}\nvì tuần này.` : 'Cảm ơn\nvì tuần này.',
    body: labels.closingBody,
    signature: partnerName
      ? `${user?.name ?? '·'} & ${partnerName} · ${range}`
      : `${user?.name ?? '·'} · ${range}`,
    initialA,
    initialB,
  });

  // Actions tray
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
