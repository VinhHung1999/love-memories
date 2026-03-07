import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as SprintController from '../controllers/SprintController';
import { createSprintSchema, updateSprintSchema, updateSprintStatusSchema } from '../validators/sprintSchemas';

const router = Router();

router.get('/', SprintController.list);
router.get('/active', SprintController.getActive);
router.get('/:id', SprintController.getOne);
router.post('/', validate(createSprintSchema), SprintController.create);
router.put('/:id', validate(updateSprintSchema), SprintController.update);
router.patch('/:id/status', validate(updateSprintStatusSchema), SprintController.updateStatus);
router.delete('/:id', SprintController.remove);

export { router as sprintRoutes };
