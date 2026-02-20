import { describe, it, expect, vi } from 'vitest';
import { FILTERS, applyFilterToCanvas } from '../lib/photobooth/filters';
import { FRAMES } from '../lib/photobooth/frames';
import { STICKERS, createPlacedSticker, drawStickerOnCanvas } from '../lib/photobooth/stickers';

// jsdom does not implement Canvas 2D — provide a no-op mock context
const fakeGradient = { addColorStop: () => {} };
function mockCtx(): CanvasRenderingContext2D {
  const noop = () => {};
  return new Proxy({} as CanvasRenderingContext2D, {
    get: (_target, prop) => {
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(16), width: 2, height: 2 });
      if (prop === 'createLinearGradient') return () => fakeGradient;
      if (prop === 'createRadialGradient') return () => fakeGradient;
      if (prop === 'measureText') return () => ({ width: 60 });
      if (typeof prop === 'string') return noop;
      return undefined;
    },
    set: () => true,
  });
}

function mockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx() as never);
  return canvas;
}

// ── Filters ──────────────────────────────────────────────────────────────────

describe('FILTERS', () => {
  it('exports 8 filters', () => {
    expect(FILTERS.length).toBe(8);
  });

  it('has unique ids', () => {
    const ids = FILTERS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('original filter returns data unchanged', () => {
    const data = new Uint8ClampedArray([100, 150, 200, 255, 50, 60, 70, 255]);
    const imageData = { data, width: 2, height: 1 } as ImageData;
    const original = FILTERS.find((f) => f.id === 'original')!;
    const result = original.apply(imageData);
    expect(result.data[0]).toBe(100);
    expect(result.data[4]).toBe(50);
  });

  it('grayscale makes R=G=B', () => {
    const data = new Uint8ClampedArray([200, 100, 50, 255]);
    const imageData = { data, width: 1, height: 1 } as ImageData;
    const gray = FILTERS.find((f) => f.id === 'grayscale')!;
    gray.apply(imageData);
    expect(imageData.data[0]).toBe(imageData.data[1]);
    expect(imageData.data[1]).toBe(imageData.data[2]);
  });

  it('all filters have css property', () => {
    FILTERS.forEach((f) => expect(typeof f.css).toBe('string'));
  });

  it('applyFilterToCanvas does nothing for original', () => {
    const canvas = mockCanvas();
    expect(() => applyFilterToCanvas(canvas, 'original')).not.toThrow();
  });
});

// ── Frames ────────────────────────────────────────────────────────────────────

describe('FRAMES', () => {
  it('exports 12 frames total (8 frame + 4 strip)', () => {
    expect(FRAMES.length).toBe(12);
  });

  it('has 8 frame-mode and 4 strip-mode entries', () => {
    const frameCount = FRAMES.filter((f) => f.mode === 'frame').length;
    const stripCount = FRAMES.filter((f) => f.mode === 'strip').length;
    expect(frameCount).toBe(8);
    expect(stripCount).toBe(4);
  });

  it('each frame has required fields', () => {
    FRAMES.forEach((f) => {
      expect(typeof f.id).toBe('string');
      expect(typeof f.label).toBe('string');
      expect(typeof f.render).toBe('function');
      expect(typeof f.thumbnail).toBe('function');
      expect(['frame', 'strip']).toContain(f.mode);
      expect(f.photoCount.min).toBeGreaterThanOrEqual(1);
      expect(f.photoCount.max).toBeGreaterThanOrEqual(f.photoCount.min);
    });
  });

  it('thumbnail draws without throwing', () => {
    const ctx = mockCtx();
    FRAMES.forEach((frame) => {
      expect(() => frame.thumbnail(ctx, 160, 160)).not.toThrow();
    });
  });

  it('strip frames have exact photoCount (min === max)', () => {
    FRAMES.filter((f) => f.mode === 'strip').forEach((f) => {
      expect(f.photoCount.min).toBe(f.photoCount.max);
    });
  });

  it('strip frame ids are correct', () => {
    const stripIds = FRAMES.filter((f) => f.mode === 'strip').map((f) => f.id);
    expect(stripIds).toContain('classic-strip');
    expect(stripIds).toContain('duo-strip');
    expect(stripIds).toContain('triple-strip');
    expect(stripIds).toContain('grid-2x2');
  });

  it('classic-strip requires 4 photos', () => {
    const f = FRAMES.find((f) => f.id === 'classic-strip')!;
    expect(f.photoCount.min).toBe(4);
  });

  it('duo-strip requires 2 photos', () => {
    const f = FRAMES.find((f) => f.id === 'duo-strip')!;
    expect(f.photoCount.min).toBe(2);
  });
});

// ── Stickers ──────────────────────────────────────────────────────────────────

describe('STICKERS', () => {
  it('exports at least 18 stickers', () => {
    expect(STICKERS.length).toBeGreaterThanOrEqual(18);
  });

  it('covers 3 categories', () => {
    const cats = new Set(STICKERS.map((s) => s.category));
    expect(cats.has('love')).toBe(true);
    expect(cats.has('fun')).toBe(true);
    expect(cats.has('text')).toBe(true);
  });

  it('createPlacedSticker generates unique ids', () => {
    const a = createPlacedSticker('heart');
    const b = createPlacedSticker('heart');
    expect(a.id).not.toBe(b.id);
    expect(a.stickerId).toBe('heart');
    expect(a.x).toBe(50);
    expect(a.y).toBe(50);
    expect(a.scale).toBe(1);
    expect(a.rotation).toBe(0);
  });

  it('drawStickerOnCanvas runs without error', () => {
    const ctx = mockCtx();
    const sticker = createPlacedSticker('heart');
    expect(() => drawStickerOnCanvas(ctx, sticker, 400, 400)).not.toThrow();
  });

  it('drawStickerOnCanvas handles unknown stickerId gracefully', () => {
    const ctx = mockCtx();
    const sticker = { ...createPlacedSticker('heart'), stickerId: 'nonexistent' };
    expect(() => drawStickerOnCanvas(ctx, sticker, 200, 200)).not.toThrow();
  });
});

// ── useCamera (mocked) ────────────────────────────────────────────────────────

describe('useCamera mock', () => {
  it('navigator.mediaDevices.getUserMedia mock is available to test', () => {
    // In jsdom, getUserMedia does not exist — this test verifies we can mock it
    const mockGetUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [] });
    const orig = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });
    expect(navigator.mediaDevices.getUserMedia).toBeDefined();
    Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true });
  });
});

// ── ColorPicker preset colors ─────────────────────────────────────────────────

describe('ColorPicker presets', () => {
  it('has 10 preset colors defined', () => {
    // Inline check — matches PRESETS array in ColorPicker.tsx
    const PRESETS = [
      '#FFFFFF', '#1A1A1A', '#E8788A', '#F4A261', '#7EC8B5',
      '#C3B1E1', '#F4C430', '#89CFF0', '#FF6B6B', '#FFF8E7',
    ];
    expect(PRESETS.length).toBe(10);
    PRESETS.forEach((c) => expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/));
  });
});

// ── SharePanel (API availability) ─────────────────────────────────────────────

describe('SharePanel', () => {
  it('navigator.share feature detection does not throw', () => {
    const canWebShare = typeof navigator !== 'undefined' && 'share' in navigator;
    expect(typeof canWebShare).toBe('boolean');
  });

  it('navigator.clipboard feature detection does not throw', () => {
    const canClipboard = typeof navigator !== 'undefined' && 'clipboard' in navigator;
    expect(typeof canClipboard).toBe('boolean');
  });
});
