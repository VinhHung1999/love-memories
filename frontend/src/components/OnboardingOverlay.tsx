import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useAppName } from '../lib/useAppName';

// ── Gradient background keyframes ─────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes ob-bg-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

// ── Slide definitions ──────────────────────────────────────────────────────────

type Slide =
  | { kind: 'welcome' }
  | { kind: 'module'; emoji: string; title: string; subtitle: string; steps: string[] }
  | { kind: 'done' };

const SLIDES: Slide[] = [
  { kind: 'welcome' },
  {
    kind: 'module',
    emoji: '📸',
    title: 'Kỷ niệm',
    subtitle: 'Lưu lại khoảnh khắc đáng nhớ',
    steps: [
      'Bấm + để tạo kỷ niệm mới',
      'Thêm ảnh, ghi chú, voice memo',
      'Gắn địa điểm và nhạc Spotify',
      'Bình luận và react với nhau',
    ],
  },
  {
    kind: 'module',
    emoji: '🗺️',
    title: 'Bản đồ',
    subtitle: 'Bản đồ quán ăn & địa điểm',
    steps: [
      'Xem tất cả quán ăn trên bản đồ',
      'Bấm pin để xem chi tiết',
      'Lọc theo tag (cafe, ăn vặt, nhà hàng...)',
    ],
  },
  {
    kind: 'module',
    emoji: '🎯',
    title: 'Mục tiêu',
    subtitle: 'Theo dõi mục tiêu chung',
    steps: [
      'Tạo sprint với các mục tiêu',
      'Kéo thả card giữa Todo → Doing → Done',
      'Theo dõi tiến độ cùng nhau',
    ],
  },
  {
    kind: 'module',
    emoji: '🍳',
    title: 'Nấu ăn',
    subtitle: 'Quyết định hôm nay ăn gì',
    steps: [
      'Chọn công thức và bắt đầu nấu',
      'Timer theo dõi thời gian nấu',
      'Quay random quán ăn gần đây',
    ],
  },
  {
    kind: 'module',
    emoji: '👨‍🍳',
    title: 'Công thức',
    subtitle: 'Tạo và lưu công thức nấu ăn',
    steps: [
      'Tự tạo hoặc dùng AI tạo từ text/YouTube/URL',
      'Xem nguyên liệu và giá ước tính',
      'Lưu tutorial YouTube kèm công thức',
    ],
  },
  {
    kind: 'module',
    emoji: '💌',
    title: 'Thư tình',
    subtitle: 'Gửi thư tình bất ngờ',
    steps: [
      'Viết thư với mood (romantic, playful...)',
      'Hẹn giờ gửi hoặc gửi ngay',
      'Đối phương nhận thông báo bất ngờ',
    ],
  },
  {
    kind: 'module',
    emoji: '📅',
    title: 'Hẹn hò',
    subtitle: 'Lên kế hoạch hẹn hò',
    steps: [
      'Thêm wish list địa điểm muốn đi',
      'Tạo plan với các điểm dừng',
      'Chụp ảnh tại mỗi điểm dừng',
    ],
  },
  { kind: 'done' },
];

// ── Card components ────────────────────────────────────────────────────────────

function WelcomeCard({ appName }: { appName: string }) {
  return (
    <div className="bg-white rounded-3xl p-8 mx-4 max-w-md shadow-xl text-center">
      <div className="text-6xl mb-4">❤️</div>
      <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">{appName}</h2>
      <p className="text-sm text-text-light mb-6">Ứng dụng dành riêng cho hai bạn 💕</p>
      <p className="text-xs text-text-light/70">Vuốt để xem hướng dẫn →</p>
    </div>
  );
}

function ModuleCard({ slide }: { slide: Extract<Slide, { kind: 'module' }> }) {
  return (
    <div className="bg-white rounded-3xl p-6 mx-4 max-w-md shadow-xl">
      <div className="text-4xl mb-3">{slide.emoji}</div>
      <h2 className="text-lg font-heading font-bold text-gray-900 mb-1">{slide.title}</h2>
      <p className="text-sm text-text-light mb-4">{slide.subtitle}</p>
      <div className="space-y-2.5">
        {slide.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-primary text-sm font-bold mt-0.5">•</span>
            <p className="text-sm text-gray-700">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoneCard({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="bg-white rounded-3xl p-8 mx-4 max-w-md shadow-xl text-center">
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">Sẵn sàng rồi!</h2>
      <p className="text-sm text-text-light mb-6">
        Khám phá thêm Photo Booth, Achievements, Weekly Recap trong tab More
      </p>
      <button
        onClick={onComplete}
        className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-lg"
      >
        Bắt đầu thôi! 🚀
      </button>
    </div>
  );
}

// ── Main overlay ───────────────────────────────────────────────────────────────

export default function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const appName = useAppName();
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #f8e4ea, #fce8d5, #e8d5f4, #d5eaf4)',
        backgroundSize: '300% 300%',
        animation: 'ob-bg-shift 8s ease infinite',
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Skip button */}
      {!isLast && (
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-700 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
          style={{ zIndex: 10 }}
        >
          Bỏ qua
        </button>
      )}

      {/* Swiper */}
      <div className="w-full max-w-lg">
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
          className="onboarding-swiper pb-10"
          style={{ paddingBottom: '2.5rem' }}
        >
          {SLIDES.map((slide, i) => (
            <SwiperSlide key={i} className="flex items-center justify-center px-2">
              {slide.kind === 'welcome' && <WelcomeCard appName={appName} />}
              {slide.kind === 'module' && <ModuleCard slide={slide} />}
              {slide.kind === 'done' && <DoneCard onComplete={onComplete} />}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
