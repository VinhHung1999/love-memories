// Sprint 66 T435 — DailyVibe service tests against real dev Postgres.
// Same Date-only fake-timers pattern as dailyQuestionStreak tests so the
// VN-midnight rollover scenario uses controlled clock without polluting
// Prisma's internal pollers.

import prisma from '../utils/prisma';
import { getTodayVibe, setTodayVibe, VIBE_KEYS } from '../services/DailyVibeService';
import { parseLocalIso, toLocalIso } from '../utils/dateVN';

const COUPLE_ID = 'vibe-test-couple';
const USER_A = 'vibe-test-user-a';
const USER_B = 'vibe-test-user-b';

function vnInstant(isoDay: string, hour: number, minute = 0): Date {
  const midnight = parseLocalIso(isoDay);
  return new Date(midnight.getTime() + (hour * 60 + minute) * 60 * 1000);
}

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

beforeAll(async () => {
  jest.useRealTimers();
  await prisma.dailyVibe.deleteMany({ where: { coupleId: COUPLE_ID } });
  await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
  await prisma.couple.deleteMany({ where: { id: COUPLE_ID } });

  await prisma.couple.create({
    data: { id: COUPLE_ID, name: 'Vibe Test Couple', createdAt: new Date() },
  });
  await prisma.user.createMany({
    data: [
      { id: USER_A, email: 'vibe-a@test.local', name: 'A', coupleId: COUPLE_ID },
      { id: USER_B, email: 'vibe-b@test.local', name: 'B', coupleId: COUPLE_ID },
    ],
  });
});

afterAll(async () => {
  jest.useRealTimers();
  await prisma.dailyVibe.deleteMany({ where: { coupleId: COUPLE_ID } });
  await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
  await prisma.couple.deleteMany({ where: { id: COUPLE_ID } });
});

beforeEach(async () => {
  jest.useRealTimers();
  await prisma.dailyVibe.deleteMany({ where: { coupleId: COUPLE_ID } });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('DailyVibe — set + get + VN day rollover', () => {
  test('1) set + get returns the same vibe for today VN', async () => {
    setNow(vnInstant('2026-06-01', 10));
    await setTodayVibe(COUPLE_ID, USER_A, 'coffee');

    const today = await getTodayVibe(COUPLE_ID);
    expect(today).toEqual({
      vibeKey: 'coffee',
      createdById: USER_A,
      dayKey: '2026-06-01',
    });
  });

  test('2) replace within the same day → upsert + same row', async () => {
    setNow(vnInstant('2026-06-02', 9));
    await setTodayVibe(COUPLE_ID, USER_A, 'rain');
    await setTodayVibe(COUPLE_ID, USER_B, 'sun');

    const today = await getTodayVibe(COUPLE_ID);
    expect(today?.vibeKey).toBe('sun');
    expect(today?.createdById).toBe(USER_B);

    const rows = await prisma.dailyVibe.count({ where: { coupleId: COUPLE_ID } });
    expect(rows).toBe(1);
  });

  test('3) invalid vibeKey throws 400', async () => {
    setNow(vnInstant('2026-06-03', 12));
    await expect(setTodayVibe(COUPLE_ID, USER_A, 'pizza')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('4) all 5 preset keys accepted', async () => {
    setNow(vnInstant('2026-06-04', 12));
    for (const key of VIBE_KEYS) {
      await setTodayVibe(COUPLE_ID, USER_A, key);
      const today = await getTodayVibe(COUPLE_ID);
      expect(today?.vibeKey).toBe(key);
    }
  });

  test('5) VN-midnight edge: set at 23:55, query at 00:05 next day → null', async () => {
    setNow(vnInstant('2026-06-05', 23, 55));
    await setTodayVibe(COUPLE_ID, USER_A, 'trinh');
    const before = await getTodayVibe(COUPLE_ID);
    expect(before?.dayKey).toBe('2026-06-05');

    setNow(vnInstant('2026-06-06', 0, 5));
    const after = await getTodayVibe(COUPLE_ID);
    expect(after).toBeNull();
    expect(toLocalIso()).toBe('2026-06-06');

    // The previous day's row is still there, just not "today's".
    const previousDay = await prisma.dailyVibe.findFirst({
      where: { coupleId: COUPLE_ID, dayKey: '2026-06-05' },
    });
    expect(previousDay?.vibeKey).toBe('trinh');
  });

  test('6) get with no row returns null', async () => {
    setNow(vnInstant('2026-06-07', 14));
    const today = await getTodayVibe(COUPLE_ID);
    expect(today).toBeNull();
  });
});
