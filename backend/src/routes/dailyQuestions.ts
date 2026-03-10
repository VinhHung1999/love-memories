import { Router } from 'express';
import { validate } from '../middleware/validate';
import { answerSchema } from '../validators/dailyQuestionSchemas';
import * as DailyQuestionController from '../controllers/DailyQuestionController';

const router = Router();

router.get('/today', DailyQuestionController.getToday);
router.post('/:id/answer', validate(answerSchema), DailyQuestionController.submitAnswer);
router.get('/history', DailyQuestionController.getHistory);

export const dailyQuestionRoutes = router;
