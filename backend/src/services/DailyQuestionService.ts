import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AppError } from '../types/errors';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import { dayNumberVN, startOfDayVN } from '../utils/dateVN';

// Question rotation is keyed on the VN calendar day, not raw UTC. Cron at
// VN midnight (UTC 17:00 prev day) needs `dayNumberVN(now) - 1` to point at
// what users actually saw "yesterday VN" — see utils/dateVN.ts.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function getToday(coupleId: string, userId: string) {
  const total = await prisma.dailyQuestion.count();
  if (total === 0) throw new AppError(404, 'No questions available');

  const dayNumber = dayNumberVN();
  const key = `${coupleId}-${dayNumber}`;
  const index = hashString(key) % total;

  // Get question by order offset (sorted by order then createdAt for stability)
  const questions = await prisma.dailyQuestion.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    skip: index,
    take: 1,
  });
  const question = questions[0];
  if (!question) throw new AppError(404, 'Question not found');

  // Get responses for this question + couple
  const responses = await prisma.dailyQuestionResponse.findMany({
    where: { questionId: question.id, coupleId },
  });

  const myResponse = responses.find((r) => r.userId === userId);

  // Get partner info
  const partner = await prisma.user.findFirst({
    where: { coupleId, id: { not: userId } },
    select: { id: true, name: true },
  });

  const partnerResponse = partner ? responses.find((r) => r.userId === partner!.id) : undefined;

  // Partner answer hidden until user has answered
  const userHasAnswered = !!myResponse;

  return {
    question: {
      id: question.id,
      text: question.text,
      textVi: question.textVi,
      category: question.category,
    },
    myAnswer: myResponse?.answer ?? null,
    partnerAnswer: userHasAnswered ? (partnerResponse?.answer ?? null) : null,
    partnerName: partner?.name ?? null,
  };
}

// Realtime streak update fired when the second partner submits today's
// answer. Wrapped in a transaction + idempotent against `lastAnsweredDate`
// so the cron path (updateStreaksForAllCouples) and a near-simultaneous
// double submit cannot double-increment. Sprint 66 T430.
//
// Chain rule: if the previous `lastAnsweredDate` is yesterday VN, continue
// the chain (+1). Otherwise the chain broke (gap day or first-ever) so we
// start at 1.
export async function updateStreakOnBothAnswered(coupleId: string): Promise<void> {
  const now = new Date();
  const todayVN = startOfDayVN(now);
  const yesterdayVN = new Date(todayVN.getTime() - 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.dailyQuestionStreak.findUnique({ where: { coupleId } });

    // Already counted today (cron beat us, or both partners' submit handlers
    // raced) — leave the row untouched.
    if (existing?.lastAnsweredDate && existing.lastAnsweredDate.getTime() === todayVN.getTime()) {
      return;
    }

    const continuing =
      existing?.lastAnsweredDate &&
      existing.lastAnsweredDate.getTime() === yesterdayVN.getTime();
    const newCurrent = continuing ? (existing!.currentStreak ?? 0) + 1 : 1;
    const newLongest = Math.max(existing?.longestStreak ?? 0, newCurrent);

    await tx.dailyQuestionStreak.upsert({
      where: { coupleId },
      create: {
        id: crypto.randomUUID(),
        coupleId,
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastAnsweredDate: todayVN,
      },
      update: {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastAnsweredDate: todayVN,
      },
    });
  });
}

export async function submitAnswer(questionId: string, coupleId: string, userId: string, answer: string) {
  // Verify question exists
  const question = await prisma.dailyQuestion.findUnique({ where: { id: questionId } });
  if (!question) throw new AppError(404, 'Question not found');

  // Check for duplicate
  const existing = await prisma.dailyQuestionResponse.findUnique({
    where: { questionId_coupleId_userId: { questionId, coupleId, userId } },
  });
  if (existing) throw new AppError(409, 'Already answered this question');

  const response = await prisma.dailyQuestionResponse.create({
    data: { questionId, coupleId, userId, answer },
    include: { question: { select: { id: true, text: true, textVi: true, category: true } } },
  });

  // Notify partner that user has answered, encouraging them to answer too
  const partnerId = await getPartnerUserId(userId, coupleId);
  if (partnerId) {
    createNotification(
      partnerId,
      'daily_question_partner_answered',
      'Người ấy đã trả lời! 💕',
      'Người ấy đã trả lời câu hỏi hôm nay! Xem ngay nào 💕',
      '/daily-questions',
    ).catch(() => {});

    // Realtime streak update: check if partner already answered today's question
    const partnerResponse = await prisma.dailyQuestionResponse.findUnique({
      where: { questionId_coupleId_userId: { questionId, coupleId, userId: partnerId } },
    });
    if (partnerResponse) {
      updateStreakOnBothAnswered(coupleId).catch(() => {});
    }
  }

  return response;
}

// Resolves the question shown to `coupleId` on the given VN dayNumber. Sole
// entry point for the `(coupleId, day) → questionId` lookup used by today's
// fetch, the cron sweep, and tests.
export async function getQuestionIdForDay(
  coupleId: string,
  dayNumber: number,
): Promise<string | null> {
  const total = await prisma.dailyQuestion.count();
  if (total === 0) return null;
  const key = `${coupleId}-${dayNumber}`;
  const index = hashString(key) % total;
  const questions = await prisma.dailyQuestion.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    skip: index,
    take: 1,
    select: { id: true },
  });
  return questions[0]?.id ?? null;
}

/**
 * Returns today's question ID for a given couple.
 * Used by CronService to check who hasn't answered yet.
 */
export async function getTodayQuestionId(coupleId: string): Promise<string | null> {
  return getQuestionIdForDay(coupleId, dayNumberVN());
}

/**
 * Get or initialize the streak record for a couple.
 */
export async function getStreak(coupleId: string) {
  const streak = await prisma.dailyQuestionStreak.findUnique({
    where: { coupleId },
  });

  // Check if both partners answered today's question
  const todayQuestionId = await getTodayQuestionId(coupleId);
  let completedToday = false;
  if (todayQuestionId) {
    const todayCount = await prisma.dailyQuestionResponse.count({
      where: { questionId: todayQuestionId, coupleId },
    });
    completedToday = todayCount >= 2;
  }

  if (!streak) {
    return { currentStreak: 0, longestStreak: 0, lastAnsweredDate: null, completedToday };
  }
  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastAnsweredDate: streak.lastAnsweredDate,
    completedToday,
  };
}

// Cron at VN midnight (Asia/Ho_Chi_Minh '0 0 * * *') — sweeps every couple
// for what happened "yesterday VN". Two outcomes per couple:
//
//   bothAnswered yesterday VN
//     → if existing.lastAnsweredDate already == yesterdayVN, the realtime
//       path beat us; leave it (idempotent — no double-increment).
//     → else continue/start the chain: +1 if previous lastAnsweredDate is
//       day-before-yesterday VN; otherwise fresh chain at 1.
//
//   not bothAnswered yesterday VN
//     → reset currentStreak to 0, clear lastAnsweredDate. The chain broke.
//
// Sprint 66 T429 (VN tz) + T430 (idempotent + reset chain).
export async function updateStreaksForAllCouples(now: Date = new Date()): Promise<void> {
  const todayVN = startOfDayVN(now);
  const msPerDay = 24 * 60 * 60 * 1000;
  const yesterdayVN = new Date(todayVN.getTime() - msPerDay);
  const dayBeforeYesterdayVN = new Date(todayVN.getTime() - 2 * msPerDay);
  const yesterdayNumber = dayNumberVN(now) - 1;

  const total = await prisma.dailyQuestion.count();
  if (total === 0) return;

  const couples = await prisma.couple.findMany({
    include: { users: { select: { id: true } } },
  });

  for (const couple of couples) {
    if (couple.users.length < 2) continue;

    // Lookup the question users actually saw on yesterday VN.
    const key = `${couple.id}-${yesterdayNumber}`;
    const index = hashString(key) % total;
    const questions = await prisma.dailyQuestion.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      skip: index,
      take: 1,
      select: { id: true },
    });
    const questionId = questions[0]?.id;
    if (!questionId) continue;

    const responses = await prisma.dailyQuestionResponse.findMany({
      where: { questionId, coupleId: couple.id },
      select: { userId: true },
    });
    const answeredIds = new Set(responses.map((r) => r.userId));
    const bothAnswered = couple.users.every((u) => answeredIds.has(u.id));

    await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyQuestionStreak.findUnique({
        where: { coupleId: couple.id },
      });

      if (bothAnswered) {
        // Realtime already counted this — bail out cleanly.
        if (
          existing?.lastAnsweredDate &&
          existing.lastAnsweredDate.getTime() === yesterdayVN.getTime()
        ) {
          return;
        }

        const continuing =
          existing?.lastAnsweredDate &&
          existing.lastAnsweredDate.getTime() === dayBeforeYesterdayVN.getTime();
        const newCurrent = continuing ? (existing!.currentStreak ?? 0) + 1 : 1;
        const newLongest = Math.max(existing?.longestStreak ?? 0, newCurrent);

        await tx.dailyQuestionStreak.upsert({
          where: { coupleId: couple.id },
          create: {
            id: crypto.randomUUID(),
            coupleId: couple.id,
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastAnsweredDate: yesterdayVN,
          },
          update: {
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastAnsweredDate: yesterdayVN,
          },
        });
        return;
      }

      // Chain broken — reset.
      if (!existing) return; // never had a streak; nothing to reset
      if (existing.currentStreak === 0 && existing.lastAnsweredDate === null) return;
      await tx.dailyQuestionStreak.update({
        where: { coupleId: couple.id },
        data: {
          currentStreak: 0,
          lastAnsweredDate: null,
        },
      });
    });
  }
}

export async function getHistory(coupleId: string, userId: string, page: number, limit: number) {
  // Get all questions this couple has answered (at least one partner responded)
  const responses = await prisma.dailyQuestionResponse.findMany({
    where: { coupleId },
    include: { question: { select: { id: true, text: true, textVi: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Group by questionId
  const byQuestion = new Map<string, { question: typeof responses[0]['question']; responses: typeof responses }>();
  for (const r of responses) {
    if (!byQuestion.has(r.questionId)) {
      byQuestion.set(r.questionId, { question: r.question, responses: [] });
    }
    byQuestion.get(r.questionId)!.responses.push(r);
  }

  // Get partner info once
  const partner = await prisma.user.findFirst({
    where: { coupleId, id: { not: userId } },
    select: { id: true, name: true },
  });

  // Build result array (sorted by most recent response)
  const allItems = Array.from(byQuestion.values()).map(({ question, responses: rs }) => {
    const myResponse = rs.find((r) => r.userId === userId);
    const partnerResponse = partner ? rs.find((r) => r.userId === partner.id) : undefined;
    return {
      question,
      myAnswer: myResponse?.answer ?? null,
      myAnsweredAt: myResponse?.createdAt ?? null,
      partnerAnswer: partnerResponse?.answer ?? null,
      partnerName: partner?.name ?? null,
    };
  });

  const total = allItems.length;
  const start = (page - 1) * limit;
  const items = allItems.slice(start, start + limit);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
