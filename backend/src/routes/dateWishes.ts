import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as DateWishController from '../controllers/DateWishController';
import { createDateWishSchema, updateDateWishSchema, markDoneSchema } from '../validators/dateWishSchemas';

const router = Router();

router.get('/', DateWishController.list);
router.post('/', validate(createDateWishSchema), DateWishController.create);
router.put('/:id', validate(updateDateWishSchema), DateWishController.update);
router.put('/:id/done', validate(markDoneSchema), DateWishController.markDone);
router.delete('/:id', DateWishController.remove);

export { router as dateWishRoutes };
