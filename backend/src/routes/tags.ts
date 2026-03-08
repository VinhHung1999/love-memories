import { Router } from 'express';
import * as TagController from '../controllers/TagController';

const router = Router();

router.get('/', TagController.list);
router.put('/:name', TagController.upsert);

export { router as tagRoutes };
