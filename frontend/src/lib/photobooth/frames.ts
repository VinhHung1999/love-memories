import { createCanvas, drawImageCover, roundRect, renderFilteredImage } from './canvas-utils';
import { applyFilterToCanvas } from './filters';
import type { PlacedSticker } from './stickers';
import { drawStickerOnCanvas } from './stickers';

export interface FrameDef {
  id: string;
  label: string;
  emoji: string;
  photoCount: { min: number; max: number };
  mode: 'frame' | 'strip';
  thumbnail: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  render: (
    images: HTMLImageElement[],
    filterId: string,
    stickers: PlacedSticker[],
    options?: { frameColor?: string },
  ) => Promise<HTMLCanvasElement>;
}

const PRIMARY = '#E8788A';
const W = 1080;

// ── shared helper ─────────────────────────────────────────────────────────────

function filteredImg(img: HTMLImageElement, filterId: string, w: number, h: number): HTMLCanvasElement {
  return renderFilteredImage(img, w, h, (c) => applyFilterToCanvas(c, filterId));
}

function drawStickers(ctx: CanvasRenderingContext2D, stickers: PlacedSticker[], cw: number, ch: number): void {
  stickers.forEach((s) => drawStickerOnCanvas(ctx, s, cw, ch));
}

// ── Frame 1: Polaroid ─────────────────────────────────────────────────────────

function polaroidThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 8;
  roundRect(ctx, w * 0.05, h * 0.04, w * 0.9, h * 0.9, 6);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ddd';
  ctx.fillRect(w * 0.1, h * 0.09, w * 0.8, h * 0.62);
  ctx.fillStyle = '#bbb';
  ctx.font = `bold ${w * 0.09}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❤', w / 2, h * 0.78);
}

async function polaroidRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const H = 1280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  const pad = 60;
  const photoH = 960;

  // White background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Photo area
  if (images[0]) {
    ctx.save();
    roundRect(ctx, pad, pad, W - pad * 2, photoH, 4);
    ctx.clip();
    const fi = filteredImg(images[0], filterId, W - pad * 2, photoH);
    ctx.drawImage(fi, pad, pad);
    ctx.restore();
  }

  // Bottom text area — centered "Love Scrum" script
  ctx.fillStyle = '#888';
  ctx.font = `italic 54px "Playfair Display", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Love Scrum ♥', W / 2, 1100);

  // Subtle drop shadow border
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, W - pad * 2, photoH);

  drawStickers(ctx, stickers, W, H);
  return canvas;
}

// ── Frame 2: Heart Border ─────────────────────────────────────────────────────

function drawHeartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx, cy - size * 0.1, cx - size * 0.5, cy - size * 0.5, cx - size * 0.5, cy);
  ctx.bezierCurveTo(cx - size * 0.5, cy + size * 0.35, cx, cy + size * 0.6, cx, cy + size * 0.75);
  ctx.bezierCurveTo(cx, cy + size * 0.6, cx + size * 0.5, cy + size * 0.35, cx + size * 0.5, cy);
  ctx.bezierCurveTo(cx + size * 0.5, cy - size * 0.5, cx, cy - size * 0.1, cx, cy + size * 0.3);
  ctx.closePath();
}

function heartThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#ffd6db');
  grad.addColorStop(1, '#ffb3c1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  drawHeartPath(ctx, w / 2, h / 2, w * 0.38);
  ctx.fill();
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 3;
  ctx.stroke();
}

async function heartRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const H = W;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d')!;

  // Pink gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#ffe4e8');
  grad.addColorStop(1, '#ffd0d7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Clip heart path for photo
  if (images[0]) {
    ctx.save();
    drawHeartPath(ctx, W / 2, H / 2 - 20, W * 0.38);
    ctx.clip();
    const fi = filteredImg(images[0], filterId, W, H);
    ctx.drawImage(fi, 0, 0);
    ctx.restore();

    // Heart stroke overlay
    ctx.strokeStyle = PRIMARY;
    ctx.lineWidth = 16;
    drawHeartPath(ctx, W / 2, H / 2 - 20, W * 0.38);
    ctx.stroke();
  }

  // Scattered mini hearts
  const rng = (seed: number) => ((Math.sin(seed) * 43758.5453) % 1 + 1) % 1;
  ctx.font = '40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 18; i++) {
    const x = rng(i * 3.1) * W;
    const y = rng(i * 7.3) * H;
    const alpha = 0.3 + rng(i * 11.7) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillText(['❤', '💕', '♥'][i % 3]!, x, y);
  }
  ctx.globalAlpha = 1;

  drawStickers(ctx, stickers, W, H);
  return canvas;
}

// ── Frame 3: Film Strip ───────────────────────────────────────────────────────

function filmThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#333';
  const sprocketW = w * 0.08, sprocketH = w * 0.05;
  for (let y = h * 0.05; y < h * 0.95; y += h * 0.12) {
    roundRect(ctx, w * 0.01, y, sprocketW, sprocketH, 2);
    ctx.fill();
    roundRect(ctx, w * 0.91, y, sprocketW, sprocketH, 2);
    ctx.fill();
  }
  ctx.fillStyle = '#555';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(w * 0.15, h * 0.08 + i * (h * 0.3), w * 0.7, h * 0.22);
  }
}

async function filmRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const count = Math.min(images.length, 4);
  const FW = 700;
  const frameH = 380;
  const padV = 60, padH = 80;
  const sprocketW = 28, sprocketH = 20;
  const H = padV * 2 + frameH * count + 30 * (count - 1);
  const canvas = createCanvas(FW, H);
  const ctx = canvas.getContext('2d')!;

  // Film black background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, FW, H);

  // Sprocket holes
  const sprocketX1 = 14, sprocketX2 = FW - sprocketW - 14;
  ctx.fillStyle = '#333';
  for (let y = 10; y < H - 10; y += 46) {
    roundRect(ctx, sprocketX1, y, sprocketW, sprocketH, 4);
    ctx.fill();
    roundRect(ctx, sprocketX2, y, sprocketW, sprocketH, 4);
    ctx.fill();
  }

  // Photos
  for (let i = 0; i < count; i++) {
    const fy = padV + i * (frameH + 30);
    if (images[i]) {
      ctx.save();
      roundRect(ctx, padH, fy, FW - padH * 2, frameH, 4);
      ctx.clip();
      const fi = filteredImg(images[i]!, filterId, FW - padH * 2, frameH);
      ctx.drawImage(fi, padH, fy);
      ctx.restore();
    } else {
      ctx.fillStyle = '#2a2a2a';
      roundRect(ctx, padH, fy, FW - padH * 2, frameH, 4);
      ctx.fill();
    }
  }

  // White frame border between photos
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i++) {
    const fy = padV + i * (frameH + 30);
    roundRect(ctx, padH, fy, FW - padH * 2, frameH, 4);
    ctx.stroke();
  }

  drawStickers(ctx, stickers, FW, H);
  return canvas;
}

// ── Frame 4: Collage 2x2 ──────────────────────────────────────────────────────

function collageThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, w, h);
  const gap = w * 0.02;
  const cw = (w - gap * 3) / 2;
  const ch = (h - gap * 3) / 2;
  const positions = [
    [gap, gap], [gap * 2 + cw, gap],
    [gap, gap * 2 + ch], [gap * 2 + cw, gap * 2 + ch],
  ] as [number, number][];
  positions.forEach(([x, y]) => {
    ctx.fillStyle = '#ddd';
    roundRect(ctx, x, y, cw, ch, 4);
    ctx.fill();
  });
  ctx.font = `${w * 0.1}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❤', w / 2, h / 2);
}

async function collageRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const H = W;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  const gap = 16;
  const cw = (W - gap * 3) / 2;
  const ch = (H - gap * 3) / 2;
  const positions: [number, number][] = [
    [gap, gap],
    [gap * 2 + cw, gap],
    [gap, gap * 2 + ch],
    [gap * 2 + cw, gap * 2 + ch],
  ];

  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 4; i++) {
    const [x, y] = positions[i]!;
    ctx.save();
    roundRect(ctx, x, y, cw, ch, 8);
    ctx.clip();
    if (images[i]) {
      const fi = filteredImg(images[i]!, filterId, cw, ch);
      ctx.drawImage(fi, x, y);
    } else {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(x, y, cw, ch);
    }
    ctx.restore();
  }

  // Center heart
  ctx.font = '80px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 8;
  ctx.fillText('❤️', W / 2, H / 2);
  ctx.shadowColor = 'transparent';

  drawStickers(ctx, stickers, W, H);
  return canvas;
}

// ── Frame 5: Vintage Round ────────────────────────────────────────────────────

function vintageThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = '#ccc';
  ctx.fill();
  ctx.strokeStyle = '#b89a78';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4b896';
  ctx.lineWidth = 2;
  ctx.stroke();
}

async function vintageRoundRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const H = W;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  const cx = W / 2, cy = H / 2;
  const r = W * 0.38;

  // Cream background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
  bg.addColorStop(0, '#fdf6ee');
  bg.addColorStop(1, '#f0e6d3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ornamental outer ring decorations
  const ringColors = ['#d4b896', '#c8a882', '#b89a78'];
  ringColors.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 40 - i * 14, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = i === 0 ? 3 : i === 1 ? 8 : 2;
    ctx.stroke();
  });

  // Small decorative dots on outer ring
  const outerR = r + 44;
  ctx.fillStyle = '#c8a882';
  for (let a = 0; a < 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx + outerR * Math.cos(rad), cy + outerR * Math.sin(rad), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Circular photo clip
  if (images[0]) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
    ctx.clip();
    const fi = filteredImg(images[0], filterId, (r - 10) * 2, (r - 10) * 2);
    drawImageCover(ctx, fi, cx - (r - 10), cy - (r - 10), (r - 10) * 2, (r - 10) * 2);
    ctx.restore();
  }

  // Inner ring overlay
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(184,154,120,0.6)';
  ctx.lineWidth = 4;
  ctx.stroke();

  drawStickers(ctx, stickers, W, H);
  return canvas;
}

// ── Frame 6: Romantic Flowers ─────────────────────────────────────────────────

function flowerPetal(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size * 0.4, -size * 0.5, -size * 0.2, -size, 0, -size * 1.1);
  ctx.bezierCurveTo(size * 0.2, -size, size * 0.4, -size * 0.5, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function flowerCluster(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const colors = ['#f9a8b8', '#ffbdcd', '#fcd0d8', '#f4a261aa'];
  for (let i = 0; i < 6; i++) {
    flowerPetal(ctx, cx, cy, size, (i * Math.PI) / 3, colors[i % colors.length]!);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#ffeb9c';
  ctx.fill();
}

function flowersThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#fff8f8';
  ctx.fillRect(0, 0, w, h);
  flowerCluster(ctx, 0, 0, w * 0.28);
  flowerCluster(ctx, w, 0, w * 0.28);
  flowerCluster(ctx, 0, h, w * 0.28);
  flowerCluster(ctx, w, h, w * 0.28);
  ctx.fillStyle = '#e8c8cf';
  ctx.fillRect(w * 0.12, h * 0.12, w * 0.76, h * 0.76);
}

async function flowersRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const H = W;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  const pad = 130;

  ctx.fillStyle = '#fff8f8';
  ctx.fillRect(0, 0, W, H);

  // Corner flower clusters
  const corners: [number, number][] = [[0, 0], [W, 0], [0, H], [W, H]];
  corners.forEach(([cx, cy]) => flowerCluster(ctx, cx, cy, W * 0.22));

  // Leaf/stem accents mid-sides
  ctx.strokeStyle = '#a8d5a2';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, H / 2 - 60); ctx.quadraticCurveTo(pad * 0.6, H / 2, 0, H / 2 + 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W, H / 2 - 60); ctx.quadraticCurveTo(W - pad * 0.6, H / 2, W, H / 2 + 60); ctx.stroke();

  // Photo with rounded corners
  if (images[0]) {
    ctx.save();
    roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 20);
    ctx.clip();
    const fi = filteredImg(images[0], filterId, W - pad * 2, H - pad * 2);
    ctx.drawImage(fi, pad, pad);
    ctx.restore();
  }

  // Delicate border around photo
  ctx.strokeStyle = 'rgba(244,162,97,0.5)';
  ctx.lineWidth = 3;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 20);
  ctx.stroke();

  drawStickers(ctx, stickers, W, H);
  return canvas;
}

// ── Frame 7: Minimal Border ───────────────────────────────────────────────────

function minimalThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 3;
  ctx.strokeRect(w * 0.04, h * 0.04, w * 0.92, h * 0.92);
  ctx.strokeStyle = PRIMARY + '44';
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.065, h * 0.065, w * 0.87, h * 0.87);
  ctx.fillStyle = '#eee';
  ctx.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
}

async function minimalRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const H = W;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
  const outer = 20, inner = 40, photo = 70;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Outer bold border
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 8;
  ctx.strokeRect(outer, outer, W - outer * 2, H - outer * 2);

  // Inner double hairline
  ctx.strokeStyle = PRIMARY + '55';
  ctx.lineWidth = 2;
  ctx.strokeRect(inner, inner, W - inner * 2, H - inner * 2);
  ctx.strokeStyle = PRIMARY + '33';
  ctx.lineWidth = 1;
  ctx.strokeRect(inner + 8, inner + 8, W - (inner + 8) * 2, H - (inner + 8) * 2);

  // Photo
  if (images[0]) {
    const pw = W - photo * 2, ph = H - photo * 2;
    ctx.save();
    roundRect(ctx, photo, photo, pw, ph, 6);
    ctx.clip();
    const fi = filteredImg(images[0], filterId, pw, ph);
    ctx.drawImage(fi, photo, photo);
    ctx.restore();
  }

  // Watermark
  ctx.font = 'italic 28px "Playfair Display", Georgia, serif';
  ctx.fillStyle = PRIMARY + '99';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Love Scrum ♥', W - outer - 16, H - outer - 16);

  drawStickers(ctx, stickers, W, H);
  return canvas;
}

// ── Frame 8: Love Letter ──────────────────────────────────────────────────────

function letterThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Antique paper
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#fdf5e8');
  grad.addColorStop(1, '#f5e8cc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Lines
  ctx.strokeStyle = '#d4b896';
  ctx.lineWidth = 1;
  for (let y = h * 0.25; y < h * 0.85; y += h * 0.1) {
    ctx.beginPath(); ctx.moveTo(w * 0.08, y); ctx.lineTo(w * 0.92, y); ctx.stroke();
  }
  // Stamp
  ctx.strokeStyle = '#E8788A';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.65, h * 0.06, w * 0.28, h * 0.2);
}

async function letterRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], _options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const H = 1350;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d')!;

  // Antique paper background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#fdf5e8');
  grad.addColorStop(1, '#f0dfc0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle texture: horizontal lines
  ctx.strokeStyle = 'rgba(180,150,100,0.15)';
  ctx.lineWidth = 1;
  for (let y = 60; y < H; y += 42) {
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
  }

  // Postmark circle
  ctx.beginPath();
  ctx.arc(W - 160, 130, 90, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(232,120,138,0.35)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = 'rgba(232,120,138,0.5)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOVE SCRUM', W - 160, 120);
  ctx.fillText('✦ ✦ ✦', W - 160, 148);

  // Stamp area
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 4;
  ctx.strokeRect(W - 260, 40, 170, 130);
  if (images[1] || images[0]) {
    const stampImg = images[1] ?? images[0]!;
    ctx.save();
    ctx.rect(W - 256, 44, 162, 122);
    ctx.clip();
    const fi = filteredImg(stampImg, filterId, 162, 122);
    ctx.drawImage(fi, W - 256, 44);
    ctx.restore();
  }

  // Main photo — polaroid style placement
  if (images[0]) {
    const pw = 680, ph = 520;
    const px = (W - pw) / 2, py = 220;
    // White photo mount
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, px - 20, py - 20, pw + 40, ph + 80, 4);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    const fi = filteredImg(images[0], filterId, pw, ph);
    ctx.drawImage(fi, px, py);
    ctx.restore();
  }

  // "Dear..." header
  ctx.font = `italic 52px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = '#7a5c3a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Dear You,', 80, 840);

  // Body lines
  ctx.font = `32px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = 'rgba(100,70,40,0.7)';
  const lines = [
    'Every moment with you is a memory',
    'I never want to forget. ♥',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 80, 910 + i * 50));

  // Signature
  ctx.font = `italic 44px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = '#7a5c3a';
  ctx.textAlign = 'right';
  ctx.fillText('Forever yours ♥', W - 80, 1260);

  drawStickers(ctx, stickers, W, H);
  return canvas;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

// ── Strip helpers ──────────────────────────────────────────────────────────────

const STRIP_W = 600;

function drawWatermark(ctx: CanvasRenderingContext2D, cw: number, ch: number, color: string): void {
  ctx.save();
  ctx.font = 'italic 18px "Playfair Display", Georgia, serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Love Scrum ♥  ' + new Date().toLocaleDateString('vi-VN'), cw / 2, ch - 10);
  ctx.restore();
}

function drawStripPhotos(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  filterId: string,
  slots: { x: number; y: number; w: number; h: number }[],
  frameColor: string,
): void {
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  slots.forEach(({ x, y, w, h }, i) => {
    ctx.save();
    roundRect(ctx, x, y, w, h, 4);
    ctx.clip();
    if (images[i]) {
      const fi = filteredImg(images[i]!, filterId, w, h);
      drawImageCover(ctx, fi, x, y, w, h);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  });
}

// ── Strip 1: Classic Strip (4 vertical) ───────────────────────────────────────

function classicStripThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.08, gap = h * 0.02;
  const ph = (h - pad * 1.6 - gap * 3) / 4;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#e0e0e0';
    roundRect(ctx, pad, pad * 0.5 + i * (ph + gap), w - pad * 2, ph, 3);
    ctx.fill();
  }
  ctx.fillStyle = PRIMARY + '88';
  ctx.font = `bold ${w * 0.07}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('♥', w / 2, h - 2);
}

async function classicStripRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const frameColor = options?.frameColor ?? '#FFFFFF';
  const H = 1800, sidePad = 30, topPad = 36, botPad = 64, gap = 12;
  const photoW = STRIP_W - sidePad * 2;
  const photoH = Math.floor((H - topPad - botPad - gap * 3) / 4);
  const slots = Array.from({ length: 4 }, (_, i) => ({
    x: sidePad, y: topPad + i * (photoH + gap), w: photoW, h: photoH,
  }));
  const canvas = createCanvas(STRIP_W, H);
  const ctx = canvas.getContext('2d')!;
  drawStripPhotos(ctx, images, filterId, slots, frameColor);
  drawWatermark(ctx, STRIP_W, H, PRIMARY + 'aa');
  drawStickers(ctx, stickers, STRIP_W, H);
  return canvas;
}

// ── Strip 2: Duo Strip (2 vertical) ───────────────────────────────────────────

function duoStripThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.08, gap = h * 0.03;
  const ph = (h - pad * 1.6 - gap) / 2;
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = '#e0e0e0';
    roundRect(ctx, pad, pad * 0.5 + i * (ph + gap), w - pad * 2, ph, 3);
    ctx.fill();
  }
  ctx.fillStyle = PRIMARY + '88';
  ctx.font = `bold ${w * 0.07}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('♥', w / 2, h - 2);
}

async function duoStripRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const frameColor = options?.frameColor ?? '#FFFFFF';
  const H = 900, sidePad = 30, topPad = 36, botPad = 64, gap = 12;
  const photoW = STRIP_W - sidePad * 2;
  const photoH = Math.floor((H - topPad - botPad - gap) / 2);
  const slots = Array.from({ length: 2 }, (_, i) => ({
    x: sidePad, y: topPad + i * (photoH + gap), w: photoW, h: photoH,
  }));
  const canvas = createCanvas(STRIP_W, H);
  const ctx = canvas.getContext('2d')!;
  drawStripPhotos(ctx, images, filterId, slots, frameColor);
  drawWatermark(ctx, STRIP_W, H, PRIMARY + 'aa');
  drawStickers(ctx, stickers, STRIP_W, H);
  return canvas;
}

// ── Strip 3: Triple Strip (3 vertical) ────────────────────────────────────────

function tripleStripThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.08, gap = h * 0.025;
  const ph = (h - pad * 1.6 - gap * 2) / 3;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#e0e0e0';
    roundRect(ctx, pad, pad * 0.5 + i * (ph + gap), w - pad * 2, ph, 3);
    ctx.fill();
  }
  ctx.fillStyle = PRIMARY + '88';
  ctx.font = `bold ${w * 0.07}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('♥', w / 2, h - 2);
}

async function tripleStripRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const frameColor = options?.frameColor ?? '#FFFFFF';
  const H = 1350, sidePad = 30, topPad = 36, botPad = 64, gap = 12;
  const photoW = STRIP_W - sidePad * 2;
  const photoH = Math.floor((H - topPad - botPad - gap * 2) / 3);
  const slots = Array.from({ length: 3 }, (_, i) => ({
    x: sidePad, y: topPad + i * (photoH + gap), w: photoW, h: photoH,
  }));
  const canvas = createCanvas(STRIP_W, H);
  const ctx = canvas.getContext('2d')!;
  drawStripPhotos(ctx, images, filterId, slots, frameColor);
  drawWatermark(ctx, STRIP_W, H, PRIMARY + 'aa');
  drawStickers(ctx, stickers, STRIP_W, H);
  return canvas;
}

// ── Strip 4: Grid 2x2 ─────────────────────────────────────────────────────────

function gridThumbnail(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.06, gap = w * 0.03;
  const cw = (w - pad * 2 - gap) / 2;
  const ch = (h - pad * 1.6 - gap) / 2;
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([col, row]) => {
    ctx.fillStyle = '#e0e0e0';
    roundRect(ctx, pad + col! * (cw + gap), pad * 0.5 + row! * (ch + gap), cw, ch, 3);
    ctx.fill();
  });
}

async function gridRender(
  images: HTMLImageElement[], filterId: string, stickers: PlacedSticker[], options?: { frameColor?: string },
): Promise<HTMLCanvasElement> {
  const frameColor = options?.frameColor ?? '#FFFFFF';
  const H = 720, sidePad = 20, topPad = 20, botPad = 52, gap = 10;
  const cellW = Math.floor((STRIP_W - sidePad * 2 - gap) / 2);
  const cellH = Math.floor((H - topPad - botPad - gap) / 2);
  const slots = [
    { x: sidePad, y: topPad, w: cellW, h: cellH },
    { x: sidePad + cellW + gap, y: topPad, w: cellW, h: cellH },
    { x: sidePad, y: topPad + cellH + gap, w: cellW, h: cellH },
    { x: sidePad + cellW + gap, y: topPad + cellH + gap, w: cellW, h: cellH },
  ];
  const canvas = createCanvas(STRIP_W, H);
  const ctx = canvas.getContext('2d')!;
  drawStripPhotos(ctx, images, filterId, slots, frameColor);
  drawWatermark(ctx, STRIP_W, H, PRIMARY + 'aa');
  drawStickers(ctx, stickers, STRIP_W, H);
  return canvas;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export const FRAMES: FrameDef[] = [
  {
    id: 'polaroid',
    label: 'Polaroid',
    emoji: '📸',
    photoCount: { min: 1, max: 1 },
    mode: 'frame',
    thumbnail: polaroidThumbnail,
    render: polaroidRender,
  },
  {
    id: 'heart',
    label: 'Heart Border',
    emoji: '💕',
    photoCount: { min: 1, max: 1 },
    mode: 'frame',
    thumbnail: heartThumbnail,
    render: heartRender,
  },
  {
    id: 'filmstrip',
    label: 'Film Strip',
    emoji: '🎞️',
    photoCount: { min: 1, max: 4 },
    mode: 'frame',
    thumbnail: filmThumbnail,
    render: filmRender,
  },
  {
    id: 'collage',
    label: 'Collage 2×2',
    emoji: '🖼️',
    photoCount: { min: 1, max: 4 },
    mode: 'frame',
    thumbnail: collageThumbnail,
    render: collageRender,
  },
  {
    id: 'vintage-round',
    label: 'Vintage Round',
    emoji: '🕰️',
    photoCount: { min: 1, max: 1 },
    mode: 'frame',
    thumbnail: vintageThumbnail,
    render: vintageRoundRender,
  },
  {
    id: 'flowers',
    label: 'Flowers',
    emoji: '🌸',
    photoCount: { min: 1, max: 1 },
    mode: 'frame',
    thumbnail: flowersThumbnail,
    render: flowersRender,
  },
  {
    id: 'minimal',
    label: 'Minimal Border',
    emoji: '🎀',
    photoCount: { min: 1, max: 1 },
    mode: 'frame',
    thumbnail: minimalThumbnail,
    render: minimalRender,
  },
  {
    id: 'letter',
    label: 'Love Letter',
    emoji: '💌',
    photoCount: { min: 1, max: 2 },
    mode: 'frame',
    thumbnail: letterThumbnail,
    render: letterRender,
  },
  // ── Strip layouts (Camera Mode) ──────────────────────────────────────────────
  {
    id: 'classic-strip',
    label: 'Classic Strip',
    emoji: '🎞',
    photoCount: { min: 4, max: 4 },
    mode: 'strip',
    thumbnail: classicStripThumbnail,
    render: classicStripRender,
  },
  {
    id: 'duo-strip',
    label: 'Duo Strip',
    emoji: '🤍',
    photoCount: { min: 2, max: 2 },
    mode: 'strip',
    thumbnail: duoStripThumbnail,
    render: duoStripRender,
  },
  {
    id: 'triple-strip',
    label: 'Triple Strip',
    emoji: '✨',
    photoCount: { min: 3, max: 3 },
    mode: 'strip',
    thumbnail: tripleStripThumbnail,
    render: tripleStripRender,
  },
  {
    id: 'grid-2x2',
    label: 'Grid 2×2',
    emoji: '⊞',
    photoCount: { min: 4, max: 4 },
    mode: 'strip',
    thumbnail: gridThumbnail,
    render: gridRender,
  },
];
