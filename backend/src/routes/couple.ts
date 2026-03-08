import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as CoupleController from '../controllers/CoupleController';
import { updateCoupleSchema } from '../validators/coupleSchemas';

const router = Router();

router.get('/', CoupleController.getCouple);
router.put('/', validate(updateCoupleSchema), CoupleController.update);
router.post('/generate-invite', CoupleController.generateInvite);

export const coupleRoutes = router;
