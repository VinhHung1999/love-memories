import { Router } from 'express';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import * as ProfileController from '../controllers/ProfileController';
import { updateNameSchema } from '../validators/profileSchemas';

const router = Router();

router.put('/', validate(updateNameSchema), ProfileController.updateName);
// T328 (TEMP DBG): log incoming Content-Type before multer to confirm whether
// mobile-rework client is sending application/json instead of multipart.
// Remove after hypothesis confirmed.
router.post(
  '/avatar',
  (req, _res, next) => {
    console.log('[AVATAR-DBG]', {
      ct: req.headers['content-type'],
      len: req.headers['content-length'],
    });
    next();
  },
  upload.single('avatar'),
  ProfileController.uploadAvatar,
);

export const profileRoutes = router;
