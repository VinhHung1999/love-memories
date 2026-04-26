import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AppError } from '../types/errors';
import { toLocalIso } from '../utils/dateVN';

// Sprint 66 T435 — per-couple daily vibe.
// One row per (coupleId, dayKey-VN). The mobile picker offers 5 fixed
// presets (mirrors prototype recap.jsx:1242 chip set). Either partner
// can set/replace; the row resets when the VN day rolls over (no row
// for today = no vibe yet).

export const VIBE_KEYS = ['coffee', 'rain', 'missing', 'trinh', 'sun'] as const;
export type VibeKey = (typeof VIBE_KEYS)[number];

function isVibeKey(value: unknown): value is VibeKey {
  return typeof value === 'string' && (VIBE_KEYS as readonly string[]).includes(value);
}

export type DailyVibeRow = {
  vibeKey: VibeKey;
  createdById: string;
  dayKey: string;
};

export async function getTodayVibe(coupleId: string): Promise<DailyVibeRow | null> {
  const dayKey = toLocalIso();
  const row = await prisma.dailyVibe.findUnique({
    where: { coupleId_dayKey: { coupleId, dayKey } },
    select: { vibeKey: true, createdById: true, dayKey: true },
  });
  if (!row) return null;
  return {
    vibeKey: row.vibeKey as VibeKey,
    createdById: row.createdById,
    dayKey: row.dayKey,
  };
}

export async function setTodayVibe(
  coupleId: string,
  userId: string,
  vibeKey: string,
): Promise<DailyVibeRow> {
  if (!isVibeKey(vibeKey)) {
    throw new AppError(400, `Invalid vibeKey '${vibeKey}'. Must be one of: ${VIBE_KEYS.join(', ')}`);
  }
  const dayKey = toLocalIso();
  const row = await prisma.dailyVibe.upsert({
    where: { coupleId_dayKey: { coupleId, dayKey } },
    create: {
      id: crypto.randomUUID(),
      coupleId,
      vibeKey,
      dayKey,
      createdById: userId,
    },
    update: {
      vibeKey,
      createdById: userId,
    },
    select: { vibeKey: true, createdById: true, dayKey: true },
  });
  return {
    vibeKey: row.vibeKey as VibeKey,
    createdById: row.createdById,
    dayKey: row.dayKey,
  };
}
