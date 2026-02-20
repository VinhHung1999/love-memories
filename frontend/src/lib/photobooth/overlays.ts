// Frame overlay system — all designs drawn with Canvas 2D API, no external assets.

export interface OverlayDef {
  id: string;
  label: string;
  emoji: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

// ── Seeded PRNG (LCG) — deterministic layout regardless of canvas size ─────────

function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

// ── Shape helpers ──────────────────────────────────────────────────────────────

function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r);
  ctx.bezierCurveTo(cx - r * 2, cy + r, cx - r * 2.5, cy - r, cx, cy - r * 0.5);
  ctx.bezierCurveTo(cx + r * 2.5, cy - r, cx + r * 2, cy + r, cx, cy + r);
  ctx.closePath();
}

function starPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  points = 4, innerRatio = 0.35,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * innerRatio;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  petalColor: string, centerColor: string,
): void {
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r * 0.65;
    const py = cy + Math.sin(angle) * r * 0.65;
    ctx.fillStyle = petalColor;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.48, r * 0.3, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// Simple rose: overlapping circles creating petal clusters
function drawRose(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  color: string, alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  // Outer petals
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * r * 0.5, cy + Math.sin(angle) * r * 0.5, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  // Center
  ctx.fillStyle = '#C0392B';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.1, cy - r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── 1. Flowers Border ──────────────────────────────────────────────────────────

function drawFlowersBorder(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const colors = ['#FFB7C5', '#FF8FAB', '#FFD1DC', '#FFAEC9', '#FFC0CB'];
  const center = '#FFD700';
  const r = w * 0.032;
  const cols = Math.round(w / (r * 2.4));
  const rows = Math.round(h / (r * 2.4));

  for (let i = 0; i <= cols; i++) {
    const x = (i / cols) * w;
    drawFlower(ctx, x, r * 0.9, r, colors[i % 5]!, center);
    drawFlower(ctx, x, h - r * 0.9, r, colors[(i + 2) % 5]!, center);
  }
  for (let j = 1; j < rows; j++) {
    const y = (j / rows) * h;
    drawFlower(ctx, r * 0.9, y, r, colors[j % 5]!, center);
    drawFlower(ctx, w - r * 0.9, y, r, colors[(j + 3) % 5]!, center);
  }
}

// ── 2. Hearts Scattered ────────────────────────────────────────────────────────

function drawHeartsScattered(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const rng = seededRng(1337);
  const colors = ['#E8788A', '#FF6B8A', '#C86677', '#F4A261', '#FFB7C5', '#E74C3C'];
  for (let i = 0; i < 30; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = w * (0.014 + rng() * 0.026);
    ctx.save();
    ctx.globalAlpha = 0.45 + rng() * 0.55;
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)] ?? '#E8788A';
    ctx.translate(x, y);
    ctx.rotate((rng() - 0.5) * Math.PI * 0.6);
    heartPath(ctx, 0, 0, r);
    ctx.fill();
    ctx.restore();
  }
}

// ── 3. Stars & Sparkles ────────────────────────────────────────────────────────

function drawStarsSparkles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const rng = seededRng(2025);
  const colors = ['#FFD700', '#FFC200', '#FFE55C', '#FFFACD', '#FFB700'];

  // 4-point sparkles
  for (let i = 0; i < 18; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = w * (0.016 + rng() * 0.022);
    ctx.save();
    ctx.globalAlpha = 0.55 + rng() * 0.45;
    ctx.fillStyle = colors[Math.floor(rng() * 3)] ?? '#FFD700';
    ctx.translate(x, y);
    ctx.rotate(rng() * Math.PI / 4);
    starPath(ctx, 0, 0, r, 4, 0.28);
    ctx.fill();
    ctx.restore();
  }

  // Small dot accents
  for (let i = 0; i < 28; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = w * (0.004 + rng() * 0.009);
    ctx.save();
    ctx.globalAlpha = 0.5 + rng() * 0.5;
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)] ?? '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── 4. Vintage Ornamental ──────────────────────────────────────────────────────

function drawVintageOrnamental(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const color = '#B8860B';
  const size = Math.min(w, h) * 0.17;
  const lw = w * 0.0045;

  type Corner = { x: number; y: number; sx: number; sy: number };
  const corners: Corner[] = [
    { x: 0, y: 0, sx: 1, sy: 1 },
    { x: w, y: 0, sx: -1, sy: 1 },
    { x: 0, y: h, sx: 1, sy: -1 },
    { x: w, y: h, sx: -1, sy: -1 },
  ];

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';

  for (const { x, y, sx, sy } of corners) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    // Main L arms
    ctx.beginPath();
    ctx.moveTo(size * 0.06, size * 0.42);
    ctx.lineTo(size * 0.06, size * 0.06);
    ctx.lineTo(size * 0.42, size * 0.06);
    ctx.stroke();

    // Inner decorative curve
    ctx.beginPath();
    ctx.moveTo(size * 0.18, size * 0.38);
    ctx.quadraticCurveTo(size * 0.18, size * 0.18, size * 0.38, size * 0.18);
    ctx.stroke();

    // Corner dot
    ctx.beginPath();
    ctx.arc(size * 0.06, size * 0.06, lw * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Diamond accent at arm ends
    const dSize = lw * 1.6;
    ctx.save();
    ctx.translate(size * 0.06, size * 0.48);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-dSize, -dSize, dSize * 2, dSize * 2);
    ctx.restore();
    ctx.save();
    ctx.translate(size * 0.48, size * 0.06);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-dSize, -dSize, dSize * 2, dSize * 2);
    ctx.restore();

    // Dot accents along arms
    for (let k = 0; k < 3; k++) {
      const t = 0.56 + k * 0.14;
      ctx.beginPath();
      ctx.arc(size * t, size * 0.06, lw * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.06, size * t, lw * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── 5. Minimal Corners ─────────────────────────────────────────────────────────

function drawMinimalCorners(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const color = '#C5A028';
  const arm = Math.min(w, h) * 0.1;
  const lw = w * 0.0048;
  const gap = lw * 1.5;

  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'square';

  type C = [number, number, number, number];
  const corners: C[] = [
    [gap, gap, 1, 1],
    [w - gap, gap, -1, 1],
    [gap, h - gap, 1, -1],
    [w - gap, h - gap, -1, -1],
  ];

  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * arm);
    ctx.stroke();
  }

  // Mid-edge accent ticks
  const tick = arm * 0.35;
  ctx.lineWidth = lw * 0.6;
  type Tick = [number, number, number, number];
  const ticks: Tick[] = [
    [w / 2, gap, 1, 0],
    [w / 2, h - gap, 1, 0],
    [gap, h / 2, 0, 1],
    [w - gap, h / 2, 0, 1],
  ];
  for (const [tcx, tcy, horiz, vert] of ticks) {
    ctx.beginPath();
    ctx.moveTo(tcx - tick * horiz, tcy - tick * vert);
    ctx.lineTo(tcx + tick * horiz, tcy + tick * vert);
    ctx.stroke();
  }
}

// ── 6. Love Doodles ────────────────────────────────────────────────────────────

function drawLoveDoodles(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const rng = seededRng(777);
  const colors = ['#E8788A', '#F4A261', '#C3B1E1', '#7EC8B5', '#FFB7C5', '#FF8FAB'];

  for (let i = 0; i < 38; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const type = Math.floor(rng() * 4);
    const s = w * (0.011 + rng() * 0.02);
    const color = colors[Math.floor(rng() * colors.length)] ?? colors[0]!;

    ctx.save();
    ctx.globalAlpha = 0.45 + rng() * 0.5;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = w * 0.004;
    ctx.lineCap = 'round';
    ctx.translate(x, y);
    ctx.rotate((rng() - 0.5) * Math.PI);

    switch (type) {
      case 0: heartPath(ctx, 0, 0, s * 0.65); ctx.fill(); break;
      case 1:
        ctx.beginPath();
        ctx.moveTo(-s, -s); ctx.lineTo(s, s);
        ctx.moveTo(s, -s);  ctx.lineTo(-s, s);
        ctx.stroke();
        break;
      case 2: starPath(ctx, 0, 0, s, 4, 0.3); ctx.fill(); break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
  }
}

// ── 7. Party Confetti ──────────────────────────────────────────────────────────

function drawPartyConfetti(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const rng = seededRng(999);
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#F7DC6F', '#BB8FCE',
    '#E74C3C', '#3498DB', '#2ECC71', '#E91E63',
  ];

  for (let i = 0; i < 55; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const s = w * (0.007 + rng() * 0.015);
    const color = colors[Math.floor(rng() * colors.length)] ?? colors[0]!;

    ctx.save();
    ctx.globalAlpha = 0.55 + rng() * 0.45;
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.rotate(rng() * Math.PI * 2);

    if (rng() > 0.45) {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-s, -s * 0.45, s * 2, s * 0.9);
    }
    ctx.restore();
  }
}

// ── 8. Romantic Roses ─────────────────────────────────────────────────────────

function drawRomanticRoses(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const rng = seededRng(2024);
  const roseR = Math.min(w, h) * 0.09;

  // Roses in all 4 corners
  const corners = [
    { x: roseR * 1.1, y: roseR * 1.1 },
    { x: w - roseR * 1.1, y: roseR * 1.1 },
    { x: roseR * 1.1, y: h - roseR * 1.1 },
    { x: w - roseR * 1.1, y: h - roseR * 1.1 },
  ];
  for (const c of corners) drawRose(ctx, c.x, c.y, roseR, '#C0392B', 0.9);

  // Scattered small rose buds
  for (let i = 0; i < 10; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = w * (0.022 + rng() * 0.022);
    drawRose(ctx, x, y, r, '#E74C3C', 0.55 + rng() * 0.35);
  }

  // Scattered petals (simple ellipses)
  for (let i = 0; i < 22; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = w * (0.007 + rng() * 0.012);
    const angle = rng() * Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = 0.35 + rng() * 0.45;
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.6, r * 0.6, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Overlay registry ───────────────────────────────────────────────────────────

export const OVERLAYS: OverlayDef[] = [
  { id: 'none',               label: 'None',         emoji: '✕',  draw: () => {} },
  { id: 'flowers-border',     label: 'Flowers',      emoji: '🌸', draw: drawFlowersBorder },
  { id: 'hearts-scattered',   label: 'Hearts',       emoji: '💕', draw: drawHeartsScattered },
  { id: 'stars-sparkles',     label: 'Sparkles',     emoji: '✨', draw: drawStarsSparkles },
  { id: 'vintage-ornamental', label: 'Vintage',      emoji: '🏛️', draw: drawVintageOrnamental },
  { id: 'minimal-corners',    label: 'Minimal',      emoji: '◻️', draw: drawMinimalCorners },
  { id: 'love-doodles',       label: 'Love Doodles', emoji: '💝', draw: drawLoveDoodles },
  { id: 'party-confetti',     label: 'Confetti',     emoji: '🎊', draw: drawPartyConfetti },
  { id: 'romantic-roses',     label: 'Roses',        emoji: '🌹', draw: drawRomanticRoses },
];

export function drawOverlayOnCanvas(
  ctx: CanvasRenderingContext2D,
  overlayId: string,
  w: number,
  h: number,
): void {
  const overlay = OVERLAYS.find((o) => o.id === overlayId);
  if (overlay) overlay.draw(ctx, w, h);
}
