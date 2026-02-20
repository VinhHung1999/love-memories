import { useEffect, useRef } from 'react';
import { OVERLAYS, type OverlayDef } from '../../lib/photobooth/overlays';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function OverlaySelector({ selectedId, onSelect }: Props) {
  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-1">Frame Overlay</h2>
      <p className="text-xs text-text-light mb-4">Decorative overlay on top of your photo frame</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {OVERLAYS.map((overlay) => (
          <OverlayCard
            key={overlay.id}
            overlay={overlay}
            selected={overlay.id === selectedId}
            onSelect={() => onSelect(overlay.id)}
          />
        ))}
      </div>
    </div>
  );
}

function OverlayCard({
  overlay, selected, onSelect,
}: {
  overlay: OverlayDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (overlay.id === 'none') {
      // Show a subtle "no overlay" indicator
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = '#999';
      ctx.font = `bold ${w * 0.22}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('None', w / 2, h / 2);
    } else {
      // Neutral photo placeholder background
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(w * 0.12, h * 0.1, w * 0.76, h * 0.8);
      // Draw overlay on top
      overlay.draw(ctx, w, h);
    }
  }, [overlay]);

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border hover:border-primary/40 hover:bg-primary/3'
      }`}
    >
      <canvas
        ref={canvasRef}
        width={100}
        height={110}
        className="w-full rounded-xl"
      />
      <span className="text-xs font-medium text-center leading-tight">
        {overlay.emoji} {overlay.label}
      </span>
    </button>
  );
}
