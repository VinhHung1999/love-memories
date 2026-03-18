import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AppError } from '../types/errors';
import { createNotification, getPartnerUserId } from '../utils/notifications';

/**
 * Deterministic daily question selection:
 * dayNumber = days since epoch. hash(coupleId + dayNumber) % totalQuestions
 */
function getDayNumber(): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor(Date.now() / msPerDay);
}

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

  const dayNumber = getDayNumber();
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

/**
 * Update streak immediately when both partners have answered today's question.
 * Edge case: if lastAnsweredDate is already today, skip (already incremented).
 */
async function updateStreakOnBothAnswered(coupleId: string): Promise<void> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyQuestionStreak.findUnique({ where: { coupleId } });

  // Already updated today — don't double-increment
  if (existing?.lastAnsweredDate && existing.lastAnsweredDate >= todayStart) return;

  const newCurrent = (existing?.currentStreak ?? 0) + 1;
  const newLongest = Math.max(existing?.longestStreak ?? 0, newCurrent);
  const today = new Date();

  await prisma.dailyQuestionStreak.upsert({
    where: { coupleId },
    create: {
      id: crypto.randomUUID(),
      coupleId,
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastAnsweredDate: today,
    },
    update: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastAnsweredDate: today,
    },
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

/**
 * Returns today's question ID for a given couple.
 * Used by CronService to check who hasn't answered yet.
 */
export async function getTodayQuestionId(coupleId: string): Promise<string | null> {
  const total = await prisma.dailyQuestion.count();
  if (total === 0) return null;
  const key = `${coupleId}-${getDayNumber()}`;
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

/**
 * Called by cron at midnight: checks if both partners answered yesterday's question.
 * Increments or resets streak accordingly.
 */
export async function updateStreaksForAllCouples(): Promise<void> {
  const msPerDay = 24 * 60 * 60 * 1000;
  const yesterdayNumber = Math.floor(Date.now() / msPerDay) - 1;

  const couples = await prisma.couple.findMany({
    include: { users: { select: { id: true } } },
  });

  for (const couple of couples) {
    if (couple.users.length < 2) continue;

    // Get yesterday's question for this couple
    const total = await prisma.dailyQuestion.count();
    if (total === 0) continue;
    const key = `${couple.id}-${yesterdayNumber}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash) % total;
    const questions = await prisma.dailyQuestion.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      skip: index,
      take: 1,
      select: { id: true },
    });
    const questionId = questions[0]?.id;
    if (!questionId) continue;

    // Check if both partners answered yesterday's question
    const responses = await prisma.dailyQuestionResponse.findMany({
      where: { questionId, coupleId: couple.id },
      select: { userId: true },
    });
    const answeredIds = new Set(responses.map((r) => r.userId));
    const bothAnswered = couple.users.every((u) => answeredIds.has(u.id));

    // Calculate yesterday date for lastAnsweredDate
    const yesterday = new Date(yesterdayNumber * msPerDay);

    const existing = await prisma.dailyQuestionStreak.findUnique({ where: { coupleId: couple.id } });
    const newCurrent = bothAnswered ? (existing?.currentStreak ?? 0) + 1 : 0;
    const newLongest = Math.max(existing?.longestStreak ?? 0, newCurrent);

    await prisma.dailyQuestionStreak.upsert({
      where: { coupleId: couple.id },
      create: {
        id: crypto.randomUUID(),
        coupleId: couple.id,
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastAnsweredDate: bothAnswered ? yesterday : null,
      },
      update: {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastAnsweredDate: bothAnswered ? yesterday : undefined,
      },
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
