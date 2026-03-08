import { Router } from 'express';
import { upload, uploadAudio } from '../middleware/upload';
import * as MomentController from '../controllers/MomentController';

const router = Router();

router.get('/', MomentController.list);
router.get('/:id', MomentController.getOne);
router.post('/', MomentController.create);
router.put('/:id', MomentController.update);
router.delete('/:id', MomentController.remove);

router.post('/:id/photos', upload.array('photos', 10), MomentController.uploadPhotos);
router.delete('/:id/photos/:photoId', MomentController.deletePhoto);

router.post('/:id/audio', uploadAudio.single('audio'), MomentController.uploadAudio);
router.delete('/:id/audio/:audioId', MomentController.deleteAudio);

router.get('/:id/comments', MomentController.listComments);
router.post('/:id/comments', MomentController.addComment);
router.delete('/:id/comments/:commentId', MomentController.deleteComment);

router.post('/:id/reactions', MomentController.toggleReaction);

export { router as momentRoutes };
