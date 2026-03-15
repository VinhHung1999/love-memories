import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as CoupleController from '../controllers/CoupleController';
import { updateCoupleSchema, createCoupleSchema, joinCoupleSchema } from '../validators/coupleSchemas';
import { requireCouple } from '../middleware/requireCouple';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Validate invite code — no requireCouple (user without couple uses this)
router.get('/validate-invite', requireAuth, CoupleController.validateInvite);
// Require existing couple for read/update
router.get('/', requireCouple, CoupleController.getCouple);
router.put('/', requireCouple, validate(updateCoupleSchema), CoupleController.update);
router.post('/generate-invite', requireCouple, CoupleController.generateInvite);
// Create/join: no requireCouple — user reaches here before having a couple
router.post('/', validate(createCoupleSchema), CoupleController.createCouple);
router.post('/join', validate(joinCoupleSchema), CoupleController.joinCouple);

export const coupleRoutes = router;
