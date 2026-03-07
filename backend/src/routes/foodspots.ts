import { Router } from 'express';
import { upload } from '../middleware/upload';
import * as FoodSpotController from '../controllers/FoodSpotController';

const router = Router();

router.get('/random', FoodSpotController.getRandom);
router.get('/', FoodSpotController.list);
router.get('/:id', FoodSpotController.getOne);
router.post('/', FoodSpotController.create);
router.put('/:id', FoodSpotController.update);
router.delete('/:id', FoodSpotController.remove);

router.post('/:id/photos', upload.array('photos', 10), FoodSpotController.uploadPhotos);
router.delete('/:id/photos/:photoId', FoodSpotController.deletePhoto);

export { router as foodSpotRoutes };
