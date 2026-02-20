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

// ── Canvas 2D prop drawing functions ──────────────────────────────────────────

function drawHeartProp(ctx: CanvasRenderingContext2D, r: number): void {
  const grad = ctx.createLinearGradient(-r, -r, r, r);
  grad.addColorStop(0, '#FF8FAB');
  grad.addColorStop(1, '#C0392B');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.bezierCurveTo(-r * 2, r, -r * 2.5, -r, 0, -r * 0.5);
  ctx.bezierCurveTo(r * 2.5, -r, r * 2, r, 0, r);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.55, -r * 0.25, r * 0.42, r * 0.26, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeartsProp(ctx: CanvasRenderingContext2D, r: number): void {
  const positions = [
    { x: 0, y: 0, s: r, color: '#E8788A' },
    { x: r * 1.5, y: -r * 0.8, s: r * 0.65, color: '#FF8FAB' },
    { x: -r * 1.4, y: r * 0.5, s: r * 0.55, color: '#C86677' },
  ];
  for (const { x, y, s, color } of positions) {
    ctx.save();
    ctx.translate(x, y);
    const grad = ctx.createLinearGradient(-s, -s, s, s);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#C0392B');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.bezierCurveTo(-s * 2, s, -s * 2.5, -s, 0, -s * 0.5);
    ctx.bezierCurveTo(s * 2.5, -s, s * 2, s, 0, s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawStarProp(ctx: CanvasRenderingContext2D, r: number): void {
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0, '#FFF176');
  grad.addColorStop(0.6, '#FFD700');
  grad.addColorStop(1, '#E6A000');
  ctx.fillStyle = grad;

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
}

function drawSparklesProp(ctx: CanvasRenderingContext2D, r: number): void {
  const sparkles = [
    { x: 0, y: 0, r: r, rot: 0 },
    { x: r * 1.3, y: -r * 0.7, r: r * 0.55, rot: Math.PI / 8 },
    { x: -r * 1.15, y: r * 0.55, r: r * 0.48, rot: -Math.PI / 6 },
  ];
  for (const sp of sparkles) {
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(sp.rot);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rad = i % 2 === 0 ? sp.r : sp.r * 0.3;
      const x = Math.cos(angle) * rad;
      const y = Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawCrownProp(ctx: CanvasRenderingContext2D, r: number): void {
  const w = r * 2.6;
  const h = r * 1.9;
  const x = -w / 2;
  const y = -h / 2;

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#FFE566');
  grad.addColorStop(0.55, '#FFB700');
  grad.addColorStop(1, '#CC8800');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w * 0.85, y + h * 0.5);
  ctx.lineTo(x + w * 0.65, y + h * 0.55);
  ctx.lineTo(x + w * 0.5, y);       // center spike
  ctx.lineTo(x + w * 0.35, y + h * 0.55);
  ctx.lineTo(x + w * 0.15, y + h * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#A07000';
  ctx.lineWidth = r * 0.07;
  ctx.lineJoin = 'miter';
  ctx.stroke();

  // Gems
  const gems = [
    { cx: x + w * 0.2, cy: y + h * 0.78, color: '#FF6B6B' },
    { cx: x + w * 0.5, cy: y + h * 0.78, color: '#45B7D1' },
    { cx: x + w * 0.8, cy: y + h * 0.78, color: '#96CEB4' },
  ];
  for (const g of gems) {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(g.cx - r * 0.04, g.cy - r * 0.04, r * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFireProp(ctx: CanvasRenderingContext2D, r: number): void {
  // Outer flame
  const outerGrad = ctx.createLinearGradient(0, r * 1.5, 0, -r * 1.5);
  outerGrad.addColorStop(0, '#FF1A00');
  outerGrad.addColorStop(0.4, '#FF6600');
  outerGrad.addColorStop(0.75, '#FF9900');
  outerGrad.addColorStop(1, '#FFCC00');
  ctx.fillStyle = outerGrad;

  ctx.beginPath();
  ctx.moveTo(0, -r * 1.4);
  ctx.bezierCurveTo(r * 0.85, -r * 0.55, r * 1.2, r * 0.1, r, r);
  ctx.bezierCurveTo(r * 0.75, r * 1.35, 0, r * 1.5, 0, r * 1.5);
  ctx.bezierCurveTo(0, r * 1.5, -r * 0.75, r * 1.35, -r, r);
  ctx.bezierCurveTo(-r * 1.2, r * 0.1, -r * 0.85, -r * 0.55, 0, -r * 1.4);
  ctx.closePath();
  ctx.fill();

  // Inner bright core
  const innerGrad = ctx.createLinearGradient(0, r * 0.8, 0, -r * 0.8);
  innerGrad.addColorStop(0, '#FF6600');
  innerGrad.addColorStop(1, '#FFEE00');
  ctx.fillStyle = innerGrad;

  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.bezierCurveTo(r * 0.45, -r * 0.2, r * 0.62, r * 0.35, 0, r * 0.85);
  ctx.bezierCurveTo(-r * 0.62, r * 0.35, -r * 0.45, -r * 0.2, 0, -r * 0.85);
  ctx.closePath();
  ctx.fill();
}

// ── Emoji fallback draw ────────────────────────────────────────────────────────

function drawEmojiProp(ctx: CanvasRenderingContext2D, emoji: string, size: number): void {
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);
}

// ── Text pill draw ─────────────────────────────────────────────────────────────

function roundRectPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
): void {
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

function drawTextPill(ctx: CanvasRenderingContext2D, def: StickerDef, size: number): void {
  const text = def.emoji;
  const fontSize = size * 0.45;
  ctx.font = `bold ${fontSize}px "Playfair Display", Georgia, serif`;
  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const th = fontSize;
  const pad = fontSize * 0.4;

  ctx.fillStyle = 'rgba(232,120,138,0.88)';
  roundRectPath(ctx, -tw / 2 - pad, -th / 2 - pad * 0.6, tw + pad * 2, th + pad * 1.2, (th + pad * 1.2) / 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
}

// ── Main draw dispatch ─────────────────────────────────────────────────────────

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
  const baseSize = Math.min(canvasW, canvasH) * 0.08;
  const size = baseSize * sticker.scale;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate((sticker.rotation * Math.PI) / 180);

  const isTextSticker = sticker.stickerId.startsWith('text-');

  if (isTextSticker) {
    drawTextPill(ctx, def, size);
  } else {
    // Drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetX = size * 0.04;
    ctx.shadowOffsetY = size * 0.06;

    const r = size * 0.42;
    switch (sticker.stickerId) {
      case 'heart':      drawHeartProp(ctx, r);     break;
      case 'hearts':     drawHeartsProp(ctx, r);    break;
      case 'star':       drawStarProp(ctx, r);      break;
      case 'sparkles':   drawSparklesProp(ctx, r);  break;
      case 'crown':      drawCrownProp(ctx, r);     break;
      case 'fire':       drawFireProp(ctx, r);      break;
      default:
        // Emoji fallback for stickers without a dedicated Canvas 2D draw fn
        ctx.shadowColor = 'transparent';
        ctx.font = `${size}px serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = size * 0.08;
        ctx.shadowOffsetX = size * 0.03;
        ctx.shadowOffsetY = size * 0.03;
        drawEmojiProp(ctx, def.emoji, size);
    }
  }

  ctx.restore();
}
