import { Router } from 'express';
import { upload, uploadAudio } from '../middleware/upload';
import * as LoveLetterController from '../controllers/LoveLetterController';
import { checkPremiumAccess } from '../middleware/freeLimit';

const router = Router();

router.get('/received', LoveLetterController.listReceived);
router.get('/sent', LoveLetterController.listSent);
router.get('/unread-count', LoveLetterController.getUnreadCount);
router.get('/unread/count', LoveLetterController.getUnreadCount);
router.get('/:id', LoveLetterController.getOne);
router.post('/', checkPremiumAccess('love-letters'), LoveLetterController.create);
router.put('/:id', LoveLetterController.update);
router.put('/:id/send', LoveLetterController.send);
router.patch('/:id/mark-read', LoveLetterController.markRead);
router.delete('/:id', LoveLetterController.remove);

router.post('/:id/photos', upload.array('photos', 5), LoveLetterController.uploadPhotos);
router.delete('/:id/photos/:photoId', LoveLetterController.deletePhoto);

router.post('/:id/audio', uploadAudio.single('audio'), LoveLetterController.uploadAudio);
router.delete('/:id/audio/:audioId', LoveLetterController.deleteAudio);

export { router as loveLetterRoutes };
