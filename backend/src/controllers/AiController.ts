import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { generateRecipeSchema } from '../validators/authSchemas';
import * as AiService from '../services/AiService';

export const generateRecipe = [
  validate(generateRecipeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { mode, input } = req.body as AiService.GenerateRecipeInput;
    const result = await AiService.generateRecipe({ mode, input });

    if (result.transcriptError) {
      res.status(422).json({
        error: 'Không thể lấy transcript từ video này. Video có thể không có phụ đề.',
      });
      return;
    }
    if (result.urlError) {
      res.status(422).json({ error: result.urlError });
      return;
    }

    res.json(result.recipe);
  }),
];

export const scanReceipt = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: 'No photo uploaded' }); return; }

  const parsed = await AiService.scanReceipt(file.buffer, file.mimetype);
  if (!parsed) {
    res.status(422).json({ error: 'AI could not parse receipt. Please try again.' });
    return;
  }
  res.json(parsed);
});
