import { useEffect, useRef } from 'react';
import { FRAMES, type FrameDef } from '../../lib/photobooth/frames';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  filterMode?: 'frame' | 'strip';
}

export default function FrameSelector({ selectedId, onSelect, filterMode }: Props) {
  const frames = filterMode ? FRAMES.filter((f) => f.mode === filterMode) : FRAMES;
  const title = filterMode === 'strip' ? 'Choose a Layout' : 'Choose a Frame';

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {frames.map((frame) => (
          <FrameCard
            key={frame.id}
            frame={frame}
            selected={frame.id === selectedId}
            onSelect={() => onSelect(frame.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FrameCard({
  frame,
  selected,
  onSelect,
}: {
  frame: FrameDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame.thumbnail(ctx, canvas.width, canvas.height);
  }, [frame]);

  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border hover:border-primary/40 hover:bg-primary/3'
      }`}
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        className="w-full aspect-square rounded-xl object-cover"
      />
      <span className="text-sm font-medium text-center leading-tight">
        {frame.emoji} {frame.label}
      </span>
      <span className="text-xs text-text-light">
        {frame.photoCount.min === frame.photoCount.max
          ? `${frame.photoCount.min} photo${frame.photoCount.min > 1 ? 's' : ''}`
          : `${frame.photoCount.min}–${frame.photoCount.max} photos`}
      </span>
    </button>
  );
}
