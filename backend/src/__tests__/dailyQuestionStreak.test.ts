// Sprint 66 T431 — VN-timezone + idempotent streak counter regression suite.
// Phase 1B (Boss directive 2026-04-28) — mocked via prismock per the
// "tests must not touch a real DB" rule. Concurrency note: prismock's
// `$transaction(callback)` does NOT actually serialize; this suite
// validates the streak rotation + idempotency LOGIC but no longer
// proves real Postgres race-safety. Backlog `B-streak-race-integration-
// test` tracks re-introducing concurrency tests via an ephemeral DB
// container in CI (separate from `npm test`).
//
// `jest.useFakeTimers()` + `setSystemTime()` still controls `new Date()`
// so the VN-midnight boundary (UTC 17:00) is exercised without sleeping.
jest.mock('../utils/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismockClient } = require('prismock');
  const instance = new PrismockClient();
  return { __esModule: true, default: instance };
});

import crypto from 'crypto';
import prisma from '../utils/prisma';
import {
  getStreak,
  getQuestionIdForDay,
  updateStreakOnBothAnswered,
  updateStreaksForAllCouples,
  submitAnswer,
} from '../services/DailyQuestionService';
import { dayNumberVN, parseLocalIso, toLocalIso } from '../utils/dateVN';

const COUPLE_ID = 'streak-test-couple';
const USER_A = 'streak-test-user-a';
const USER_B = 'streak-test-user-b';
const QUESTION_COUNT = 64; // > 30 so consecutive days rotate to different rows

// VN-day helpers expressed as concrete UTC instants for clarity in tests.
//   vnInstant(day, hh, mm?) → the UTC `Date` for VN <day> at hh:mm.
function vnInstant(isoDay: string, hour: number, minute = 0): Date {
  const midnight = parseLocalIso(isoDay);
  return new Date(midnight.getTime() + (hour * 60 + minute) * 60 * 1000);
}

// Resolves the question that production maps `coupleId-day` to. Wraps the
// service helper so tests stay coupled to the real lookup logic — if the
// hash or rotation changes, this still picks the right row.
async function questionForDay(coupleId: string, day: number): Promise<string> {
  const id = await getQuestionIdForDay(coupleId, day);
  if (!id) throw new Error(`No question for ${coupleId}-${day} (DB empty?)`);
  return id;
}

async function seedAnswer(questionId: string, userId: string, when: Date) {
  await prisma.dailyQuestionResponse.create({
    data: {
      questionId,
      coupleId: COUPLE_ID,
      userId,
      answer: `seeded ${userId} ${when.toISOString()}`,
      createdAt: when,
    },
  });
}

async function setStreak(currentStreak: number, lastAnsweredDate: Date | null) {
  await prisma.dailyQuestionStreak.upsert({
    where: { coupleId: COUPLE_ID },
    create: {
      id: crypto.randomUUID(),
      coupleId: COUPLE_ID,
      currentStreak,
      longestStreak: currentStreak,
      lastAnsweredDate,
    },
    update: { currentStreak, longestStreak: currentStreak, lastAnsweredDate },
  });
}

// Fake-timers config: ONLY mock Date. Everything else (setTimeout,
// setImmediate, microtasks, process.nextTick, hrtime, performance) flows
// natively so Prisma's connection pool + tx promises don't deadlock.
function setNow(date: Date) {
  jest.useFakeTimers({
    now: date,
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
  jest.setSystemTime(date);
}

async function clearResponsesAndStreak() {
  await prisma.dailyQuestionResponse.deleteMany({ where: { coupleId: COUPLE_ID } });
  await prisma.dailyQuestionStreak.deleteMany({ where: { coupleId: COUPLE_ID } });
}

beforeAll(async () => {
  // Use real timers while we provision DB fixtures so Prisma's
  // internal pool isn't starved waiting on faked setTimeouts.
  jest.useRealTimers();

  // Couple + 2 users (foreign keys on the streak + response rows).
  await prisma.dailyQuestionResponse.deleteMany({ where: { coupleId: COUPLE_ID } });
  await prisma.dailyQuestionStreak.deleteMany({ where: { coupleId: COUPLE_ID } });
  await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
  await prisma.couple.deleteMany({ where: { id: COUPLE_ID } });

  await prisma.couple.create({
    data: { id: COUPLE_ID, name: 'Streak Test Couple', createdAt: new Date() },
  });
  await prisma.user.createMany({
    data: [
      { id: USER_A, email: 'streak-a@test.local', name: 'A', coupleId: COUPLE_ID },
      { id: USER_B, email: 'streak-b@test.local', name: 'B', coupleId: COUPLE_ID },
    ],
  });

  // Ensure the question pool is large enough that two consecutive VN days
  // are very unlikely to hash to the same row (avoids a confusing dev-DB
  // state where day X and day X+1 reuse responses). We tag with a unique
  // category for cleanup.
  const existing = await prisma.dailyQuestion.count({ where: { category: 'streak-test' } });
  if (existing < QUESTION_COUNT) {
    await prisma.dailyQuestion.deleteMany({ where: { category: 'streak-test' } });
    await Promise.all(
      Array.from({ length: QUESTION_COUNT }).map((_, i) =>
        prisma.dailyQuestion.create({
          data: {
            text: `Streak test question ${i}`,
            textVi: `Câu hỏi test streak ${i}`,
            category: 'streak-test',
            order: 10_000 + i,
          },
        }),
      ),
    );
  }
});

afterAll(async () => {
  jest.useRealTimers();
  await prisma.dailyQuestionResponse.deleteMany({ where: { coupleId: COUPLE_ID } });
  await prisma.dailyQuestionStreak.deleteMany({ where: { coupleId: COUPLE_ID } });
  await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
  await prisma.couple.deleteMany({ where: { id: COUPLE_ID } });
  await prisma.dailyQuestion.deleteMany({ where: { category: 'streak-test' } });
});

beforeEach(async () => {
  jest.useRealTimers();
  await clearResponsesAndStreak();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('DailyQuestionStreak — VN tz + idempotency', () => {
  test('1) fresh couple, both answer at VN noon → streak = 1', async () => {
    const day = '2026-05-10';
    setNow(vnInstant(day, 12));

    const qid = await questionForDay(COUPLE_ID, dayNumberVN());
    await seedAnswer(qid, USER_A, new Date());
    await seedAnswer(qid, USER_B, new Date());

    await updateStreakOnBothAnswered(COUPLE_ID);

    const streak = await getStreak(COUPLE_ID);
    expect(streak.currentStreak).toBe(1);
    expect(toLocalIso(streak.lastAnsweredDate!)).toBe(day);
    expect(streak.completedToday).toBe(true);
  });

  test('2) streak=5 yesterday, both answer today → streak = 6', async () => {
    const yesterday = '2026-05-10';
    const today = '2026-05-11';

    // Pre-existing streak ends at yesterday VN midnight.
    await setStreak(5, parseLocalIso(yesterday));

    setNow(vnInstant(today, 9));

    const qid = await questionForDay(COUPLE_ID, dayNumberVN());
    await seedAnswer(qid, USER_A, new Date());
    await seedAnswer(qid, USER_B, new Date());

    await updateStreakOnBothAnswered(COUPLE_ID);

    const streak = await getStreak(COUPLE_ID);
    expect(streak.currentStreak).toBe(6);
    expect(toLocalIso(streak.lastAnsweredDate!)).toBe(today);
  });

  test('3) only one partner answers → next 0AM cron resets streak', async () => {
    const yesterday = '2026-05-12';
    const today = '2026-05-13';
    const cronTick = '2026-05-14';

    await setStreak(5, parseLocalIso(yesterday));

    // Day "today" — only USER_A answers.
    setNow(vnInstant(today, 14));
    const qid = await questionForDay(COUPLE_ID, dayNumberVN());
    await seedAnswer(qid, USER_A, new Date());

    // Cron fires at next 0AM VN (start of cronTick).
    setNow(vnInstant(cronTick, 0));
    await updateStreaksForAllCouples();

    const streak = await getStreak(COUPLE_ID);
    expect(streak.currentStreak).toBe(0);
    expect(streak.lastAnsweredDate).toBeNull();
    // longestStreak preserved.
    const row = await prisma.dailyQuestionStreak.findUnique({ where: { coupleId: COUPLE_ID } });
    expect(row?.longestStreak).toBe(5);
  });

  test('4) VN-midnight edge: both answer 23:55, cron at 00:00 next day → +1 not reset', async () => {
    const dayX = '2026-05-15';
    const dayXPlus1 = '2026-05-16';

    await setStreak(3, parseLocalIso('2026-05-14'));

    // 23:55 VN day X = UTC 16:55 day X.
    setNow(vnInstant(dayX, 23, 55));
    const qid = await questionForDay(COUPLE_ID, dayNumberVN());
    expect(toLocalIso(new Date())).toBe(dayX); // sanity: still VN day X
    await seedAnswer(qid, USER_A, new Date());
    await seedAnswer(qid, USER_B, new Date());

    // Cron fires at 00:00 VN day X+1 = UTC 17:00 day X.
    setNow(vnInstant(dayXPlus1, 0));
    expect(toLocalIso(new Date())).toBe(dayXPlus1); // sanity: now VN day X+1
    await updateStreaksForAllCouples();

    const streak = await getStreak(COUPLE_ID);
    expect(streak.currentStreak).toBe(4); // 3 + 1, NOT reset to 0
    expect(toLocalIso(streak.lastAnsweredDate!)).toBe(dayX);
  });

  test('5) double-tap by same partner → 409 + streak unchanged', async () => {
    const day = '2026-05-17';
    setNow(vnInstant(day, 10));

    const qid = await questionForDay(COUPLE_ID, dayNumberVN());
    await submitAnswer(qid, COUPLE_ID, USER_A, 'first try');

    await expect(
      submitAnswer(qid, COUPLE_ID, USER_A, 'second try'),
    ).rejects.toMatchObject({ statusCode: 409 });

    // Partner hasn't answered → streak should NOT have been touched yet.
    const streak = await getStreak(COUPLE_ID);
    expect(streak.currentStreak).toBe(0);
  });

  test('6) cron + realtime double-fire — same logical event → +1 only', async () => {
    const dayX = '2026-05-18';
    const dayXPlus1 = '2026-05-19';

    await setStreak(2, parseLocalIso('2026-05-17'));

    // Realtime: both answer at 23:50 VN day X.
    setNow(vnInstant(dayX, 23, 50));
    const qid = await questionForDay(COUPLE_ID, dayNumberVN());
    await seedAnswer(qid, USER_A, new Date());
    await seedAnswer(qid, USER_B, new Date());
    await updateStreakOnBothAnswered(COUPLE_ID);

    let streak = await getStreak(COUPLE_ID);
    expect(streak.currentStreak).toBe(3);
    expect(toLocalIso(streak.lastAnsweredDate!)).toBe(dayX);

    // Cron at 00:00 VN day X+1 — yesterdayVN points back at day X.
    // Existing.lastAnsweredDate already == day X → idempotent skip.
    setNow(vnInstant(dayXPlus1, 0));
    await updateStreaksForAllCouples();

    streak = await getStreak(COUPLE_ID);
    expect(streak.currentStreak).toBe(3); // NOT 4
    expect(toLocalIso(streak.lastAnsweredDate!)).toBe(dayX);
  });

  test('7) re-pair → fresh couple starts at streak 0', async () => {
    // Pre-existing streak on the original couple.
    await setStreak(10, parseLocalIso('2026-05-20'));

    // New couple = fresh coupleId. The old streak row is keyed on COUPLE_ID,
    // so the new couple has no row at all.
    const newCoupleId = 'streak-test-couple-repaired';
    await prisma.dailyQuestionStreak.deleteMany({ where: { coupleId: newCoupleId } });
    await prisma.couple.deleteMany({ where: { id: newCoupleId } });
    await prisma.couple.create({
      data: { id: newCoupleId, name: 'Re-paired', createdAt: new Date() },
    });

    try {
      const fresh = await getStreak(newCoupleId);
      expect(fresh.currentStreak).toBe(0);
      expect(fresh.longestStreak).toBe(0);
      expect(fresh.lastAnsweredDate).toBeNull();

      // Original couple's streak is untouched by the re-pair.
      const original = await getStreak(COUPLE_ID);
      expect(original.currentStreak).toBe(10);
    } finally {
      await prisma.couple.deleteMany({ where: { id: newCoupleId } });
    }
  });
});
