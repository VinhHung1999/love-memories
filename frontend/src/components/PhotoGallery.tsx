import { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGalleryProps {
  photos: { id: string; url: string }[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export default function PhotoGallery({ photos, initialIndex, open, onClose }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | undefined>(undefined);
  const touchStartY = useRef<number | undefined>(undefined);

  // Sync with initialIndex when gallery opens
  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, prev, next, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches.item(0);
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === undefined || touchStartY.current === undefined) return;
    const touch = e.changedTouches.item(0);
    if (!touch) return;
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    touchStartX.current = undefined;
    touchStartY.current = undefined;

    // Swipe down to close
    if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
      onClose();
      return;
    }
    // Swipe left/right to navigate
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) next();
      else prev();
    }
  };

  // Always render in DOM (keep refs alive), toggle visibility via CSS
  return (
    <div
      className={`fixed inset-0 z-[70] bg-black flex items-center justify-center transition-opacity duration-200 ${
        open && photos.length > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-10 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      {photos.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/90 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Prev button */}
      {photos.length > 1 && (
        <button
          className="absolute left-3 z-10 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      {photos.length > 0 && (
        <img
          src={photos[currentIndex]?.url}
          alt=""
          className="max-w-full max-h-full object-contain select-none"
          style={{ touchAction: 'pinch-zoom' }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      )}

      {/* Next button */}
      {photos.length > 1 && (
        <button
          className="absolute right-3 z-10 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
