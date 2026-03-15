import type { RequestHandler } from 'express';
import type { AuthRequest } from './auth';

export const requireCouple: RequestHandler = (req, res, next) => {
  if (!(req as AuthRequest).user?.coupleId) {
    res.status(400).json({ error: 'Couple setup required. Please complete onboarding.' });
    return;
  }
  next();
};
