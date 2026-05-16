import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as MapService from '../services/MapService';
import type { AuthRequest } from '../middleware/auth';
import { AppError } from '../types/errors';

export const getPins = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pins = await MapService.getPins(req.user!.coupleId!);
  res.json(pins);
});

// T472 — `GET /api/map/moments?bounds=south,west,north,east` — pin payload for
// the Memory Map screen. Mapbox `onCameraChanged` recomputes the bbox + refetches
// so the client only holds the visible pins. Query-string parsing stays inline:
// existing /map routes don't use Zod for query params, no need to introduce it
// for a single 4-number tuple.
export const getMomentsInBounds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const raw = typeof req.query.bounds === 'string' ? req.query.bounds : '';
  const parts = raw.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new AppError(400, 'bounds must be in form south,west,north,east (4 finite numbers)');
  }
  const [south, west, north, east] = parts;
  if (south > north || west > east) {
    throw new AppError(400, 'bounds order is south,west,north,east — SW corner must be ≤ NE corner');
  }
  const moments = await MapService.getMomentsInBounds(req.user!.coupleId!, {
    south,
    west,
    north,
    east,
  });
  res.json(moments);
});
