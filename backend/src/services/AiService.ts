import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const PRICE_DATA = (() => {
  try {
    return fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ingredient-prices.txt'), 'utf-8');
  } catch {
    return '';
  }
})();

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
- ingredientPrices: estimate price in VND for each ingredient. Use the reference table below as a guide; for unlisted ingredients use your knowledge of Vietnamese market prices.
- stepDurations: seconds for timed steps (e.g. 1800 for "30 phút"), 0 for untimed steps. Arrays must be same length as their parallel array.
- All text in Vietnamese.
- tags: 2-4 relevant tags (e.g. "canh", "miền Nam", "dễ làm", "ít dầu mỡ").
${PRICE_DATA ? `\nGiá tham khảo nguyên liệu (VND):\n${PRICE_DATA}` : ''}`;

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function getYoutubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');
  const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'vi' }).catch(() =>
    YoutubeTranscript.fetchTranscript(videoId),
  );
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
        Accept: 'text/html,application/xhtml+xml',
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

  let text = '';
  for (const selector of [
    '[itemtype*="Recipe"]',
    'article',
    'main',
    '.recipe',
    '#recipe',
    '.content',
  ]) {
    text = $(selector).first().text();
    if (text.trim().length > 200) break;
  }
  if (text.trim().length < 200) text = $('body').text();

  text = text.replace(/\s+/g, ' ').trim();
  if (text.length === 0) throw new Error('Không thể đọc nội dung từ trang web này.');
  return text.slice(0, 8000);
}

export type GenerateRecipeInput = { mode: 'text' | 'youtube' | 'url'; input: string };

export async function generateRecipe({ mode, input }: GenerateRecipeInput): Promise<{
  recipe: Record<string, unknown>;
  tutorialUrl?: string;
  transcriptError?: boolean;
  urlError?: string;
}> {
  let textContent: string;
  let tutorialUrl: string | undefined;
  let transcriptError = false;
  let urlError: string | undefined;

  if (mode === 'youtube') {
    tutorialUrl = input;
    try {
      textContent = await getYoutubeTranscript(input);
    } catch {
      return { recipe: {}, tutorialUrl, transcriptError: true };
    }
  } else if (mode === 'url') {
    tutorialUrl = input;
    try {
      textContent = await fetchUrlContent(input);
    } catch (err: any) {
      return { recipe: {}, urlError: err.message ?? 'Không thể đọc nội dung từ URL này.' };
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
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let recipe: Record<string, unknown>;
  try {
    recipe = JSON.parse(jsonStr);
  } catch {
    return { recipe: {}, urlError: 'AI trả về dữ liệu không hợp lệ.' };
  }

  if (tutorialUrl) recipe.tutorialUrl = tutorialUrl;

  return { recipe, tutorialUrl, transcriptError, urlError };
}

export async function scanReceipt(
  buffer: Buffer,
  mimetype: string,
): Promise<Record<string, unknown> | null> {
  const base64 = buffer.toString('base64');

  const response = await xai.chat.completions.create({
    model: 'grok-4-1-fast-non-reasoning',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}` } },
          {
            type: 'text',
            text: `Analyze this receipt photo. Extract expense information and return ONLY valid JSON (no markdown, no extra text):
{
  "amount": total_amount_in_vnd (number),
  "description": "store/restaurant name from receipt (e.g. MiniStop, Highland Coffee), or short description if store name not found" (Vietnamese),
  "category": one of ["food","dating","shopping","transport","gifts","other"],
  "date": "YYYY-MM-DD" (from receipt, or today if unclear),
  "items": ["item1", "item2"] (optional, individual line items)
}`,
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content ?? '';
  const jsonStr = content.replace(/```(?:json)?\n?/g, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
