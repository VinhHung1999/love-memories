import { Router } from 'express';
import type { Request, Response } from 'express';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { z } from 'zod';
import * as cheerio from 'cheerio';

const router = Router();

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const generateRecipeSchema = z.object({
  mode: z.enum(['text', 'youtube', 'url']),
  input: z.string().min(1),
});

const SYSTEM_PROMPT = `You are a Vietnamese recipe assistant for a couple (2 people). Given recipe text or a cooking transcript, extract and structure it into JSON.

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
- Portions: ALWAYS adjust ingredient quantities for exactly 2 people (couple). If the original recipe serves more, scale down proportionally.
- ingredientPrices: use the search_ingredient_price tool to look up real prices from the Vietnamese market for each ingredient. Only estimate if the tool returns no results.
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

async function fetchUrlContent(url: string): Promise<string> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('URL không hợp lệ.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('URL không hợp lệ.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'vi,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
      },
    });
    clearTimeout(timeout);
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
      throw new Error('URL không phải trang HTML.');
    }
    html = await response.text();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Trang web phản hồi quá chậm (timeout 15s).');
    throw err;
  }

  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, aside, .ads, .advertisement, #ads').remove();

  // Try recipe-specific selectors first, fall back to main content areas
  let text = '';
  for (const selector of ['[itemtype*="Recipe"]', 'article', 'main', '.recipe', '#recipe', '.content']) {
    text = $(selector).first().text();
    if (text.trim().length > 200) break;
  }
  if (text.trim().length < 200) {
    text = $('body').text();
  }

  // Normalize whitespace and truncate
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length === 0) throw new Error('Không thể đọc nội dung từ trang web này.');
  return text.slice(0, 8000);
}

// Extract product list from Tiki __NEXT_DATA__ JSON
function findProductsInNextData(obj: unknown, depth = 0): Array<{ name?: string; price?: number; final_price?: number }> {
  if (depth > 8) return [];
  if (Array.isArray(obj) && obj.length >= 2) {
    const first = obj[0];
    if (first && typeof first === 'object' && ('price' in first || 'final_price' in first)) {
      return obj as Array<{ name?: string; price?: number; final_price?: number }>;
    }
    for (const item of obj.slice(0, 3)) {
      const r = findProductsInNextData(item, depth + 1);
      if (r.length) return r;
    }
  }
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const v of Object.values(obj as Record<string, unknown>).slice(0, 20)) {
      const r = findProductsInNextData(v, depth + 1);
      if (r.length) return r;
    }
  }
  return [];
}

// Search ingredient price on Tiki (has SSR __NEXT_DATA__ with price info)
async function searchIngredientPrice(ingredient: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://tiki.vn/search?q=${encodeURIComponent(ingredient)}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi,en;q=0.9',
      },
    });
    clearTimeout(timeout);
    const html = await response.text();
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return JSON.stringify({ results: [] });
    const data = JSON.parse(m[1]);
    const products = findProductsInNextData(data);
    const results = products
      .slice(0, 5)
      .map((p) => ({ name: (p.name ?? '').slice(0, 80), price: p.price ?? p.final_price ?? 0 }))
      .filter((r) => r.name && r.price > 0);
    return JSON.stringify({ results });
  } catch {
    return JSON.stringify({ results: [] });
  }
}

const PRICE_SEARCH_TOOL = {
  type: 'function' as const,
  function: {
    name: 'search_ingredient_price',
    description: 'Search for an ingredient price in the Vietnamese market (Tiki). Returns up to 5 results with product name and price in VND. Use the most relevant food item result for pricing.',
    parameters: {
      type: 'object',
      properties: {
        ingredient: {
          type: 'string',
          description: 'Ingredient name in Vietnamese, e.g. "thịt heo", "trứng gà", "cà chua"',
        },
      },
      required: ['ingredient'],
    },
  },
};

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
    } else if (mode === 'url') {
      tutorialUrl = input;
      try {
        textContent = await fetchUrlContent(input);
      } catch (err: any) {
        res.status(422).json({ error: err.message ?? 'Không thể đọc nội dung từ URL này.' });
        return;
      }
    } else {
      textContent = input;
    }

    // Tool-calling loop: Grok calls search_ingredient_price for each ingredient
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: textContent },
    ];

    let completion = await xai.chat.completions.create({
      model: 'grok-3-mini',
      messages,
      tools: [PRICE_SEARCH_TOOL],
      tool_choice: 'auto',
      temperature: 0.3,
    });

    // Handle tool calls (up to 25 iterations — one per ingredient)
    let iterations = 0;
    while (completion.choices[0]?.finish_reason === 'tool_calls' && iterations < 25) {
      iterations++;
      const assistantMsg = completion.choices[0].message;
      messages.push(assistantMsg);

      const toolResults = await Promise.all(
        (assistantMsg.tool_calls ?? []).map(async (tc) => {
          const fnCall = tc as { id: string; function: { arguments: string } };
          const args = JSON.parse(fnCall.function.arguments) as { ingredient: string };
          const result = await searchIngredientPrice(args.ingredient);
          return { role: 'tool' as const, tool_call_id: tc.id, content: result };
        }),
      );
      messages.push(...toolResults);

      completion = await xai.chat.completions.create({
        model: 'grok-3-mini',
        messages,
        tools: [PRICE_SEARCH_TOOL],
        tool_choice: 'auto',
        temperature: 0.3,
      });
    }

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
