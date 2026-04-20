import { Router } from 'express';
import * as CoupleController from '../controllers/CoupleController';

// T289 — dedicated /api/invite namespace per spec. Currently a single
// endpoint; if more invite-shaped operations land later (e.g. invite via
// email / accept-invite-by-token), add them here rather than further
// crowding /api/couple. requireAuth is applied at the master router.
const router = Router();

router.get('/me', CoupleController.getMyInvite);

export const inviteRoutes = router;
