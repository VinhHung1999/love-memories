import { Router } from 'express';
import { upload } from '../middleware/upload';
import * as CookingSessionController from '../controllers/CookingSessionController';

const router = Router();

router.get('/active', CookingSessionController.getActive);
router.get('/', CookingSessionController.list);
router.get('/:id', CookingSessionController.getOne);
router.post('/', CookingSessionController.create);
router.put('/:id/status', CookingSessionController.updateStatus);
router.put('/:id/items/:itemId', CookingSessionController.toggleItem);
router.put('/:id/steps/:stepId', CookingSessionController.toggleStep);
router.post('/:id/photos', upload.array('photos', 10), CookingSessionController.uploadPhotos);
router.patch('/:id/rate', CookingSessionController.rate);
router.delete('/:id', CookingSessionController.remove);

export { router as cookingSessionRoutes };
