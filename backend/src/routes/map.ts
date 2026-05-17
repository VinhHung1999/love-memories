import { Router } from 'express';
import * as MapController from '../controllers/MapController';

const router = Router();

router.get('/pins', MapController.getPins);
// T472 (Sprint 70) — Memory Map. Viewport-windowed Moment pins.
router.get('/moments', MapController.getMomentsInBounds);

export { router as mapRoutes };
