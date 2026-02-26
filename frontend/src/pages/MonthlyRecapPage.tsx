import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Camera, UtensilsCrossed, Utensils, Mail, CalendarHeart, Target, Trophy } from 'lucide-react';
import { recapApi } from '../lib/api';
import { useModuleTour } from '../lib/useModuleTour';

// ── Month helpers ──────────────────────────────────────────────────────────────

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function previousMonthStr(): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed → this gives previous month number (1-indexed)
  if (month === 0) { year -= 1; month = 12; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function offsetMonth(monthStr: string, delta: number): string {
  const [yearStr, monthStr2] = monthStr.split('-');
  let year = parseInt(yearStr!);
  let month = parseInt(monthStr2!) + delta; // 1-indexed after adding delta
  if (month > 12) { year += Math.floor((month - 1) / 12); month = ((month - 1) % 12) + 1; }
  if (month < 1)  { year += Math.ceil((month - 12) / 12) - 1; month = ((month - 1 + 12 * 100) % 12) + 1; }
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatMonthDisplay(monthStr: string): string {
  const [yearStr, monthStr2] = monthStr.split('-');
  return `Tháng ${monthStr2}/${yearStr}`;
}

function formatTime(ms: number): string {
  if (ms === 0) return '0m';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3 } }),
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="bg-white rounded-2xl p-4 shadow-sm"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
        value > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={`text-2xl font-bold font-heading ${value > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
        {value}
      </p>
      <p className="text-xs text-text-light mt-0.5">{label}</p>
      {sub && <p className="text-xs text-text-light/70 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MonthlyRecapPage() {
  const [currentMonth, setCurrentMonth] = useState(previousMonthStr);
  const isCurrentMonth = currentMonth >= currentMonthStr();

  useModuleTour('monthly-recap', [
    { element: '[data-tour="month-nav"]', popover: { title: '📅 Tháng của chúng mình', description: 'Xem tổng kết hoạt động theo từng tháng — dùng mũi tên để chuyển tháng.', side: 'bottom' } },
  ]);

  const { data: recap, isLoading } = useQuery({
    queryKey: ['recap', 'monthly', currentMonth],
    queryFn: () => recapApi.monthly(currentMonth),
  });

  const isEmpty =
    recap &&
    recap.moments.count === 0 &&
    recap.cooking.count === 0 &&
    recap.foodSpots.count === 0 &&
    recap.datePlans.count === 0 &&
    recap.loveLetters.sent + recap.loveLetters.received === 0 &&
    recap.goalsCompleted === 0;

  const totalLetters = recap ? recap.loveLetters.sent + recap.loveLetters.received : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-heading font-bold text-gray-900 mb-3">Tháng của chúng mình 📅</h1>
        <div data-tour="month-nav" className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => offsetMonth(m, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-gray-800">{formatMonthDisplay(currentMonth)}</p>
            <p className="text-xs text-text-light">{currentMonth}</p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => offsetMonth(m, 1))}
            disabled={isCurrentMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="text-6xl mb-4">💤</div>
          <p className="font-semibold text-gray-700">Tháng này chưa có hoạt động nào</p>
          <p className="text-sm text-text-light mt-1">Hãy tạo kỷ niệm mới nhé! 💕</p>
        </motion.div>
      )}

      {/* Stats grid */}
      {!isLoading && recap && !isEmpty && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard icon={Camera}        label="Kỷ niệm"  value={recap.moments.count}    sub={recap.moments.photoCount > 0 ? `${recap.moments.photoCount} ảnh` : undefined}                                         index={0} />
            <StatCard icon={UtensilsCrossed} label="Nấu ăn" value={recap.cooking.count}   sub={recap.cooking.totalTimeMs > 0 ? formatTime(recap.cooking.totalTimeMs) : undefined}                                     index={1} />
            <StatCard icon={Utensils}      label="Quán mới" value={recap.foodSpots.count}                                                                                                                               index={2} />
            <StatCard icon={Mail}          label="Thư tình" value={totalLetters}           sub={totalLetters > 0 ? `${recap.loveLetters.sent} gửi · ${recap.loveLetters.received} nhận` : undefined}                 index={3} />
            <StatCard icon={CalendarHeart} label="Hẹn hò"   value={recap.datePlans.count}                                                                                                                              index={4} />
            <StatCard icon={Target}        label="Mục tiêu" value={recap.goalsCompleted}                                                                                                                               index={5} />
          </div>

          {/* Moment highlights */}
          {recap.moments.highlights.length > 0 && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }} className="mb-6">
              <h2 className="font-heading text-base font-semibold text-gray-900 mb-3">Khoảnh khắc nổi bật</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {recap.moments.highlights.map((h) => (
                  <Link
                    key={h.id}
                    to={`/moments/${h.id}`}
                    className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm overflow-hidden active:scale-95 transition-transform"
                  >
                    <img src={h.photoUrl} alt={h.title} className="w-full h-24 object-cover" />
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-800 truncate">{h.title}</p>
                      <p className="text-xs text-text-light">
                        {new Date(h.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* Achievements */}
          {recap.achievementsUnlocked.length > 0 && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.5 } }} className="mb-6">
              <h2 className="font-heading text-base font-semibold text-gray-900 mb-3">Thành tích mới 🏆</h2>
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-border">
                {recap.achievementsUnlocked.map((name, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800">{name}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Cooking detail */}
          {recap.cooking.count > 0 && (recap.cooking.recipes.length > 0 || recap.cooking.totalTimeMs > 0) && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.55 } }} className="mb-6">
              <h2 className="font-heading text-base font-semibold text-gray-900 mb-3">Chi tiết nấu ăn 🍳</h2>
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                {recap.cooking.recipes.length > 0 && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-text-light">Đã nấu:</span>{' '}
                    {recap.cooking.recipes.join(', ')}
                  </p>
                )}
                {recap.cooking.totalTimeMs > 0 && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-text-light">Tổng thời gian:</span>{' '}
                    {formatTime(recap.cooking.totalTimeMs)}
                  </p>
                )}
              </div>
            </motion.section>
          )}
        </>
      )}
    </div>
  );
}
