export interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number;       // % of canvas width  (0-100)
  y: number;       // % of canvas height (0-100)
  scale: number;   // resize factor (default 1)
  rotation: number; // degrees
}

export interface StickerDef {
  id: string;
  label: string;
  category: 'love' | 'fun' | 'text';
  emoji: string;
}

export const STICKERS: StickerDef[] = [
  // Love
  { id: 'heart',        category: 'love', label: 'Heart',         emoji: '❤️' },
  { id: 'hearts',       category: 'love', label: 'Hearts',        emoji: '💕' },
  { id: 'kiss',         category: 'love', label: 'Kiss',          emoji: '💋' },
  { id: 'cupid',        category: 'love', label: 'Cupid',         emoji: '💘' },
  { id: 'ring',         category: 'love', label: 'Ring',          emoji: '💍' },
  { id: 'rose',         category: 'love', label: 'Rose',          emoji: '🌹' },
  { id: 'bouquet',      category: 'love', label: 'Bouquet',       emoji: '💐' },
  // Fun
  { id: 'star',         category: 'fun',  label: 'Star',          emoji: '⭐' },
  { id: 'sparkles',     category: 'fun',  label: 'Sparkles',      emoji: '✨' },
  { id: 'crown',        category: 'fun',  label: 'Crown',         emoji: '👑' },
  { id: 'sunglasses',   category: 'fun',  label: 'Sunglasses',    emoji: '😎' },
  { id: 'fire',         category: 'fun',  label: 'Fire',          emoji: '🔥' },
  { id: 'party',        category: 'fun',  label: 'Party',         emoji: '🎉' },
  { id: 'rainbow',      category: 'fun',  label: 'Rainbow',       emoji: '🌈' },
  // Text
  { id: 'text-yeu',     category: 'text', label: 'Yêu',           emoji: '❤️ Yêu' },
  { id: 'text-love',    category: 'text', label: 'Love',          emoji: '💕 Love' },
  { id: 'text-forever', category: 'text', label: 'Forever',       emoji: '♾️ Forever' },
  { id: 'text-xoxo',    category: 'text', label: 'XOXO',          emoji: '💋 XOXO' },
  { id: 'pin',          category: 'text', label: 'Location',      emoji: '📍' },
  { id: 'calendar',     category: 'text', label: 'Date',          emoji: '📅' },
];

export function createPlacedSticker(stickerId: string): PlacedSticker {
  return {
    id: `${stickerId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stickerId,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
  };
}

export function drawStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: PlacedSticker,
  canvasW: number,
  canvasH: number,
): void {
  const def = STICKERS.find((s) => s.id === sticker.stickerId);
  if (!def) return;

  const px = (sticker.x / 100) * canvasW;
  const py = (sticker.y / 100) * canvasH;
  const baseSize = Math.min(canvasW, canvasH) * 0.1; // 10% of canvas min dimension
  const size = baseSize * sticker.scale;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate((sticker.rotation * Math.PI) / 180);

  // Text stickers use a styled pill; emoji/icon stickers use font rendering
  const isTextSticker = sticker.stickerId.startsWith('text-');

  if (isTextSticker) {
    const text = def.emoji;
    const fontSize = size * 0.45;
    ctx.font = `bold ${fontSize}px "Playfair Display", Georgia, serif`;
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = fontSize;
    const pad = fontSize * 0.4;

    // Pink pill background
    ctx.fillStyle = 'rgba(232,120,138,0.88)';
    roundRectPath(ctx, -tw / 2 - pad, -th / 2 - pad * 0.6, tw + pad * 2, th + pad * 1.2, (th + pad * 1.2) / 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
  } else {
    const fontSize = size;
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Drop shadow for emoji
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = fontSize * 0.08;
    ctx.shadowOffsetX = fontSize * 0.03;
    ctx.shadowOffsetY = fontSize * 0.03;
    ctx.fillText(def.emoji, 0, 0);
    ctx.shadowColor = 'transparent';
  }

  ctx.restore();
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
