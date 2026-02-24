/**
 * Crawl ingredient prices from Tiki (has SSR __NEXT_DATA__ with real product data)
 * and save as static JSON for use in AI system prompt.
 *
 * BHX is fully CSR (Next.js App Router, API requires proprietary headers) —
 * Tiki is the reliable fallback with SSR product data.
 *
 * Usage: npx tsx scripts/crawl-prices.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

const INGREDIENTS: { key: string; query: string; unit: string }[] = [
  // Thịt / Protein
  { key: 'thịt heo nạc', query: 'thịt heo nạc', unit: '500g' },
  { key: 'thịt heo ba chỉ', query: 'thịt ba chỉ heo', unit: '500g' },
  { key: 'thịt bò', query: 'thịt bò tươi', unit: '300g' },
  { key: 'thịt gà', query: 'thịt gà tươi', unit: '500g' },
  { key: 'tôm tươi', query: 'tôm tươi sống', unit: '300g' },
  { key: 'cá phi lê', query: 'cá phi lê tươi', unit: '300g' },
  { key: 'trứng gà', query: 'trứng gà tươi 10 quả', unit: '10 quả' },
  { key: 'đậu hũ', query: 'đậu hũ tươi', unit: '300g' },
  { key: 'xúc xích', query: 'xúc xích heo tiệt trùng', unit: '200g' },
  // Rau củ quả
  { key: 'cà chua', query: 'cà chua tươi', unit: '500g' },
  { key: 'hành tây', query: 'hành tây củ', unit: '500g' },
  { key: 'tỏi', query: 'tỏi khô', unit: '100g' },
  { key: 'gừng', query: 'gừng tươi', unit: '200g' },
  { key: 'rau muống', query: 'rau muống tươi', unit: '300g' },
  { key: 'cải thảo', query: 'cải thảo tươi', unit: '500g' },
  { key: 'cà rốt', query: 'cà rốt tươi', unit: '500g' },
  { key: 'khoai tây', query: 'khoai tây', unit: '500g' },
  { key: 'bắp cải', query: 'bắp cải xanh', unit: '500g' },
  { key: 'đậu cove', query: 'đậu cove tươi', unit: '300g' },
  { key: 'nấm', query: 'nấm tươi', unit: '200g' },
  { key: 'chanh', query: 'chanh tươi', unit: '5 quả' },
  { key: 'ớt', query: 'ớt sừng tươi', unit: '100g' },
  { key: 'ngò rí', query: 'rau mùi ngò rí', unit: '100g' },
  { key: 'hành lá', query: 'hành lá tươi', unit: '100g' },
  // Tinh bột
  { key: 'gạo', query: 'gạo trắng jasmine 5kg', unit: '5kg' },
  { key: 'bún tươi', query: 'bún tươi', unit: '500g' },
  { key: 'mì gói', query: 'mì gói hảo hảo', unit: '75g/gói' },
  { key: 'bánh mì', query: 'bánh mì sandwich', unit: '300g' },
  // Gia vị / Nước chấm
  { key: 'dầu ăn', query: 'dầu ăn Neptune 1 lít', unit: '1 lít' },
  { key: 'nước mắm', query: 'nước mắm Phú Quốc', unit: '500ml' },
  { key: 'nước tương', query: 'nước tương Maggi', unit: '500ml' },
  { key: 'dầu hào', query: 'dầu hào Lee Kum Kee', unit: '255g' },
  { key: 'đường', query: 'đường kính trắng', unit: '1kg' },
  { key: 'muối', query: 'muối iốt', unit: '1kg' },
  { key: 'tiêu xay', query: 'tiêu xay đen', unit: '50g' },
  { key: 'bột ngọt', query: 'bột ngọt mì chính', unit: '200g' },
  { key: 'hạt nêm', query: 'hạt nêm Maggi', unit: '400g' },
  { key: 'tương cà', query: 'tương cà Heinz', unit: '300g' },
  // Sữa / Bơ
  { key: 'sữa tươi', query: 'sữa tươi Vinamilk 1 lít', unit: '1 lít' },
  { key: 'bơ', query: 'bơ Anchor unsalted', unit: '200g' },
  { key: 'pho mát', query: 'phô mai con bò cười', unit: '140g' },
];

interface PriceResult {
  name: string;
  price: number;
}

interface IngredientEntry {
  ingredient: string;
  unit: string;
  topResults: PriceResult[];
  estimatedPrice: number; // price of best result, 0 if not found
}

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

async function fetchTikiPrices(query: string): Promise<PriceResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`https://tiki.vn/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'vi,en;q=0.9',
      },
    });
    clearTimeout(timeout);
    const html = await response.text();
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return [];
    const data = JSON.parse(m[1]);
    const products = findProductsInNextData(data);
    return products
      .slice(0, 5)
      .map((p) => ({
        name: (p.name ?? '').slice(0, 100),
        price: p.price ?? p.final_price ?? 0,
      }))
      .filter((r) => r.name && r.price > 1000 && r.price < 2_000_000); // plausible food price range
  } catch (e) {
    return [];
  }
}

async function crawlAll(): Promise<void> {
  const results: IngredientEntry[] = [];
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  console.log(`Crawling ${INGREDIENTS.length} ingredients from Tiki...`);

  for (const item of INGREDIENTS) {
    process.stdout.write(`  ${item.key} (${item.query})... `);
    const topResults = await fetchTikiPrices(item.query);
    const estimatedPrice = topResults[0]?.price ?? 0;
    results.push({
      ingredient: item.key,
      unit: item.unit,
      topResults: topResults.slice(0, 3),
      estimatedPrice,
    });
    console.log(
      topResults.length > 0
        ? `✓ ${topResults[0].name.slice(0, 40)} → ${estimatedPrice.toLocaleString()} VND`
        : '✗ no results',
    );
    await delay(300); // polite crawl delay
  }

  const outPath = path.join(__dirname, '..', 'data', 'ingredient-prices.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nSaved ${results.length} entries to ${outPath}`);

  // Also generate compact text for system prompt
  const lines: string[] = ['# Bảng giá nguyên liệu nấu ăn (Tiki, VND)'];
  for (const entry of results) {
    if (entry.estimatedPrice > 0) {
      lines.push(`- ${entry.ingredient} (${entry.unit}): ~${entry.estimatedPrice.toLocaleString()} VND`);
    }
  }
  const textPath = path.join(__dirname, '..', 'data', 'ingredient-prices.txt');
  fs.writeFileSync(textPath, lines.join('\n'), 'utf-8');
  console.log(`Saved text summary to ${textPath}`);
}

crawlAll().catch(console.error);
