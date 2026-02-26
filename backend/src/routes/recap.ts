import { Router } from 'express';
import type { Response } from 'express';
import OpenAI from 'openai';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';
import { ACHIEVEMENT_DEFS } from './achievements';

const router = Router();

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

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // 1=Mon … 7=Sun
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

// ── GET /api/recap/weekly?week=2026-W09 ──────────────────────────────────────

router.get('/weekly', async (req: AuthRequest, res: Response) => {
  try {
    const weekStr = (req.query.week as string | undefined) || previousWeekStr();

    let startDate: Date;
    let endDate: Date;
    try {
      ({ startDate, endDate } = weekToRange(weekStr));
    } catch {
      res.status(400).json({ error: 'Invalid week format. Use YYYY-Www (e.g. 2026-W09)' });
      return;
    }

    const userId = req.user!.userId;
    const gte = startDate;
    const lte = endDate;

    const [moments, cookingSessions, foodSpots, datePlans, loveLetters, goals, achievements] =
      await Promise.all([
        prisma.moment.findMany({
          where: { date: { gte, lte } },
          include: { photos: { select: { url: true } } },
          orderBy: { date: 'desc' },
        }),
        prisma.cookingSession.findMany({
          where: { completedAt: { gte, lte }, status: 'completed' },
          include: {
            recipes: { include: { recipe: true } },
          },
        }),
        prisma.foodSpot.findMany({
          where: { createdAt: { gte, lte } },
          select: { name: true },
        }),
        prisma.datePlan.findMany({
          where: { date: { gte, lte } },
          select: { title: true },
        }),
        prisma.loveLetter.findMany({
          where: {
            deliveredAt: { gte, lte },
            status: { in: ['DELIVERED', 'READ'] },
          },
          select: { senderId: true },
        }),
        prisma.goal.findMany({
          where: { status: 'DONE', updatedAt: { gte, lte } },
          select: { id: true },
        }),
        prisma.achievement.findMany({
          where: { unlockedAt: { gte, lte } },
        }),
      ]);

    // Moments — highlights: first 3 with a photo
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

    // Cooking — deduplicated recipe names + total time
    const recipeNames = [
      ...new Set(cookingSessions.flatMap((s) => s.recipes.map((r) => r.recipe.title))),
    ];
    const totalTimeMs = cookingSessions.reduce((sum, s) => sum + (s.totalTimeMs ?? 0), 0);

    // Love letters — split by direction
    const sent = loveLetters.filter((l) => l.senderId === userId).length;
    const received = loveLetters.filter((l) => l.senderId !== userId).length;

    // Achievements — resolve keys to human-readable titles
    const achievementTitles = achievements.map((a) => {
      const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.key);
      return def?.title ?? a.key;
    });

    res.json({
      week: weekStr,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      moments: { count: moments.length, photoCount, highlights },
      cooking: { count: cookingSessions.length, totalTimeMs, recipes: recipeNames },
      foodSpots: { count: foodSpots.length, names: foodSpots.map((f) => f.name) },
      datePlans: { count: datePlans.length, titles: datePlans.map((p) => p.title) },
      loveLetters: { sent, received },
      goalsCompleted: goals.length,
      achievementsUnlocked: achievementTitles,
    });
  } catch (err) {
    console.error('[recap] weekly error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Month helpers ─────────────────────────────────────────────────────────────

function monthToRange(monthStr: string): { startDate: Date; endDate: Date } {
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error('Invalid month format. Use YYYY-MM');
  const year = parseInt(match[1]!);
  const month = parseInt(match[2]!) - 1; // 0-indexed

  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)); // day=0 → last day of month

  return { startDate, endDate };
}

function previousMonthStr(): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed current month → previous month number (1-indexed)
  if (month === 0) { year -= 1; month = 12; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── GET /api/recap/monthly?month=2026-02 ─────────────────────────────────────

router.get('/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const monthStr = (req.query.month as string | undefined) || previousMonthStr();

    let startDate: Date;
    let endDate: Date;
    try {
      ({ startDate, endDate } = monthToRange(monthStr));
    } catch {
      res.status(400).json({ error: 'Invalid month format. Use YYYY-MM (e.g. 2026-02)' });
      return;
    }

    const userId = req.user!.userId;
    const gte = startDate;
    const lte = endDate;

    const [moments, cookingSessions, foodSpots, datePlans, loveLetters, goals, achievements] =
      await Promise.all([
        prisma.moment.findMany({
          where: { date: { gte, lte } },
          include: { photos: { select: { url: true } } },
          orderBy: { date: 'desc' },
        }),
        prisma.cookingSession.findMany({
          where: { completedAt: { gte, lte }, status: 'completed' },
          include: {
            recipes: { include: { recipe: { include: { photos: { select: { url: true }, take: 1 } } } } },
            photos: { select: { url: true }, take: 2 },
          },
        }),
        prisma.foodSpot.findMany({
          where: { createdAt: { gte, lte } },
          select: { name: true, photos: { select: { url: true }, take: 1 } },
        }),
        prisma.datePlan.findMany({
          where: { date: { gte, lte } },
          select: { title: true },
        }),
        prisma.loveLetter.findMany({
          where: {
            deliveredAt: { gte, lte },
            status: { in: ['DELIVERED', 'READ'] },
          },
          select: { senderId: true },
        }),
        prisma.goal.findMany({
          where: { status: 'DONE', updatedAt: { gte, lte } },
          select: { id: true },
        }),
        prisma.achievement.findMany({
          where: { unlockedAt: { gte, lte } },
        }),
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

    // Collect cooking photos from session photos + recipe cover photos
    const rawCookingPhotos: string[] = [];
    cookingSessions.forEach((s) => {
      s.photos.forEach((p) => rawCookingPhotos.push(p.url));
      s.recipes.forEach((r) => r.recipe.photos.forEach((p) => rawCookingPhotos.push(p.url)));
    });
    const cookingPhotos = [...new Set(rawCookingPhotos)].slice(0, 3);

    // Food spot photos — first photo per spot
    const foodSpotPhotos = foodSpots
      .filter((f) => f.photos[0])
      .map((f) => f.photos[0]!.url);

    const sent = loveLetters.filter((l) => l.senderId === userId).length;
    const received = loveLetters.filter((l) => l.senderId !== userId).length;

    const achievementTitles = achievements.map((a) => {
      const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.key);
      return def?.title ?? a.key;
    });

    res.json({
      month: monthStr,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      moments: { count: moments.length, photoCount, highlights },
      cooking: { count: cookingSessions.length, totalTimeMs, recipes: recipeNames, photos: cookingPhotos },
      foodSpots: { count: foodSpots.length, names: foodSpots.map((f) => f.name), photos: foodSpotPhotos },
      datePlans: { count: datePlans.length, titles: datePlans.map((p) => p.title) },
      loveLetters: { sent, received },
      goalsCompleted: goals.length,
      achievementsUnlocked: achievementTitles,
    });
  } catch (err) {
    console.error('[recap] monthly error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/recap/monthly/caption?month=2026-02 ─────────────────────────────

router.get('/monthly/caption', async (req: AuthRequest, res: Response) => {
  try {
    const monthStr = (req.query.month as string | undefined) || currentMonthStr();
    const { startDate, endDate } = monthToRange(monthStr);
    const gte = startDate;
    const lte = endDate;

    const [momentCount, cookingCount, foodSpotCount, letterCount, goalCount] = await Promise.all([
      prisma.moment.count({ where: { date: { gte, lte } } }),
      prisma.cookingSession.count({ where: { completedAt: { gte, lte }, status: 'completed' } }),
      prisma.foodSpot.count({ where: { createdAt: { gte, lte } } }),
      prisma.loveLetter.count({ where: { deliveredAt: { gte, lte }, status: { in: ['DELIVERED', 'READ'] } } }),
      prisma.goal.count({ where: { status: 'DONE', updatedAt: { gte, lte } } }),
    ]);

    if (momentCount + cookingCount + foodSpotCount + letterCount + goalCount === 0) {
      res.json({ caption: null });
      return;
    }

    const [momentTitles, cookingSessions, foodNames] = await Promise.all([
      prisma.moment.findMany({ where: { date: { gte, lte } }, select: { title: true }, take: 10 }),
      prisma.cookingSession.findMany({
        where: { completedAt: { gte, lte }, status: 'completed' },
        include: { recipes: { include: { recipe: { select: { title: true } } } } },
      }),
      prisma.foodSpot.findMany({ where: { createdAt: { gte, lte } }, select: { name: true }, take: 10 }),
    ]);

    const recipeNames = [...new Set(cookingSessions.flatMap((s) => s.recipes.map((r) => r.recipe.title)))];

    const summary = [
      `Tháng ${monthStr}:`,
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
          content: 'Bạn là trợ lý viết lời bình cho recap tháng của một cặp đôi. Viết ngắn gọn, dễ thương, tiếng Việt, tối đa 2 câu. Dùng emoji phù hợp. Giọng văn ấm áp, lãng mạn nhưng không sến.',
        },
        {
          role: 'user',
          content: `Dựa vào hoạt động tháng này, viết 1 câu caption ngắn gọn dễ thương:\n\n${summary}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const caption = completion.choices[0]?.message?.content?.trim() || null;
    res.json({ caption });
  } catch (err) {
    console.error('[recap] caption error:', err);
    res.json({ caption: null });
  }
});

export { router as recapRoutes };
