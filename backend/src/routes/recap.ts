import { Router } from 'express';
import * as RecapController from '../controllers/RecapController';

const router = Router();

router.get('/weekly', RecapController.weekly);
router.get('/monthly/caption', RecapController.monthlyCaption);
router.get('/monthly', RecapController.monthly);

export { router as recapRoutes };
