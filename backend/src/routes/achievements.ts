import { Router } from 'express';
import * as AchievementController from '../controllers/AchievementController';

const router = Router();

router.get('/', AchievementController.list);

export { router as achievementRoutes };
