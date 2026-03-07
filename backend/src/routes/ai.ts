import { Router } from 'express';
import { upload } from '../middleware/upload';
import * as AiController from '../controllers/AiController';

const router = Router();

router.post('/generate-recipe', AiController.generateRecipe);
router.post('/scan-receipt', upload.single('photo'), AiController.scanReceipt);

export { router as aiRoutes };
