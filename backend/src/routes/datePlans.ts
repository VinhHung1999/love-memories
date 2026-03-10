import { Router } from 'express';
import * as DatePlanController from '../controllers/DatePlanController';
import { checkPremiumAccess } from '../middleware/freeLimit';

const router = Router();

router.get('/', DatePlanController.list);
router.get('/:id', DatePlanController.getOne);
router.post('/', checkPremiumAccess('date-planner'), DatePlanController.create);
router.put('/:id', DatePlanController.update);
router.put('/:id/status', DatePlanController.updateStatus);
router.put('/:id/stops/:stopId/moment', DatePlanController.linkMoment);
router.put('/:id/stops/:stopId/foodspot', DatePlanController.linkFoodSpot);
router.put('/:id/stops/:stopId/cost', DatePlanController.updateStopCost);
router.put('/:id/stops/:stopId/done', DatePlanController.markStopDone);
router.post('/:id/stops/:stopId/spots', DatePlanController.addSpot);
router.delete('/:id/stops/:stopId/spots/:spotId', DatePlanController.deleteSpot);
router.delete('/:id', DatePlanController.remove);

export { router as datePlanRoutes };
