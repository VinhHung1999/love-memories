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

  // Task 4 — Notify partner that user has answered, encouraging them to answer too
  const partnerId = await getPartnerUserId(userId, coupleId);
  if (partnerId) {
    createNotification(
      partnerId,
      'daily_question_partner_answered',
      'Người ấy đã trả lời! 💕',
      'Người ấy đã trả lời câu hỏi hôm nay! Xem ngay nào 💕',
      '/daily-questions',
    ).catch(() => {});
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
