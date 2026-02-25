import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'swiper/css';
import 'swiper/css/pagination';
import { loveLettersApi } from '../lib/api';
import type { LoveLetter } from '../types';

// ── Shared constants ──────────────────────────────────────────────────────────

export const MOOD_EMOJI: Record<string, string> = {
  romantic: '🌹', grateful: '🙏', playful: '😄',
  encouragement: '💪', apology: '🥺', missing: '💭',
};

const LL_PARTICLES = [
  { content: '💕', left: '7%',  delay: '0s',    dur: '7s'   },
  { content: '✨', left: '17%', delay: '1.3s',  dur: '8.5s' },
  { content: '💗', left: '29%', delay: '0.6s',  dur: '9s'   },
  { content: '⭐', left: '41%', delay: '2.1s',  dur: '7.5s' },
  { content: '💖', left: '53%', delay: '0.9s',  dur: '8s'   },
  { content: '✨', left: '63%', delay: '0.2s',  dur: '10s'  },
  { content: '💝', left: '75%', delay: '1.7s',  dur: '7s'   },
  { content: '🌸', left: '85%', delay: '0.4s',  dur: '8.5s' },
  { content: '💕', left: '22%', delay: '3.2s',  dur: '9s'   },
  { content: '✨', left: '68%', delay: '2.6s',  dur: '7.5s' },
  { content: '💗', left: '48%', delay: '4s',    dur: '8s'   },
  { content: '⭐', left: '91%', delay: '1.1s',  dur: '9.5s' },
];

const KEYFRAMES = `
  @keyframes ll-float {
    0%   { transform: translateY(100vh) translateX(0px) rotate(0deg); opacity: 0; }
    8%   { opacity: 0.85; }
    30%  { transform: translateY(65vh) translateX(8px) rotate(8deg); }
    55%  { transform: translateY(35vh) translateX(-5px) rotate(14deg); }
    80%  { transform: translateY(12vh) translateX(6px) rotate(18deg); opacity: 0.5; }
    100% { transform: translateY(-8vh) translateX(0px) rotate(22deg); opacity: 0; }
  }
  @keyframes ll-bg-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes ll-bounce-emoji {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-7px) scale(1.08); }
  }
`;

// ── Envelope view (sealed → tap → flap opens) ─────────────────────────────────

function EnvelopeView({ letter, onOpen }: { letter: LoveLetter; onOpen: () => void }) {
  const [flapOpen, setFlapOpen] = useState(false);

  const handleTap = () => {
    if (flapOpen) return;
    setFlapOpen(true);
    setTimeout(onOpen, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.55, y: -50 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="flex flex-col items-center gap-5 cursor-pointer select-none"
      onClick={handleTap}
    >
      {/* 3D envelope */}
      <div style={{ perspective: '700px' }}>
        <div
          className="relative"
          style={{ width: 280, height: 176, transformStyle: 'preserve-3d' }}
        >
          {/* Body */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: '#fef3e2',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            }}
          />

          {/* Left fold */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ clipPath: 'polygon(0 0, 50% 55%, 0 100%)', background: '#fde4c0' }}
          />
          {/* Right fold */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ clipPath: 'polygon(100% 0, 50% 55%, 100% 100%)', background: '#fde4c0' }}
          />
          {/* Bottom fold */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ clipPath: 'polygon(0 100%, 50% 50%, 100% 100%)', background: '#fde8ca' }}
          />

          {/* Wax seal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 40% 35%, #f0a0b0, #e8788a)',
                boxShadow: '0 3px 12px rgba(232,120,138,0.55)',
              }}
            >
              <span className="text-2xl">{MOOD_EMOJI[letter.mood ?? ''] ?? '❤️'}</span>
            </div>
          </div>

          {/* Top flap — wrapper rotates in 3D; child holds clip-path in local space */}
          <motion.div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: '52%',
              transformOrigin: 'top center',
              backfaceVisibility: 'hidden',
            }}
            animate={flapOpen ? { rotateX: -175 } : { rotateX: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            <div
              className="w-full h-full rounded-t-xl"
              style={{
                clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                background: 'linear-gradient(180deg, #fbeacb 0%, #fad9b0 100%)',
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Info below envelope */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          Thư từ{' '}
          <span className="font-bold text-primary">{letter.sender?.name ?? '—'}</span>
        </p>
        <motion.p
          className="text-xs text-text-light/60 mt-1"
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {flapOpen ? 'Đang mở... ✨' : 'Nhấn để mở thư 💌'}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

interface Props {
  letters: LoveLetter[];
  onClose: () => void;
  /** Mark letters READ via API as they're viewed (true for inbox popup, false if already marked) */
  autoMarkRead?: boolean;
}

export default function LetterReadOverlay({ letters, onClose, autoMarkRead = true }: Props) {
  const markedRef = useRef<Set<string>>(new Set());
  const [phase, setPhase] = useState<'envelope' | 'letter'>('envelope');
  const [activeIndex, setActiveIndex] = useState(0);

  const markRead = (letter: LoveLetter) => {
    if (!autoMarkRead) return;
    if (!markedRef.current.has(letter.id)) {
      markedRef.current.add(letter.id);
      loveLettersApi.get(letter.id).catch(() => {});
    }
  };

  // Mark first letter read when user opens the envelope and letter is revealed
  useEffect(() => {
    if (phase === 'letter' && letters[0]) {
      markRead(letters[0]);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (letters.length === 0) return null;

  const isLastSlide = activeIndex === letters.length - 1;
  const btnLabel = letters.length > 1 && !isLastSlide ? 'Vuốt để xem thêm →' : 'Đã đọc ❤️';

  return (
    <>
      <style>{KEYFRAMES}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f8e4ea, #fce8d5, #e8d5f4, #d5eaf4)',
          backgroundSize: '300% 300%',
          animation: 'll-bg-shift 10s ease infinite',
        }}
      >
        {/* Floating hearts / sparkles */}
        {LL_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute text-xl pointer-events-none select-none"
            style={{ left: p.left, bottom: '-40px', animation: `ll-float ${p.dur} ${p.delay} infinite linear` }}
          >
            {p.content}
          </span>
        ))}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>

        {/* Phase 1: Sealed envelope — user taps to open */}
        <AnimatePresence>
          {phase === 'envelope' && (
            <motion.div
              key="envelope-phase"
              className="absolute inset-0 flex items-center justify-center px-6"
            >
              <EnvelopeView letter={letters[0]!} onOpen={() => setPhase('letter')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Letter card(s) */}
        {phase === 'letter' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="text-center pt-12 pb-2 px-4 flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
                Thư tình mới 💌
              </p>
              {letters.length > 1 && (
                <p className="text-xs text-text-light mt-0.5">
                  Vuốt để xem {letters.length} thư
                </p>
              )}
            </div>

            {/* Swiper */}
            <div className="flex-1 min-h-0 px-4 pb-10">
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                spaceBetween={16}
                className="w-full h-full"
                onSlideChange={(swiper) => {
                  setActiveIndex(swiper.activeIndex);
                  const letter = letters[swiper.activeIndex];
                  if (letter) markRead(letter);
                }}
              >
                {letters.map((letter, i) => (
                  <SwiperSlide key={letter.id}>
                    {/* Inner wrapper: fixes SwiperSlide flex override */}
                    <div className="flex items-center justify-center h-full py-3">
                      <motion.div
                        initial={{ opacity: 0, y: i === 0 ? 60 : 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i === 0 ? 0.05 : 0.1 }}
                        className="w-full max-w-md mx-auto rounded-3xl p-6 max-h-[68vh] overflow-y-auto"
                        style={{
                          background: 'linear-gradient(160deg, #fff9f9 0%, #fffdf8 100%)',
                          boxShadow: '0 8px 40px rgba(232,120,138,0.28), 0 2px 12px rgba(0,0,0,0.07)',
                        }}
                      >
                        {/* Ornament */}
                        <div className="text-center text-primary/25 text-lg leading-none mb-1 select-none tracking-widest">
                          ✦ ✦ ✦
                        </div>

                        {/* Mood + header */}
                        <div className="text-center mb-6">
                          <div
                            className="text-5xl mb-3 inline-block"
                            style={{ animation: 'll-bounce-emoji 2.2s ease-in-out infinite' }}
                          >
                            {MOOD_EMOJI[letter.mood ?? ''] ?? '💌'}
                          </div>
                          <h2 className="text-xl font-heading font-bold text-gray-900 leading-snug px-2">
                            {letter.title}
                          </h2>
                          <p className="text-xs text-text-light mt-1.5">
                            {letter.sender?.name ?? '—'} → {letter.recipient?.name ?? '—'}
                          </p>
                          {letter.deliveredAt && (
                            <p className="text-xs text-text-light/60 mt-0.5">
                              {format(new Date(letter.deliveredAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                            </p>
                          )}
                        </div>

                        <div className="border-t border-dashed border-primary/20 mb-5" />

                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-body">
                          {letter.content}
                        </div>

                        <div className="mt-6 pt-4 border-t border-dashed border-primary/20 flex justify-center">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-7 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/30"
                          >
                            {btnLabel}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
