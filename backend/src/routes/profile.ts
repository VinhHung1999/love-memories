import { Router } from 'express';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import * as ProfileController from '../controllers/ProfileController';
import { updateNameSchema } from '../validators/profileSchemas';

const router = Router();

router.put('/', validate(updateNameSchema), ProfileController.updateName);
router.post('/avatar', upload.single('avatar'), ProfileController.uploadAvatar);

export const profileRoutes = router;
