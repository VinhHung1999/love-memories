import { Router } from 'express';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { requireCouple } from '../middleware/requireCouple';
import * as ProfileController from '../controllers/ProfileController';
import { updateNameSchema } from '../validators/profileSchemas';

const router = Router();

router.put('/', validate(updateNameSchema), ProfileController.updateName);
router.post('/avatar', upload.single('avatar'), ProfileController.uploadAvatar);
// /stats needs couple scope — gated here (not at mount level, which must stay
// auth-only so avatar upload works during onboarding, pre-pairing).
router.get('/stats', requireCouple, ProfileController.stats);

export const profileRoutes = router;
