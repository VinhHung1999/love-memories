import { Router } from 'express';
import { validate } from '../middleware/validate';
import { setVibeSchema } from '../validators/dailyVibeSchemas';
import * as DailyVibeController from '../controllers/DailyVibeController';

const router = Router();

router.get('/today', DailyVibeController.getToday);
router.post('/today', validate(setVibeSchema), DailyVibeController.setToday);

export const dailyVibeRoutes = router;
