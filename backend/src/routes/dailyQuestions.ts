import { Router } from 'express';
import { validate } from '../middleware/validate';
import { answerSchema } from '../validators/dailyQuestionSchemas';
import * as DailyQuestionController from '../controllers/DailyQuestionController';

const router = Router();

router.get('/today', DailyQuestionController.getToday);
router.get('/streak', DailyQuestionController.getStreak);
router.get('/history', DailyQuestionController.getHistory);
router.post('/:id/answer', validate(answerSchema), DailyQuestionController.submitAnswer);

export const dailyQuestionRoutes = router;
