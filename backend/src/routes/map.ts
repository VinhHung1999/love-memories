import { Router } from 'express';
import * as MapController from '../controllers/MapController';

const router = Router();

router.get('/pins', MapController.getPins);

export { router as mapRoutes };
