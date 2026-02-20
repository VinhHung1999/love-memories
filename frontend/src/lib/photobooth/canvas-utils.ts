export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

const TOKEN_KEY = 'love-scrum-token';

export async function loadImage(url: string): Promise<HTMLImageElement> {
  // data: URLs (from camera capture) load directly — no fetch needed
  if (url.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load data URL'));
      img.src = url;
    });
  }

  // Absolute CDN URLs are cross-origin — proxy through backend to avoid CORS taint.
  // Relative /uploads/ URLs are same-origin and can be fetched directly.
  let fetchUrl = url;
  const headers: Record<string, string> = {};
  if (url.startsWith('http')) {
    fetchUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(fetchUrl, { headers });
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = objectUrl;
  });
}

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  x: number, y: number, w: number, h: number,
): void {
  const srcW = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const srcH = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  const imgAspect = srcW / srcH;
  const boxAspect = w / h;
  let sx = 0, sy = 0, sw = srcW, sh = srcH;
  if (imgAspect > boxAspect) {
    sw = srcH * boxAspect;
    sx = (srcW - sw) / 2;
  } else {
    sh = srcW / boxAspect;
    sy = (srcH - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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

export function fitDimensions(
  srcW: number, srcH: number, maxW: number, maxH: number,
): { width: number; height: number } {
  const ratio = Math.min(maxW / srcW, maxH / srcH);
  return { width: Math.round(srcW * ratio), height: Math.round(srcH * ratio) };
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'photo-booth.png'): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/** Apply a photo onto an offscreen canvas with filter and return the resulting canvas */
export function renderFilteredImage(
  img: HTMLImageElement,
  w: number,
  h: number,
  applyFn: (canvas: HTMLCanvasElement) => void,
): HTMLCanvasElement {
  const offscreen = createCanvas(w, h);
  const ctx = offscreen.getContext('2d')!;
  drawImageCover(ctx, img, 0, 0, w, h);
  applyFn(offscreen);
  return offscreen;
}
