import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { recapApi } from '../lib/api';
import type { MonthlyRecap } from '../types';

// ── Constants ──────────────────────────────────────────────────────────────

const SLIDE_DURATION = 6000;
const HOLD_THRESHOLD = 200;

// ── Month helpers ──────────────────────────────────────────────────────────

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthDisplay(s: string): string {
  const [y, m] = s.split('-');
  return `Tháng ${m}/${y}`;
}

function formatTime(ms: number): string {
  if (!ms) return '0m';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ── AnimatedNumber ─────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    setDisplay(0);
    if (!value) return;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(value * step / 30));
      if (step >= 30) { clearInterval(timer); setDisplay(value); }
    }, 50);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

// ── PhotoStrip ─────────────────────────────────────────────────────────────
// Two rows of photos auto-scrolling in opposite directions (infinite loop)

function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;

  // Triple-duplicate for seamless infinite loop
  const strip = [...photos, ...photos, ...photos];
  const loopWidth = photos.length * 140; // 128px img + 8px gap ≈ 140px per cell

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Row 1 — scrolls left */}
      <motion.div
        className="flex gap-2 absolute"
        style={{ top: '15%', width: 'max-content' }}
        animate={{ x: [0, -loopWidth] }}
        transition={{ duration: photos.length * 4, repeat: Infinity, ease: 'linear' }}
      >
        {strip.map((url, i) => (
          <img key={i} src={url} alt="" className="w-32 h-32 object-cover rounded-xl opacity-45 flex-shrink-0" />
        ))}
      </motion.div>

      {/* Row 2 — scrolls right */}
      <motion.div
        className="flex gap-2 absolute"
        style={{ top: '55%', width: 'max-content' }}
        animate={{ x: [-loopWidth, 0] }}
        transition={{ duration: photos.length * 5, repeat: Infinity, ease: 'linear' }}
      >
        {strip.map((url, i) => (
          <img key={i} src={url} alt="" className="w-28 h-28 object-cover rounded-xl opacity-35 flex-shrink-0" />
        ))}
      </motion.div>
    </div>
  );
}

// ── Slide builder ──────────────────────────────────────────────────────────

type Slide = { id: string; bg: string; node: React.ReactNode };

function buildSlides(recap: MonthlyRecap, month: string, caption?: string | null): Slide[] {
  const slides: Slide[] = [];
  const totalLetters = recap.loveLetters.sent + recap.loveLetters.received;

  // ── Intro ──
  slides.push({
    id: 'intro',
    bg: 'linear-gradient(160deg, #f9a8d4 0%, #fb7185 50%, #f97316 100%)',
    node: (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-8xl mb-6"
        >💕</motion.div>
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-3xl font-heading font-bold text-white mb-2"
        >{formatMonthDisplay(month)}</motion.h1>
        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 text-lg"
        >{caption || 'Hành trình của chúng mình 💕'}</motion.p>
      </div>
    ),
  });

  // ── Moments ──
  if (recap.moments.count > 0) {
    const momentPhotos = recap.moments.highlights.flatMap((h) => h.photos);
    slides.push({
      id: 'moments',
      bg: 'linear-gradient(160deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)',
      node: (
        <div className="relative flex-1 min-h-0">
          <PhotoStrip photos={momentPhotos} />
          {momentPhotos.length > 0 && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
          )}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
            <div className="text-6xl mb-4">📸</div>
            <div className="text-8xl font-heading font-bold text-white">
              <AnimatedNumber value={recap.moments.count} />
            </div>
            <p className="text-2xl font-heading text-white mt-1 mb-2">kỷ niệm</p>
            {recap.moments.photoCount > 0 && (
              <p className="text-white/70 text-base">{recap.moments.photoCount} bức ảnh đã chụp</p>
            )}
            {recap.moments.highlights[0] && (
              <p className="text-white/50 text-sm mt-4 italic">"{recap.moments.highlights[0].title}"</p>
            )}
          </div>
        </div>
      ),
    });
  }

  // ── Cooking ──
  if (recap.cooking.count > 0) slides.push({
    id: 'cooking',
    bg: 'linear-gradient(160deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
    node: (
      <div className="relative flex-1 min-h-0">
        <PhotoStrip photos={recap.cooking.photos} />
        {recap.cooking.photos.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
          <div className="text-6xl mb-4">🍳</div>
          <div className="text-8xl font-heading font-bold text-white">
            <AnimatedNumber value={recap.cooking.count} />
          </div>
          <p className="text-2xl font-heading text-white mt-1 mb-2">lần nấu ăn cùng nhau</p>
          {recap.cooking.totalTimeMs > 0 && (
            <p className="text-white/70 text-base">Tổng {formatTime(recap.cooking.totalTimeMs)} trong bếp</p>
          )}
          {recap.cooking.recipes.length > 0 && (
            <p className="text-white/55 text-sm mt-2">{recap.cooking.recipes.join(', ')}</p>
          )}
        </div>
      </div>
    ),
  });

  // ── Food spots ──
  if (recap.foodSpots.count > 0) slides.push({
    id: 'foodspots',
    bg: 'linear-gradient(160deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
    node: (
      <div className="relative flex-1 min-h-0">
        <PhotoStrip photos={recap.foodSpots.photos} />
        {recap.foodSpots.photos.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
          <div className="text-6xl mb-4">🍜</div>
          <div className="text-8xl font-heading font-bold text-white">
            <AnimatedNumber value={recap.foodSpots.count} />
          </div>
          <p className="text-2xl font-heading text-white mt-1 mb-2">quán mới khám phá</p>
          {recap.foodSpots.names.length > 0 && (
            <p className="text-white/55 text-sm mt-2">{recap.foodSpots.names.join(', ')}</p>
          )}
        </div>
      </div>
    ),
  });

  // ── Love letters ──
  if (totalLetters > 0) slides.push({
    id: 'letters',
    bg: 'linear-gradient(160deg, #f9a8d4 0%, #ec4899 50%, #be185d 100%)',
    node: (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="text-6xl mb-4">💌</div>
        <div className="text-8xl font-heading font-bold text-white">
          <AnimatedNumber value={totalLetters} />
        </div>
        <p className="text-2xl font-heading text-white mt-1 mb-2">thư tình</p>
        <p className="text-white/70 text-base">{recap.loveLetters.sent} gửi · {recap.loveLetters.received} nhận</p>
      </div>
    ),
  });

  // ── Date plans ──
  if (recap.datePlans.count > 0) slides.push({
    id: 'dates',
    bg: 'linear-gradient(160deg, #67e8f9 0%, #06b6d4 50%, #0284c7 100%)',
    node: (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="text-6xl mb-4">🌹</div>
        <div className="text-8xl font-heading font-bold text-white">
          <AnimatedNumber value={recap.datePlans.count} />
        </div>
        <p className="text-2xl font-heading text-white mt-1 mb-2">buổi hẹn hò</p>
      </div>
    ),
  });

  // ── Goals ──
  if (recap.goalsCompleted > 0) slides.push({
    id: 'goals',
    bg: 'linear-gradient(160deg, #fde68a 0%, #fbbf24 50%, #d97706 100%)',
    node: (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="text-6xl mb-4">🎯</div>
        <div className="text-8xl font-heading font-bold text-white">
          <AnimatedNumber value={recap.goalsCompleted} />
        </div>
        <p className="text-2xl font-heading text-white mt-1 mb-2">mục tiêu hoàn thành</p>
      </div>
    ),
  });

  // ── Outro ──
  slides.push({
    id: 'outro',
    bg: 'linear-gradient(160deg, #f9a8d4 0%, #fb7185 50%, #f97316 100%)',
    node: (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-8xl mb-6"
        >🎉</motion.div>
        <motion.h2
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-3xl font-heading font-bold text-white mb-3"
        >Tháng này thật tuyệt!</motion.h2>
        <motion.p
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 text-base"
        >Cảm ơn vì đã cùng nhau trải qua những khoảnh khắc đẹp 💕</motion.p>
      </div>
    ),
  });

  return slides;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MonthlyRecapPage() {
  const navigate = useNavigate();
  const month = currentMonthStr();

  const { data: recap, isLoading } = useQuery({
    queryKey: ['recap', 'monthly', month],
    queryFn: () => recapApi.monthly(month),
  });

  const { data: captionData } = useQuery({
    queryKey: ['recap', 'monthly-caption', month],
    queryFn: () => recapApi.monthlyCaption(month),
    staleTime: 5 * 60 * 1000,
    enabled: !!recap && !!(
      recap.moments.count + recap.cooking.count + recap.foodSpots.count +
      recap.datePlans.count + recap.loveLetters.sent + recap.loveLetters.received +
      recap.goalsCompleted
    ),
  });

  const slides = useMemo(
    () => (recap ? buildSlides(recap, month, captionData?.caption) : []),
    [recap, month, captionData],
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnimKey = useRef(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldRef = useRef(false);

  const advance = useCallback(() => {
    setCurrentIdx((i) => {
      if (i >= slides.length - 1) { navigate(-1); return i; }
      progressAnimKey.current++;
      return i + 1;
    });
  }, [slides.length, navigate]);

  const retreat = useCallback(() => {
    setCurrentIdx((i) => {
      if (i <= 0) return 0;
      progressAnimKey.current++;
      return i - 1;
    });
  }, []);

  // Auto-advance
  useEffect(() => {
    if (isPaused || slides.length === 0 || currentIdx >= slides.length - 1) return;
    autoAdvanceRef.current = setTimeout(advance, SLIDE_DURATION);
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current); };
  }, [currentIdx, isPaused, slides.length, advance]);

  const onPointerDown = () => {
    isHoldRef.current = false;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    holdTimerRef.current = setTimeout(() => {
      isHoldRef.current = true;
      setIsPaused(true);
    }, HOLD_THRESHOLD);
  };

  const onPointerUp = (action: 'prev' | 'next') => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setIsPaused(false);
    if (!isHoldRef.current) {
      if (action === 'prev') retreat();
      else advance();
    }
  };

  const onPointerLeave = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setIsPaused(false);
    isHoldRef.current = false;
  };

  const isEmpty = recap &&
    recap.moments.count === 0 &&
    recap.cooking.count === 0 &&
    recap.foodSpots.count === 0 &&
    recap.datePlans.count === 0 &&
    recap.loveLetters.sent + recap.loveLetters.received === 0 &&
    recap.goalsCompleted === 0;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden" style={{ background: '#000' }}>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #f9a8d4, #fb7185, #f97316)' }}
        >
          <div className="w-10 h-10 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!isLoading && isEmpty && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ background: 'linear-gradient(160deg, #9ca3af, #6b7280)' }}
        >
          <button onClick={() => navigate(-1)} className="absolute top-4 right-4 p-2 text-white/70">
            <X className="w-6 h-6" />
          </button>
          <div className="text-7xl mb-4">💤</div>
          <p className="text-2xl font-heading font-bold text-white mb-2">Tháng này chưa có gì cả</p>
          <p className="text-white/70 text-sm">Hãy tạo kỷ niệm mới nhé!</p>
        </div>
      )}

      {/* ── Stories viewer ───────────────────────────────────────────────── */}
      {!isLoading && !isEmpty && slides.length > 0 && (
        <>
          {/* Gradient background (animated between slides) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[currentIdx]?.id + '-bg'}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ background: slides[currentIdx]?.bg }}
            />
          </AnimatePresence>

          {/* Progress bars */}
          <div
            className="absolute left-0 right-0 z-[73] flex gap-1 px-4"
            style={{ top: 'max(12px, env(safe-area-inset-top))' }}
          >
            {slides.map((s, i) => (
              <div key={s.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                {i < currentIdx ? (
                  <div className="h-full w-full bg-white" />
                ) : i === currentIdx ? (
                  <div
                    key={`prog-${progressAnimKey.current}`}
                    className="h-full bg-white"
                    style={!isPaused ? {
                      animation: `progressFill ${SLIDE_DURATION}ms linear forwards`,
                    } : { width: '0%' }}
                  />
                ) : (
                  <div className="h-full w-0 bg-white" />
                )}
              </div>
            ))}
          </div>

          {/* Top bar: month label + close */}
          <div
            className="absolute left-0 right-0 z-[73] flex items-center justify-between px-4"
            style={{ top: 'max(28px, calc(env(safe-area-inset-top) + 16px))' }}
          >
            <p className="text-sm font-semibold text-white drop-shadow-sm">{formatMonthDisplay(month)}</p>
            <button onClick={() => navigate(-1)} className="p-1">
              <X className="w-5 h-5 text-white drop-shadow-sm" />
            </button>
          </div>

          {/* Slide content */}
          <div className="absolute inset-0 z-[71]" style={{ paddingTop: '5rem' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slides[currentIdx]?.id}
                className="h-full flex flex-col"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.2 }}
              >
                {slides[currentIdx]?.node}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tap zones */}
          <div
            className="absolute left-0 right-0 z-[72] flex"
            style={{ top: '5rem', bottom: 0 }}
          >
            <button
              className="w-[35%] h-full"
              onPointerDown={onPointerDown}
              onPointerUp={() => onPointerUp('prev')}
              onPointerLeave={onPointerLeave}
            />
            <button
              className="w-[65%] h-full"
              onPointerDown={onPointerDown}
              onPointerUp={() => onPointerUp('next')}
              onPointerLeave={onPointerLeave}
            />
          </div>
        </>
      )}
    </div>
  );
}
