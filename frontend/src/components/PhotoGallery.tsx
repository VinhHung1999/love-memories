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

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
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

    if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
      onClose();
      return;
    }
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) next();
      else prev();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center transition-opacity duration-300 ${
        open && photos.length > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding image strip */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full items-center"
          style={{
            transform: `translateX(calc(-${currentIndex} * 100vw))`,
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex-shrink-0 w-screen h-full flex items-center justify-center px-14 py-12"
            >
              <img
                src={photo.url}
                alt=""
                className="max-w-full max-h-full object-contain select-none rounded-lg"
                style={{
                  touchAction: 'pinch-zoom',
                  filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.6))',
                }}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Close button */}
      <button
        className="absolute top-5 right-5 z-10 p-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      {photos.length > 0 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/90 text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 rounded-full">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Prev button */}
      {photos.length > 1 && (
        <button
          className="absolute left-4 z-10 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Next button */}
      {photos.length > 1 && (
        <button
          className="absolute right-4 z-10 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              style={i === currentIndex ? {
                boxShadow: '0 0 10px 2px rgba(255,255,255,0.7)',
              } : {}}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-5 h-2 bg-white scale-110'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
