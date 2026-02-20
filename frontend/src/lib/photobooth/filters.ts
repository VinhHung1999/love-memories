export interface FilterDef {
  id: string;
  label: string;
  css: string;
  apply: (imageData: ImageData) => ImageData;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function grayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    data[i] = data[i + 1] = data[i + 2] = g;
  }
}

function sepia(data: Uint8ClampedArray, s: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    data[i]     = clamp(r * (1 - 0.607 * s) + g * 0.769 * s + b * 0.189 * s);
    data[i + 1] = clamp(r * 0.349 * s + g * (1 - 0.314 * s) + b * 0.168 * s);
    data[i + 2] = clamp(r * 0.272 * s + g * 0.534 * s + b * (1 - 0.869 * s));
  }
}

function brightness(data: Uint8ClampedArray, f: number): void {
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp(data[i]! * f);
    data[i + 1] = clamp(data[i + 1]! * f);
    data[i + 2] = clamp(data[i + 2]! * f);
  }
}

function saturation(data: Uint8ClampedArray, f: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    data[i]     = clamp(gray + (data[i]! - gray) * f);
    data[i + 1] = clamp(gray + (data[i + 1]! - gray) * f);
    data[i + 2] = clamp(gray + (data[i + 2]! - gray) * f);
  }
}

function contrast(data: Uint8ClampedArray, f: number): void {
  const intercept = 128 * (1 - f);
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = clamp(data[i]! * f + intercept);
    data[i + 1] = clamp(data[i + 1]! * f + intercept);
    data[i + 2] = clamp(data[i + 2]! * f + intercept);
  }
}

function hueRotate(data: Uint8ClampedArray, deg: number): void {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    data[i]     = clamp(r * (0.213 + cos * 0.787 - sin * 0.213) + g * (0.715 - cos * 0.715 - sin * 0.715) + b * (0.072 - cos * 0.072 + sin * 0.928));
    data[i + 1] = clamp(r * (0.213 - cos * 0.213 + sin * 0.143) + g * (0.715 + cos * 0.285 + sin * 0.140) + b * (0.072 - cos * 0.072 - sin * 0.283));
    data[i + 2] = clamp(r * (0.213 - cos * 0.213 - sin * 0.787) + g * (0.715 - cos * 0.715 + sin * 0.715) + b * (0.072 + cos * 0.928 + sin * 0.072));
  }
}

// ── public API ────────────────────────────────────────────────────────────────

export function applyFilterToCanvas(canvas: HTMLCanvasElement, filterId: string): void {
  if (filterId === 'original') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const filter = FILTERS.find((f) => f.id === filterId);
  if (!filter) return;
  filter.apply(imageData);
  ctx.putImageData(imageData, 0, 0);
}

export const FILTERS: FilterDef[] = [
  {
    id: 'original',
    label: 'Original',
    css: 'none',
    apply: (d) => d,
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    css: 'grayscale(100%)',
    apply: (d) => { grayscale(d.data); return d; },
  },
  {
    id: 'sepia',
    label: 'Sepia',
    css: 'sepia(80%)',
    apply: (d) => { sepia(d.data, 0.8); return d; },
  },
  {
    id: 'warm',
    label: 'Warm',
    css: 'sepia(20%) saturate(140%) brightness(105%)',
    apply: (d) => { sepia(d.data, 0.2); saturation(d.data, 1.4); brightness(d.data, 1.05); return d; },
  },
  {
    id: 'cool',
    label: 'Cool',
    css: 'hue-rotate(15deg) saturate(110%) brightness(105%)',
    apply: (d) => { hueRotate(d.data, 15); saturation(d.data, 1.1); brightness(d.data, 1.05); return d; },
  },
  {
    id: 'rose',
    label: 'Rose',
    css: 'sepia(15%) hue-rotate(-10deg) saturate(130%)',
    apply: (d) => { sepia(d.data, 0.15); hueRotate(d.data, -10); saturation(d.data, 1.3); return d; },
  },
  {
    id: 'vintage',
    label: 'Vintage',
    css: 'sepia(30%) contrast(85%) brightness(110%) saturate(80%)',
    apply: (d) => { sepia(d.data, 0.3); contrast(d.data, 0.85); brightness(d.data, 1.1); saturation(d.data, 0.8); return d; },
  },
  {
    id: 'softglow',
    label: 'Soft Glow',
    css: 'brightness(110%) contrast(90%) saturate(110%)',
    apply: (d) => { brightness(d.data, 1.1); contrast(d.data, 0.9); saturation(d.data, 1.1); return d; },
  },
];
