import { useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppName } from '../lib/useAppName';

type StepDef = {
  navIndex: number | null;
  title: string;
  description: string;
};

const STEPS: StepDef[] = [
  {
    navIndex: null,
    title: '__WELCOME__', // replaced with appName at render
    description: 'Ứng dụng dành riêng cho hai bạn',
  },
  {
    navIndex: 1,
    title: '📸 Kỷ niệm',
    description: 'Lưu lại kỷ niệm đáng nhớ — ảnh, ghi chú, voice memo, địa điểm',
  },
  {
    navIndex: 2,
    title: '🗺️ Bản đồ',
    description: 'Xem quán ăn yêu thích và nơi đã đi trên bản đồ',
  },
  {
    navIndex: 3,
    title: '🎯 Mục tiêu',
    description: 'Theo dõi mục tiêu chung với scrum board',
  },
  {
    navIndex: 4,
    title: '✨ Khám phá thêm',
    description: 'Photo Booth, Recipes, Love Letters, Date Planner, Weekly Recap...',
  },
];

export default function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const appName = useAppName();
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const isMobile = window.innerWidth < 768;
  const step = STEPS[currentStep]!;
  const isLast = currentStep === STEPS.length - 1;

  useLayoutEffect(() => {
    if (step.navIndex === null || !isMobile) {
      setSpotlightRect(null);
      return;
    }
    const frame = requestAnimationFrame(() => {
      const nav = document.querySelector('nav.md\\:hidden') as HTMLElement | null;
      if (!nav) { setSpotlightRect(null); return; }
      const links = nav.querySelectorAll('a');
      const target = links[step.navIndex!] as HTMLElement | undefined;
      if (!target) { setSpotlightRect(null); return; }
      setSpotlightRect(target.getBoundingClientRect());
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStep, isMobile, step.navIndex]);

  const advance = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const title = currentStep === 0 ? `Chào mừng đến với ${appName}! 💕` : step.title;

  // Position card above spotlight on mobile, centered otherwise.
  // Use top (not bottom) — window.innerHeight is unreliable on iOS with URL bar / safe areas.
  const cardStyle: React.CSSProperties = spotlightRect
    ? {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        top: Math.max(16, spotlightRect.top - 180),
        width: 'calc(100vw - 3rem)',
        maxWidth: '28rem',
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100vw - 3rem)',
        maxWidth: '28rem',
      };

  return (
    <div
      className="fixed inset-0 z-[80]"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dark overlay when no spotlight */}
      {!spotlightRect && <div className="absolute inset-0 bg-black/60" />}

      {/* Spotlight hole via box-shadow */}
      {spotlightRect && (
        <div
          style={{
            position: 'absolute',
            top: spotlightRect.top - 8,
            left: spotlightRect.left - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Info card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={cardStyle}
          className="bg-white rounded-2xl p-5 shadow-xl"
        >
          <p className="text-base font-heading font-bold text-gray-900 mb-1">{title}</p>
          <p className="text-sm text-text-light mb-4">{step.description}</p>

          <div className="flex items-center justify-between">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              {!isLast && (
                <button
                  onClick={onComplete}
                  className="text-xs text-text-light hover:text-gray-600 transition-colors"
                >
                  Bỏ qua
                </button>
              )}
              <button
                onClick={advance}
                className="bg-primary text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {isLast ? 'Bắt đầu thôi! 🚀' : 'Tiếp →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
