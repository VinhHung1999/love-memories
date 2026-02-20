import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { loadImage, createCanvas } from '../../lib/photobooth/canvas-utils';
import { FRAMES } from '../../lib/photobooth/frames';
import type { PlacedSticker } from '../../lib/photobooth/stickers';
import { drawStickerOnCanvas } from '../../lib/photobooth/stickers';
import { drawOverlayOnCanvas } from '../../lib/photobooth/overlays';
import SharePanel from './SharePanel';

interface Props {
  frameId: string;
  photoUrls: string[];
  filterId: string;
  stickers: PlacedSticker[];
  frameColor?: string;
  overlayId?: string;
  onStickersChange: (stickers: PlacedSticker[]) => void;
}

export default function CanvasPreview({
  frameId, photoUrls, filterId, stickers, frameColor, overlayId, onStickersChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const frame = FRAMES.find((f) => f.id === frameId);

  useEffect(() => {
    if (!frame || photoUrls.length === 0) return;
    let cancelled = false;
    setRendering(true);
    setError(null);

    (async () => {
      try {
        const images = await Promise.all(photoUrls.map((url) => loadImage(url)));

        // Render frame base — pass empty stickers so we can composite in correct order below
        const base = await frame.render(images, filterId, [], { frameColor });
        if (cancelled) return;

        // Composite: base → overlay → stickers (correct layer order for both download and preview)
        const finalCanvas = createCanvas(base.width, base.height);
        const finalCtx = finalCanvas.getContext('2d')!;
        finalCtx.drawImage(base, 0, 0);

        if (overlayId && overlayId !== 'none') {
          drawOverlayOnCanvas(finalCtx, overlayId, finalCanvas.width, finalCanvas.height);
        }

        stickers.forEach((s) => drawStickerOnCanvas(finalCtx, s, finalCanvas.width, finalCanvas.height));

        resultCanvasRef.current = finalCanvas;

        const preview = canvasRef.current;
        if (!preview) return;
        const maxW = preview.parentElement?.clientWidth ?? 400;
        const scale = maxW / finalCanvas.width;
        preview.width = maxW;
        preview.height = Math.round(finalCanvas.height * scale);
        const ctx = preview.getContext('2d')!;
        ctx.clearRect(0, 0, preview.width, preview.height);
        ctx.drawImage(finalCanvas, 0, 0, preview.width, preview.height);
      } catch {
        if (!cancelled) setError('Could not load photo. Check CORS or try another.');
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => { cancelled = true; };
  }, [frame, photoUrls, filterId, stickers, frameColor, overlayId]);

  // ── drag props ─────────────────────────────────────────────────────────────

  const getStickerAt = useCallback((x: number, y: number, cw: number, ch: number): string | null => {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i]!;
      const px = (s.x / 100) * cw;
      const py = (s.y / 100) * ch;
      const r = Math.min(cw, ch) * 0.08 * s.scale;
      if (Math.abs(x - px) < r && Math.abs(y - py) < r) return s.id;
    }
    return null;
  }, [stickers]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cw = canvas.width, ch = canvas.height;
    const hit = getStickerAt(x, y, cw, ch);
    if (hit) {
      const s = stickers.find((st) => st.id === hit)!;
      dragOffset.current = { dx: x - (s.x / 100) * cw, dy: y - (s.y / 100) * ch };
      setDragging(hit);
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.current.dx;
    const y = e.clientY - rect.top - dragOffset.current.dy;
    const cw = canvas.width, ch = canvas.height;
    onStickersChange(
      stickers.map((s) =>
        s.id === dragging
          ? { ...s, x: Math.max(0, Math.min(100, (x / cw) * 100)), y: Math.max(0, Math.min(100, (y / ch) * 100)) }
          : s,
      ),
    );
  };

  const handlePointerUp = () => setDragging(null);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold">Preview & Download</h2>

      <div className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 text-sm text-red-500 px-4 text-center">
            {error}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ cursor: dragging ? 'grabbing' : 'default', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <p className="text-xs text-text-light text-center">
        Drag props to reposition · Use +/− in the props panel to resize
      </p>

      <SharePanel
        resultCanvas={resultCanvasRef.current}
        disabled={rendering || !!error || photoUrls.length === 0}
      />
    </div>
  );
}
