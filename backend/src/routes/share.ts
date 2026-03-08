import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ShareController from '../controllers/ShareController';

const router = Router();

router.post('/', requireAuth, ShareController.create);
router.get('/', requireAuth, ShareController.list);
router.delete('/:token', requireAuth, ShareController.revoke);
router.get('/:token/image', ShareController.getTokenImage);
router.get('/:token', ShareController.getToken);

export const shareRoutes = router;
