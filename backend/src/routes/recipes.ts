import { Router } from 'express';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import * as RecipeController from '../controllers/RecipeController';
import { createRecipeSchema, updateRecipeSchema } from '../validators/recipeSchemas';
import { checkPremiumAccess } from '../middleware/freeLimit';

const router = Router();

router.get('/', RecipeController.list);
router.get('/:id', RecipeController.getOne);
router.post('/', checkPremiumAccess('recipes'), validate(createRecipeSchema), RecipeController.create);
router.put('/:id', validate(updateRecipeSchema), RecipeController.update);
router.delete('/:id', RecipeController.remove);
router.post('/:id/photos', upload.array('photos', 10), RecipeController.addPhotos);
router.delete('/:id/photos/:photoId', RecipeController.deletePhoto);

export { router as recipeRoutes };
