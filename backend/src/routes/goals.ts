import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as GoalController from '../controllers/GoalController';
import { createGoalSchema, updateGoalSchema, updateGoalStatusSchema, assignGoalSchema, reorderGoalsSchema } from '../validators/goalSchemas';

const router = Router();

router.get('/backlog', GoalController.backlog);
router.get('/sprint/:sprintId', GoalController.listBySprint);
router.post('/', validate(createGoalSchema), GoalController.create);
router.post('/sprint/:sprintId', validate(createGoalSchema), GoalController.createInSprint);
router.patch('/reorder', validate(reorderGoalsSchema), GoalController.reorder);
router.put('/:id', validate(updateGoalSchema), GoalController.update);
router.patch('/:id/status', validate(updateGoalStatusSchema), GoalController.updateStatus);
router.patch('/:id/assign', validate(assignGoalSchema), GoalController.assign);
router.delete('/:id', GoalController.remove);

export { router as goalRoutes };
