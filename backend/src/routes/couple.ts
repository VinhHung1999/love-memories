import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as CoupleController from '../controllers/CoupleController';
import { updateCoupleSchema, createCoupleSchema, joinCoupleSchema } from '../validators/coupleSchemas';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', CoupleController.getCouple);
router.put('/', validate(updateCoupleSchema), CoupleController.update);
router.post('/generate-invite', CoupleController.generateInvite);
router.post('/', requireAuth, validate(createCoupleSchema), CoupleController.createCouple);
router.post('/join', requireAuth, validate(joinCoupleSchema), CoupleController.joinCouple);

export const coupleRoutes = router;
