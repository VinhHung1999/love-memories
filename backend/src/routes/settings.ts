import { Router } from 'express';
import * as SettingController from '../controllers/SettingController';

const router = Router();

router.get('/:key', SettingController.getOne);
router.put('/:key', SettingController.upsert);

export const settingsRoutes = router;
