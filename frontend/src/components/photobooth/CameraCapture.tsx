import { useEffect, useState, useRef, useCallback } from 'react';
import { Camera, FlipHorizontal, RefreshCcw } from 'lucide-react';
import { useCamera } from '../../lib/photobooth/useCamera';
import { FILTERS } from '../../lib/photobooth/filters';

interface Props {
  photoCount: number;
  filterId: string;
  onFilterChange: (id: string) => void;
  onComplete: (dataUrls: string[]) => void;
  onFallbackToGallery: () => void;
}

type Phase = 'idle' | 'countdown' | 'flash' | 'done';

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export default function CameraCapture({
  photoCount, filterId, onFilterChange, onComplete, onFallbackToGallery,
}: Props) {
  const { videoRef, error, isReady, startCamera, stopCamera, toggleFacing, captureFrame, facingMode } = useCamera();
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [shotIndex, setShotIndex] = useState(0);
  const [captured, setCaptured] = useState<string[]>([]);
  const cancelRef = useRef(false);

  useEffect(() => {
    startCamera('user');
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedFilter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0]!;
  const filterCss = selectedFilter.css === 'none' ? undefined : selectedFilter.css;

  const runSequence = useCallback(async () => {
    if (!isReady) return;
    cancelRef.current = false;
    const CAPTURE_W = 1280, CAPTURE_H = 960;
    const results: string[] = [];

    for (let shot = 0; shot < photoCount; shot++) {
      if (cancelRef.current) return;
      setShotIndex(shot);

      for (let c = 3; c >= 1; c--) {
        if (cancelRef.current) return;
        setPhase('countdown');
        setCountdown(c);
        await wait(900);
      }

      if (cancelRef.current) return;
      setPhase('flash');
      const url = captureFrame(CAPTURE_W, CAPTURE_H, filterCss);
      if (url) results.push(url);
      await wait(300);
      setPhase('countdown');
      await wait(700);
    }

    if (!cancelRef.current) {
      setCaptured(results);
      setPhase('done');
    }
  }, [isReady, photoCount, captureFrame, filterCss]);

  const handleRetake = () => {
    cancelRef.current = true;
    setCaptured([]);
    setShotIndex(0);
    setPhase('idle');
  };

  if (error) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl">📷</div>
        <p className="text-sm text-red-500 font-medium max-w-xs mx-auto">{error}</p>
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={() => startCamera('user')}
            className="px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-semibold hover:opacity-90"
          >
            Try Again
          </button>
          <button
            onClick={onFallbackToGallery}
            className="text-sm text-text-light underline"
          >
            Use Gallery Mode instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold">
        {phase === 'done'
          ? `${captured.length} photo${captured.length > 1 ? 's' : ''} ready!`
          : `Shot ${Math.min(shotIndex + 1, photoCount)} of ${photoCount}`}
      </h2>

      {/* Camera viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{
            filter: filterCss,
            transform: facingMode === 'user' ? 'scaleX(-1)' : undefined,
          }}
        />

        {/* Countdown overlay */}
        {phase === 'countdown' && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="font-black text-white drop-shadow-2xl select-none"
              style={{ fontSize: 120, lineHeight: 1, textShadow: '0 0 40px rgba(0,0,0,0.6)' }}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* Flash */}
        {phase === 'flash' && (
          <div className="absolute inset-0 bg-white" style={{ animation: 'flash 0.3s ease-out forwards' }} />
        )}

        {/* Captured thumbnails strip */}
        {captured.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1.5">
            {captured.map((url, i) => (
              <img key={i} src={url} alt="" className="w-12 h-9 object-cover rounded-lg border-2 border-white shadow" />
            ))}
          </div>
        )}

        {/* Camera loading */}
        {!isReady && phase === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-white text-sm">Starting camera…</p>
          </div>
        )}
      </div>

      {/* Filter strip (only when idle) */}
      {phase === 'idle' && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 snap-start transition-all ${
                f.id === filterId ? 'scale-110' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  f.id === filterId ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(135deg,#f9a8b8,#fcd0d8,#7EC8B5)',
                    filter: f.css === 'none' ? undefined : f.css,
                  }}
                />
              </div>
              <span className={`text-[10px] font-medium ${f.id === filterId ? 'text-primary' : 'text-text-light'}`}>
                {f.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {phase === 'idle' && (
          <>
            <button
              onClick={toggleFacing}
              className="p-3 border border-border rounded-2xl hover:bg-gray-50 transition-colors"
              title="Flip camera"
            >
              <FlipHorizontal className="w-5 h-5 text-text-light" />
            </button>
            <button
              onClick={runSequence}
              disabled={!isReady}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl py-3 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              Start — {photoCount} shot{photoCount > 1 ? 's' : ''}
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={() => onComplete(captured)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl py-3 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              Use These Photos →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
