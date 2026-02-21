import { Router } from 'express';
import type { Request, Response } from 'express';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { z } from 'zod';

const router = Router();

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const generateRecipeSchema = z.object({
  mode: z.enum(['text', 'youtube']),
  input: z.string().min(1),
});

const SYSTEM_PROMPT = `You are a Vietnamese recipe assistant. Given recipe text or a cooking transcript, extract and structure it into JSON.

Return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:
{
  "title": "recipe name in Vietnamese",
  "description": "1-2 sentence description in Vietnamese",
  "ingredients": ["ingredient with quantity", ...],
  "ingredientPrices": [price_in_vnd, ...],
  "steps": ["step 1", "step 2", ...],
  "stepDurations": [seconds, ...],
  "tags": ["tag1", "tag2"],
  "notes": "tips, serving size, total cook time"
}

Rules:
- ingredientPrices: realistic Vietnamese market prices in VND (e.g. 50000 for 500g thịt heo). Use 0 if unknown.
- stepDurations: seconds for timed steps (e.g. 1800 for "30 phút"), 0 for untimed steps. Arrays must be same length as their parallel array.
- All text in Vietnamese.
- tags: 2-4 relevant tags (e.g. "canh", "miền Nam", "dễ làm", "ít dầu mỡ").`;

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function getYoutubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  // Try Vietnamese first, fall back to any available language
  const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'vi' })
    .catch(() => YoutubeTranscript.fetchTranscript(videoId));

  return segments.map((s: { text: string }) => s.text).join(' ');
}

// POST /api/ai/generate-recipe
router.post('/generate-recipe', async (req: Request, res: Response) => {
  try {
    const { mode, input } = generateRecipeSchema.parse(req.body);

    let textContent: string;
    let tutorialUrl: string | undefined;

    if (mode === 'youtube') {
      tutorialUrl = input;
      try {
        textContent = await getYoutubeTranscript(input);
      } catch {
        res.status(422).json({
          error: 'Không thể lấy transcript từ video này. Video có thể không có phụ đề.',
        });
        return;
      }
    } else {
      textContent = input;
    }

    const completion = await xai.chat.completions.create({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: textContent },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    // Strip markdown code fences if the model wraps JSON in them
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let recipe: Record<string, unknown>;
    try {
      recipe = JSON.parse(jsonStr);
    } catch {
      res.status(422).json({ error: 'AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.' });
      return;
    }

    if (tutorialUrl) recipe.tutorialUrl = tutorialUrl;

    res.json(recipe);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Không thể tạo công thức. Vui lòng thử lại.' });
  }
});

export { router as aiRoutes };
