import prisma from '../utils/prisma';
import OpenAI from 'openai';
import { ACHIEVEMENT_DEFS } from './AchievementService';

// ── ISO week helpers ──────────────────────────────────────────────────────────

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function weekToRange(weekStr: string): { startDate: Date; endDate: Date } {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error('Invalid week format. Use YYYY-Www');
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { startDate: monday, endDate: sunday };
}

function previousWeekStr(): string {
  const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { year, week } = getISOWeek(d);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function monthToRange(monthStr: string): { startDate: Date; endDate: Date } {
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error('Invalid month format. Use YYYY-MM');
  const year = parseInt(match[1]!);
  const month = parseInt(match[2]!) - 1;

  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  return { startDate, endDate };
}

function previousMonthStr(): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (month === 0) { year -= 1; month = 12; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export { weekToRange, monthToRange, previousWeekStr, previousMonthStr, currentMonthStr };

// ── Augment helpers (Sprint 67 T451 — mobile-rework editorial recap) ─────────
//
// Existing response keys (cooking/foodSpots/datePlans/loveLetters/goalsCompleted/
// achievementsUnlocked) stay untouched for the web monthly recap page. New keys
// listed below are additive and consumed by mobile-rework's MonthlyRecapScreen
// + WeeklyRecapScreen. Mood section is intentionally absent (data source idle
// per Boss directive Sprint 66) — mobile renders a placeholder card to keep
// the prototype scroll layout consistent.

const FIRST_TAG_NEEDLES = ['first', 'lần đầu', 'lan dau'];

function tagIsFirst(tag: string): boolean {
  const norm = tag.trim().toLowerCase();
  return FIRST_TAG_NEEDLES.some((needle) => norm === needle);
}

function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Days-since-start, 0-indexed, capped at bucketCount-1. Used for both 7-day
// (weekly) and 28-31 day (monthly) heatmaps.
function bucketDayIndex(date: Date, startDate: Date, bucketCount: number): number {
  const ms = date.getTime() - startDate.getTime();
  const idx = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (idx < 0) return 0;
  if (idx >= bucketCount) return bucketCount - 1;
  return idx;
}

// Letter palette derivation parallel to mobile-rework `src/screens/Letters/
// palette.ts`. Kept inline (no shared module between FE + BE) — six gradient
// keys map to the prototype PAL_GRADIENTS.
const LETTER_PALETTE_KEYS = ['sunset', 'butter', 'night', 'lilac', 'rose', 'mint'] as const;
type LetterPaletteKey = (typeof LETTER_PALETTE_KEYS)[number];

function paletteForId(id: string): LetterPaletteKey {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return LETTER_PALETTE_KEYS[h % LETTER_PALETTE_KEYS.length] ?? 'sunset';
}

const EXCERPT_MAX = 200;

function makeExcerpt(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_MAX) return flat;
  return flat.slice(0, EXCERPT_MAX).replace(/\s+\S*$/, '') + '…';
}

type AugmentMoment = {
  id: string;
  title: string;
  caption: string | null;
  date: Date;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  tags: string[];
  photos: { url: string }[];
  _count: { reactions: number };
};

type AugmentLetter = {
  id: string;
  title: string;
  content: string;
  senderId: string;
  deliveredAt: Date | null;
  sender: { id: string; name: string };
  // Sprint 67 D8 — letter attachments. Mobile Stories uses these for
  // (a) the BigStat letters slide backdrop (so it pulls from letters,
  // not moments) and (b) optional thumbnails inside the consolidated
  // LettersCollection slide. Empty when the letter shipped text-only.
  photos: { url: string }[];
};

type RecapAugment = {
  streak: { current: number; longest: number };
  questions: { count: number };
  words: { count: number };
  trips: number;
  totalPhotoCount: number;
  heatmap: number[];
  topMoments: {
    id: string;
    title: string;
    date: string;
    location: string | null;
    photoCount: number;
    reactionCount: number;
    palette: LetterPaletteKey;
    thumbnail: string | null;
  }[];
  places: { name: string; latitude: number | null; longitude: number | null; count: number }[];
  topQuestion: {
    id: string;
    text: string;
    textVi: string | null;
    count: number;
  } | null;
  letterHighlight: {
    id: string;
    title: string;
    excerpt: string;
    // Sprint 67 D7 — full body alongside the truncated excerpt so the
    // Stories letter slide can render the whole letter (read-screen
    // style) instead of cutting at 200 chars. Web editorial scroll
    // continues to use `excerpt`; only the new mobile Stories
    // experience consumes `content`.
    content: string;
    // Sprint 67 D8 — attached photo URLs for parity with letters[].
    photos: string[];
    senderId: string;
    senderName: string;
    deliveredAt: string | null;
  } | null;
  // Sprint 67 D2 — surface up to 4 longest letters so the mobile
  // Stories shell can render multiple letter slides with variant
  // rotation. letterHighlight stays for editorial scroll backward-
  // compat (= letters[0] when present).
  // Sprint 67 D8 — photos[] joined from letter_photos so the Stories
  // BigStat letters slide can mosaic from real letter attachments
  // instead of borrowing the moment photo pool.
  letters: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    photos: string[];
    senderId: string;
    senderName: string;
    deliveredAt: string | null;
  }[];
  firsts: { id: string; title: string; date: string }[];
  moodBuckets: never[];
};

async function buildAugment(
  coupleId: string,
  startDate: Date,
  endDate: Date,
  daysInRange: number,
  moments: AugmentMoment[],
  loveLetters: AugmentLetter[],
  datePlanCount: number,
): Promise<RecapAugment> {
  const [streak, dailyResponses] = await Promise.all([
    prisma.dailyQuestionStreak.findUnique({ where: { coupleId } }),
    prisma.dailyQuestionResponse.findMany({
      where: { coupleId, createdAt: { gte: startDate, lte: endDate } },
      select: { questionId: true, answer: true },
    }),
  ]);

  // Heatmap: count moments per day-of-range.
  const heatmap = new Array<number>(daysInRange).fill(0);
  for (const m of moments) {
    heatmap[bucketDayIndex(m.date, startDate, daysInRange)]!++;
  }

  // topMoments: rank by photoCount + reactionCount desc, tie → date desc.
  const ranked = [...moments]
    .map((m) => ({
      m,
      score: m.photos.length + m._count.reactions,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.m.date.getTime() - a.m.date.getTime();
    });
  const topMoments = ranked.slice(0, 3).map(({ m }) => ({
    id: m.id,
    title: m.title,
    date: m.date.toISOString().split('T')[0]!,
    location: m.location,
    photoCount: m.photos.length,
    reactionCount: m._count.reactions,
    palette: paletteForId(m.id),
    thumbnail: m.photos[0]?.url ?? null,
  }));

  // Places: dedupe by location name (case-insensitive trim). First non-null
  // lat/lng wins. Order by count desc → name asc.
  const placeMap = new Map<
    string,
    { name: string; latitude: number | null; longitude: number | null; count: number }
  >();
  for (const m of moments) {
    if (!m.location) continue;
    const key = m.location.trim().toLowerCase();
    if (!key) continue;
    const cur = placeMap.get(key);
    if (cur) {
      cur.count++;
      if (cur.latitude == null && m.latitude != null) cur.latitude = m.latitude;
      if (cur.longitude == null && m.longitude != null) cur.longitude = m.longitude;
    } else {
      placeMap.set(key, {
        name: m.location.trim(),
        latitude: m.latitude,
        longitude: m.longitude,
        count: 1,
      });
    }
  }
  const places = [...placeMap.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  // topQuestion: groupBy questionId, take top 1.
  const qCountMap = new Map<string, number>();
  for (const r of dailyResponses) {
    qCountMap.set(r.questionId, (qCountMap.get(r.questionId) ?? 0) + 1);
  }
  let topQuestion: RecapAugment['topQuestion'] = null;
  if (qCountMap.size > 0) {
    let topId = '';
    let topCount = 0;
    for (const [qid, c] of qCountMap.entries()) {
      if (c > topCount) {
        topCount = c;
        topId = qid;
      }
    }
    const q = await prisma.dailyQuestion.findUnique({ where: { id: topId } });
    if (q) {
      topQuestion = { id: q.id, text: q.text, textVi: q.textVi, count: topCount };
    }
  }

  // letters: top 4 by content length (tie → first delivered), each
  // with a 200-char excerpt. letterHighlight = letters[0] for editorial
  // backward-compat. Sprint 67 D2.
  const sortedLetters = [...loveLetters].sort((a, b) => {
    if (b.content.length !== a.content.length) {
      return b.content.length - a.content.length;
    }
    const at = a.deliveredAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bt = b.deliveredAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });
  const letters: RecapAugment['letters'] = sortedLetters.slice(0, 4).map((l) => ({
    id: l.id,
    title: l.title,
    excerpt: makeExcerpt(l.content),
    // D7 — full body so the mobile Stories letter slide can render the
    // entire letter inside a ScrollView (read-screen style). Letters
    // average <1KB so payload bloat is negligible vs the 200-char
    // excerpt.
    content: l.content,
    // D8 — flatten LetterPhoto[] → string[] of URLs.
    photos: l.photos.map((p) => p.url),
    senderId: l.senderId,
    senderName: l.sender.name,
    deliveredAt: l.deliveredAt?.toISOString() ?? null,
  }));
  const letterHighlight: RecapAugment['letterHighlight'] =
    letters.length > 0 ? letters[0]! : null;

  // firsts: moments with a 'first' / 'lần đầu' tag.
  const firsts = moments
    .filter((m) => m.tags.some(tagIsFirst))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date.toISOString().split('T')[0]!,
    }));

  // word count: titles + captions of moments + letter titles + letter content
  // + daily Q answers. Keep heuristic — split on whitespace.
  let wordCount = 0;
  for (const m of moments) {
    wordCount += countWords(m.title);
    wordCount += countWords(m.caption);
  }
  for (const l of loveLetters) {
    wordCount += countWords(l.title);
    wordCount += countWords(l.content);
  }
  for (const r of dailyResponses) {
    wordCount += countWords(r.answer);
  }

  // total photos including letters' photos so the cover stat reads "ảnh đã
  // lưu" across all surfaces, not just moments.
  const letterPhotoCount = await prisma.letterPhoto.count({
    where: { letter: { coupleId, deliveredAt: { gte: startDate, lte: endDate } } },
  });
  const momentPhotoCount = moments.reduce((sum, m) => sum + m.photos.length, 0);

  return {
    streak: {
      current: streak?.currentStreak ?? 0,
      longest: streak?.longestStreak ?? 0,
    },
    questions: { count: dailyResponses.length },
    words: { count: wordCount },
    trips: datePlanCount,
    totalPhotoCount: momentPhotoCount + letterPhotoCount,
    heatmap,
    topMoments,
    places,
    topQuestion,
    letterHighlight,
    letters,
    firsts,
    moodBuckets: [],
  };
}

// ── GET weekly recap ──────────────────────────────────────────────────────────

export async function getWeekly(weekStr: string | undefined, userId: string, coupleId: string) {
  const ws = weekStr || previousWeekStr();
  const { startDate, endDate } = weekToRange(ws);
  const gte = startDate;
  const lte = endDate;

  const [moments, cookingSessions, foodSpots, datePlans, loveLetters, goals, achievements] =
    await Promise.all([
      prisma.moment.findMany({
        where: { coupleId, date: { gte, lte } },
        include: {
          photos: { select: { url: true } },
          _count: { select: { reactions: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.cookingSession.findMany({
        where: { coupleId, completedAt: { gte, lte }, status: 'completed' },
        include: { recipes: { include: { recipe: true } } },
      }),
      prisma.foodSpot.findMany({
        where: { coupleId, createdAt: { gte, lte } },
        select: { name: true },
      }),
      prisma.datePlan.findMany({
        where: { coupleId, date: { gte, lte } },
        select: { title: true },
      }),
      prisma.loveLetter.findMany({
        where: { coupleId, deliveredAt: { gte, lte }, status: { in: ['DELIVERED', 'READ'] } },
        select: {
          id: true,
          title: true,
          content: true,
          senderId: true,
          deliveredAt: true,
          sender: { select: { id: true, name: true } },
          // D8 — attached photos for the LettersCollection slide + the
          // BigStat letters backdrop. Bounded `take: 4` per letter
          // keeps the payload small (worst case 16 letter photos for
          // monthly recap, ~6KB).
          photos: { select: { url: true }, take: 4 },
        },
      }),
      prisma.goal.findMany({
        where: { coupleId, status: 'DONE', updatedAt: { gte, lte } },
        select: { id: true },
      }),
      prisma.achievement.findMany({ where: { coupleId, unlockedAt: { gte, lte } } }),
    ]);

  const photoCount = moments.reduce((sum, m) => sum + m.photos.length, 0);
  const highlights = moments
    .filter((m) => m.photos.length > 0)
    .slice(0, 3)
    .map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date.toISOString().split('T')[0],
      photoUrl: m.photos[0]!.url,
    }));

  const recipeNames = [
    ...new Set(cookingSessions.flatMap((s) => s.recipes.map((r) => r.recipe.title))),
  ];
  const totalTimeMs = cookingSessions.reduce((sum, s) => sum + (s.totalTimeMs ?? 0), 0);

  const sent = loveLetters.filter((l) => l.senderId === userId).length;
  const received = loveLetters.filter((l) => l.senderId !== userId).length;

  const achievementTitles = achievements.map((a) => {
    const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.key);
    return def?.title ?? a.key;
  });

  const augment = await buildAugment(
    coupleId,
    startDate,
    endDate,
    7,
    moments,
    loveLetters,
    datePlans.length,
  );

  return {
    week: ws,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    moments: { count: moments.length, photoCount, highlights },
    cooking: { count: cookingSessions.length, totalTimeMs, recipes: recipeNames },
    foodSpots: { count: foodSpots.length, names: foodSpots.map((f) => f.name) },
    datePlans: { count: datePlans.length, titles: datePlans.map((p) => p.title) },
    loveLetters: { sent, received },
    goalsCompleted: goals.length,
    achievementsUnlocked: achievementTitles,
    ...augment,
  };
}

// ── GET monthly recap ─────────────────────────────────────────────────────────

export async function getMonthly(monthStr: string | undefined, userId: string, coupleId: string) {
  const ms = monthStr || previousMonthStr();
  const { startDate, endDate } = monthToRange(ms);
  const gte = startDate;
  const lte = endDate;

  // daysInMonth from endDate's UTC day-of-month (last second of last day).
  const daysInMonth = endDate.getUTCDate();

  const [moments, cookingSessions, foodSpots, datePlans, loveLetters, goals, achievements] =
    await Promise.all([
      prisma.moment.findMany({
        where: { coupleId, date: { gte, lte } },
        include: {
          photos: { select: { url: true } },
          _count: { select: { reactions: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.cookingSession.findMany({
        where: { coupleId, completedAt: { gte, lte }, status: 'completed' },
        include: {
          recipes: { include: { recipe: { include: { photos: { select: { url: true }, take: 1 } } } } },
          photos: { select: { url: true }, take: 2 },
        },
      }),
      prisma.foodSpot.findMany({
        where: { coupleId, createdAt: { gte, lte } },
        select: { name: true, photos: { select: { url: true }, take: 1 } },
      }),
      prisma.datePlan.findMany({
        where: { coupleId, date: { gte, lte } },
        select: { title: true },
      }),
      prisma.loveLetter.findMany({
        where: { coupleId, deliveredAt: { gte, lte }, status: { in: ['DELIVERED', 'READ'] } },
        select: {
          id: true,
          title: true,
          content: true,
          senderId: true,
          deliveredAt: true,
          sender: { select: { id: true, name: true } },
          // D8 — attached photos for the LettersCollection slide + the
          // BigStat letters backdrop. Bounded `take: 4` per letter
          // keeps the payload small (worst case 16 letter photos for
          // monthly recap, ~6KB).
          photos: { select: { url: true }, take: 4 },
        },
      }),
      prisma.goal.findMany({
        where: { coupleId, status: 'DONE', updatedAt: { gte, lte } },
        select: { id: true },
      }),
      prisma.achievement.findMany({ where: { coupleId, unlockedAt: { gte, lte } } }),
    ]);

  const photoCount = moments.reduce((sum, m) => sum + m.photos.length, 0);
  const highlights = moments
    .filter((m) => m.photos.length > 0)
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date.toISOString().split('T')[0],
      photos: m.photos.slice(0, 3).map((p) => p.url),
    }));

  const recipeNames = [
    ...new Set(cookingSessions.flatMap((s) => s.recipes.map((r) => r.recipe.title))),
  ];
  const totalTimeMs = cookingSessions.reduce((sum, s) => sum + (s.totalTimeMs ?? 0), 0);

  const rawCookingPhotos: string[] = [];
  cookingSessions.forEach((s) => {
    s.photos.forEach((p) => rawCookingPhotos.push(p.url));
    s.recipes.forEach((r) => r.recipe.photos.forEach((p) => rawCookingPhotos.push(p.url)));
  });
  const cookingPhotos = [...new Set(rawCookingPhotos)].slice(0, 3);

  const foodSpotPhotos = foodSpots.filter((f) => f.photos[0]).map((f) => f.photos[0]!.url);

  const sent = loveLetters.filter((l) => l.senderId === userId).length;
  const received = loveLetters.filter((l) => l.senderId !== userId).length;

  const achievementTitles = achievements.map((a) => {
    const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.key);
    return def?.title ?? a.key;
  });

  const augment = await buildAugment(
    coupleId,
    startDate,
    endDate,
    daysInMonth,
    moments,
    loveLetters,
    datePlans.length,
  );

  return {
    month: ms,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    moments: { count: moments.length, photoCount, highlights },
    cooking: { count: cookingSessions.length, totalTimeMs, recipes: recipeNames, photos: cookingPhotos },
    foodSpots: { count: foodSpots.length, names: foodSpots.map((f) => f.name), photos: foodSpotPhotos },
    datePlans: { count: datePlans.length, titles: datePlans.map((p) => p.title) },
    loveLetters: { sent, received },
    goalsCompleted: goals.length,
    achievementsUnlocked: achievementTitles,
    ...augment,
  };
}

// ── GET monthly caption (AI) ──────────────────────────────────────────────────

export async function getMonthlyCaption(monthStr: string | undefined, coupleId: string) {
  const ms = monthStr || currentMonthStr();
  const { startDate, endDate } = monthToRange(ms);
  const gte = startDate;
  const lte = endDate;

  const [momentCount, cookingCount, foodSpotCount, letterCount, goalCount] = await Promise.all([
    prisma.moment.count({ where: { coupleId, date: { gte, lte } } }),
    prisma.cookingSession.count({ where: { coupleId, completedAt: { gte, lte }, status: 'completed' } }),
    prisma.foodSpot.count({ where: { coupleId, createdAt: { gte, lte } } }),
    prisma.loveLetter.count({ where: { coupleId, deliveredAt: { gte, lte }, status: { in: ['DELIVERED', 'READ'] } } }),
    prisma.goal.count({ where: { coupleId, status: 'DONE', updatedAt: { gte, lte } } }),
  ]);

  if (momentCount + cookingCount + foodSpotCount + letterCount + goalCount === 0) {
    return { intro: null, outro: null };
  }

  const [momentTitles, cookingSessions, foodNames] = await Promise.all([
    prisma.moment.findMany({ where: { coupleId, date: { gte, lte } }, select: { title: true }, take: 10 }),
    prisma.cookingSession.findMany({
      where: { coupleId, completedAt: { gte, lte }, status: 'completed' },
      include: { recipes: { include: { recipe: { select: { title: true } } } } },
    }),
    prisma.foodSpot.findMany({ where: { coupleId, createdAt: { gte, lte } }, select: { name: true }, take: 10 }),
  ]);

  const recipeNames = [...new Set(cookingSessions.flatMap((s) => s.recipes.map((r) => r.recipe.title)))];

  const summary = [
    `Tháng ${ms}:`,
    momentCount > 0 ? `- ${momentCount} kỷ niệm: ${momentTitles.map((m) => m.title).join(', ')}` : null,
    cookingCount > 0 ? `- ${cookingCount} lần nấu ăn: ${recipeNames.join(', ')}` : null,
    foodSpotCount > 0 ? `- ${foodSpotCount} quán mới: ${foodNames.map((f) => f.name).join(', ')}` : null,
    letterCount > 0 ? `- ${letterCount} thư tình` : null,
    goalCount > 0 ? `- ${goalCount} mục tiêu hoàn thành` : null,
  ].filter(Boolean).join('\n');

  const xai = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });
  const completion = await xai.chat.completions.create({
    model: 'grok-4-1-fast-non-reasoning',
    messages: [
      {
        role: 'system',
        content: 'Bạn là trợ lý viết lời bình cho recap tháng của một cặp đôi. Viết tiếng Việt, dùng emoji phù hợp. Giọng văn ấm áp, lãng mạn nhưng không sến. Trả về JSON với 2 trường: intro (1 câu mở đầu ngắn gọn) và outro (1-2 câu kết thúc, cảm ơn, động viên).',
      },
      {
        role: 'user',
        content: `Dựa vào hoạt động tháng này, viết lời bình:\n\n${summary}\n\nTrả về JSON: {"intro": "...", "outro": "..."}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  let intro: string | null = null;
  let outro: string | null = null;
  try {
    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned) as { intro?: string; outro?: string };
    intro = parsed.intro?.trim() || null;
    outro = parsed.outro?.trim() || null;
  } catch {
    // JSON parse failed — leave both null
  }

  return { intro, outro };
}
