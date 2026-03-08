import { Router } from 'express';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import * as ExpenseController from '../controllers/ExpenseController';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expenseSchemas';

const router = Router();

router.get('/', ExpenseController.list);
router.get('/stats', ExpenseController.getStats);
router.get('/daily-stats', ExpenseController.getDailyStats);
router.get('/limits', ExpenseController.getLimits);
router.put('/limits', ExpenseController.setLimits);
router.post('/upload-receipt', upload.single('photo'), ExpenseController.uploadReceipt);
router.get('/:id', ExpenseController.getOne);
router.post('/', validate(createExpenseSchema), ExpenseController.create);
router.put('/:id', validate(updateExpenseSchema), ExpenseController.update);
router.delete('/:id', ExpenseController.remove);

export { router as expenseRoutes };
