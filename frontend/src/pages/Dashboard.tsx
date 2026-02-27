import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Camera, UtensilsCrossed, ShoppingCart, ChefHat, Bell, CalendarHeart, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { momentsApi, sprintsApi, cookingSessionsApi, settingsApi, achievementsApi, datePlansApi, loveLettersApi, expensesApi } from '../lib/api';
import { useUnreadCount } from '../lib/useUnreadCount';
import type { CookingSession, DatePlan } from '../types';
import { useModuleTour } from '../lib/useModuleTour';
import FAB from '../components/FAB';
import MomentCard from '../components/MomentCard';
import LetterReadOverlay from '../components/LetterReadOverlay';
import { modules } from '../lib/modules';

// ─── Date diff helpers (inlined from RelationshipTimer, with live clock) ─────

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '1', 10);
  const d = parseInt(parts[2] ?? '1', 10);
  return new Date(y, m - 1, d);
}

function calcDiff(startDateStr: string, now: Date) {
  const start = parseLocalDate(startDateStr);
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  // h/m/s: remainder after subtracting full calendar years+months+days
  const reference = new Date(start);
  reference.setFullYear(reference.getFullYear() + years);
  reference.setMonth(reference.getMonth() + months);
  reference.setDate(reference.getDate() + days);
  const remainderMs = now.getTime() - reference.getTime();
  const hours = Math.floor(remainderMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainderMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainderMs % (1000 * 60)) / 1000);
  return { years, months, days, hours, minutes, seconds };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: moments = [] } = useQuery({ queryKey: ['moments'], queryFn: momentsApi.list });
  const { data: sprints = [] } = useQuery({ queryKey: ['sprints'], queryFn: sprintsApi.list });
  const { data: activeSession } = useQuery({
    queryKey: ['cooking-sessions', 'active'],
    queryFn: cookingSessionsApi.getActive,
    refetchInterval: 30_000,
  });
  const { data: datePlans = [] } = useQuery({
    queryKey: ['date-plans'],
    queryFn: datePlansApi.list,
    refetchInterval: 60_000,
  });
  const { data: achievements = [] } = useQuery({ queryKey: ['achievements'], queryFn: achievementsApi.list });
  const achievementsUnlocked = achievements.filter((a) => a.unlocked).length;

  const unreadCount = useUnreadCount();

  const currentMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })();
  const { data: expenseStats } = useQuery({
    queryKey: ['expenses-stats', currentMonth],
    queryFn: () => expensesApi.stats(currentMonth),
    staleTime: 60_000,
  });

  const { data: appNameSetting } = useQuery({ queryKey: ['settings', 'app_name'], queryFn: () => settingsApi.get('app_name') });
  const { data: appSloganSetting } = useQuery({ queryKey: ['settings', 'app_slogan'], queryFn: () => settingsApi.get('app_slogan') });
  const appName = appNameSetting?.value || 'Love Scrum';
  const appSlogan = appSloganSetting?.value || 'Our little world, beautifully organized';

  const { data: relDateData } = useQuery({
    queryKey: ['settings', 'relationship-start-date'],
    queryFn: () => settingsApi.get('relationship-start-date'),
  });

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const activeDatePlan = (() => {
    const today = new Date();
    return datePlans.find((p) => {
      const pd = new Date(p.date);
      const isToday = pd.getDate() === today.getDate() && pd.getMonth() === today.getMonth() && pd.getFullYear() === today.getFullYear();
      return p.status === 'active' && isToday;
    }) ?? null;
  })();

  const recentMoments = moments.slice(0, 3);
  const doneGoals = activeSprint?.goals.filter((g) => g.status === 'DONE').length || 0;
  const totalGoals = activeSprint?.goals.length || 0;
  const sprintProgress = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;
  const remainingDays = activeSprint
    ? Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // ── Love Letter popup ──────────────────────────────────────────────────────
  const { data: receivedLetters = [] } = useQuery({
    queryKey: ['love-letters', 'received'],
    queryFn: loveLettersApi.received,
    refetchOnMount: 'always',
  });
  const [dismissedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem('ll-popup-dismissed') ?? '[]') as string[]);
    } catch {
      return new Set();
    }
  });
  const [popupDismissed, setPopupDismissed] = useState(false);
  const newUnread = receivedLetters.filter((l) => l.status === 'DELIVERED' && !dismissedIds.has(l.id));
  const showLetterPopup = !popupDismissed && newUnread.length > 0;

  const handlePopupClose = () => {
    const updated = [...dismissedIds, ...newUnread.map((l) => l.id)];
    sessionStorage.setItem('ll-popup-dismissed', JSON.stringify(updated));
    setPopupDismissed(true);
    queryClient.invalidateQueries({ queryKey: ['love-letters'] });
  };
  // ── End love letter popup ──────────────────────────────────────────────────

  // Hero card: live clock — updates every second
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(t);
  }, []);

  const startDate = relDateData?.value ?? '';
  let heroDiff = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (startDate) heroDiff = calcDiff(startDate, now);
  const { years: hYears, months: hMonths, days: hDays, hours: hHours, minutes: hMinutes, seconds: hSeconds } = heroDiff;

  useModuleTour('dashboard', [
    { popover: { title: '🏠 Trang chủ', description: 'Đây là trang tổng quan — xem thời gian yêu nhau, chi tiêu, mục tiêu, và truy cập nhanh tất cả tính năng.' } },
    { element: '[data-tour="hero-card"]', popover: { title: '❤️ Hero Card', description: 'Tóm tắt hành trình: thời gian bên nhau, thành tích và kỷ niệm.', side: 'bottom' } },
    { element: '[data-tour="bento-row"]', popover: { title: '💰🎯 Chi tiêu & Sprint', description: 'Xem nhanh chi tiêu tháng này và tiến độ sprint đang chạy.', side: 'bottom' } },
    { element: '[data-tour="recent-moments"]', popover: { title: '📸 Kỷ niệm gần đây', description: 'Xem những kỷ niệm mới nhất. Vuốt sang trái/phải để xem thêm.', side: 'bottom' } },
    { element: '[data-tour="modules-grid"]', popover: { title: '✨ Tất cả tính năng', description: 'Truy cập nhanh vào tất cả 9 tính năng của ứng dụng.', side: 'top' } },
  ]);

  return (
    <div>
      {/* Love Letter Popup */}
      <AnimatePresence>
        {showLetterPopup && (
          <LetterReadOverlay letters={newUnread} onClose={handlePopupClose} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <h1 className="font-heading text-3xl font-bold">{appName}</h1>
          {/* Bell — mobile only (desktop has bell in sidebar) */}
          <button
            onClick={() => navigate('/notifications')}
            className="md:hidden relative ml-auto text-text-light hover:text-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
        <p className="text-text-light text-sm">{appSlogan}</p>
      </div>

      {/* ── ACTIVE COOKING SESSION PIN ────────────────────────────────── */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="mb-4"
          >
            <ActiveSessionPin session={activeSession} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── END ACTIVE COOKING SESSION PIN ────────────────────────────── */}

      {/* ── ACTIVE DATE PLAN PIN ─────────────────────────────────────── */}
      <AnimatePresence>
        {activeDatePlan && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="mb-4"
          >
            <ActiveDatePlanPin plan={activeDatePlan} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── END ACTIVE DATE PLAN PIN ─────────────────────────────────── */}

      {/* ── MONTHLY RECAP PIN ─────────────────────────────────────────── */}
      {new Date().getDate() <= 3 && (
        <Link
          to="/monthly-recap"
          className="block relative overflow-hidden rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #f472b6 0%, #fb7185 45%, #fb923c 100%)' }}
        >
          {/* Shimmer sweep */}
          <div className="shimmer-overlay" />

          {/* Floating hearts */}
          {([
            { e: '💕', l: '8%',  t: '18%', dur: 2.0, delay: 0.0 },
            { e: '💗', l: '28%', t: '62%', dur: 2.5, delay: 0.6 },
            { e: '💖', l: '58%', t: '12%', dur: 2.2, delay: 1.1 },
            { e: '💝', l: '78%', t: '58%', dur: 2.8, delay: 0.3 },
          ] as const).map(({ e, l, t, dur, delay }) => (
            <motion.span
              key={e}
              className="absolute text-sm select-none pointer-events-none"
              style={{ left: l, top: t }}
              animate={{ y: [0, -16, 0], opacity: [0.35, 0.75, 0.35], scale: [0.85, 1.15, 0.85] }}
              transition={{ duration: dur, repeat: Infinity, delay, ease: 'easeInOut' }}
            >
              {e}
            </motion.span>
          ))}

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3 p-4">
            <div className="text-2xl">📅</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Tổng kết tháng vừa qua ✨</p>
              <p className="text-xs text-white/75">Nhìn lại những khoảnh khắc đẹp cùng nhau</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
          </div>
        </Link>
      )}
      {/* ── END MONTHLY RECAP PIN ─────────────────────────────────────── */}

      {/* ── ROW 1: RECENT MOMENTS ────────────────────────────────────── */}
      <div className="mb-4" data-tour="recent-moments">
        {recentMoments.length === 0 ? (
          <div className="h-44 rounded-3xl bg-gray-100 flex flex-col items-center justify-center text-text-light gap-3">
            <Camera className="w-10 h-10 text-gray-300" />
            <p className="text-sm">Chưa có kỷ niệm nào.</p>
            <Link to="/moments?new=1" className="text-xs text-primary font-medium hover:underline">Tạo moment đầu tiên →</Link>
          </div>
        ) : (
          <>
            {/* Mobile: Swiper carousel */}
            <div className="-mx-4 overflow-hidden md:hidden">
              <Swiper
                slidesPerView={1.15}
                spaceBetween={12}
                slidesOffsetBefore={16}
                slidesOffsetAfter={16}
              >
                {recentMoments.map((moment) => (
                  <SwiperSlide key={moment.id}>
                    <MomentCard moment={moment} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              {recentMoments.map((moment) => (
                <MomentCard key={moment.id} moment={moment} />
              ))}
            </div>
          </>
        )}
      </div>
      {/* ── END ROW 1: RECENT MOMENTS ────────────────────────────────── */}

      {/* ── ROW 2: HERO CARD ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 px-5 py-4 mb-4"
        data-tour="hero-card"
      >
        {startDate ? (
          <>
            {/* Row 1: years / months / days */}
            <Link to="/more" className="flex items-center gap-2 mb-1.5 hover:opacity-80 transition-opacity">
              <Heart className="w-5 h-5 text-primary fill-primary flex-shrink-0" />
              <span className="text-base font-semibold text-text">
                {[
                  hYears > 0 ? `${hYears} năm` : null,
                  (hMonths > 0 || hYears > 0) ? `${hMonths} tháng` : null,
                  `${hDays} ngày`,
                ].filter(Boolean).join(' ')} bên nhau
              </span>
            </Link>
            {/* Row 2: live h:m:s */}
            <p className="text-sm tabular-nums text-text/60 font-medium mb-2">
              {String(hHours).padStart(2, '0')} giờ · {String(hMinutes).padStart(2, '0')} phút · {String(hSeconds).padStart(2, '0')} giây
            </p>
            {/* Row 3: stats */}
            <div className="flex items-center gap-2.5 text-sm text-text-light flex-wrap">
              <Link to="/achievements" className="hover:opacity-80 transition-opacity">🏆 {achievementsUnlocked}/{achievements.length}</Link>
              <span className="text-text-light/40">·</span>
              <span>📸 {moments.length} kỷ niệm</span>
              <span className="text-text-light/40">·</span>
              <span>🎯 {doneGoals} mục tiêu</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-primary/40" />
              <span className="text-base font-medium text-primary/60">Chưa cấu hình</span>
              <Link to="/more" className="text-sm text-primary underline ml-1">Cài đặt ngày yêu nhau →</Link>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-text-light flex-wrap">
              <Link to="/achievements" className="hover:opacity-80">🏆 {achievementsUnlocked}/{achievements.length}</Link>
              <span className="text-text-light/40">·</span>
              <span>📸 {moments.length} kỷ niệm</span>
              <span className="text-text-light/40">·</span>
              <span>🎯 {doneGoals} mục tiêu</span>
            </div>
          </>
        )}
      </div>
      {/* ── END ROW 2: HERO CARD ─────────────────────────────────────── */}

      {/* ── ROW 3: BENTO — Budget + Sprint ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-4" data-tour="bento-row">
        {/* Budget card */}
        <Link
          to="/expenses"
          className={`block bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 shadow-md text-white${!activeSprint ? ' col-span-2' : ''}`}
        >
          <p className="text-xs text-white/70 mb-1.5 font-medium">💰 Chi tiêu</p>
          {!expenseStats || expenseStats.count === 0 ? (
            <p className="text-sm text-white/60">Chưa có 💸</p>
          ) : (
            <>
              <p className="text-xl font-heading font-bold leading-tight">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expenseStats.total)}
              </p>
              <p className="text-xs text-white/70 mb-3">{expenseStats.count} khoản</p>
              <div className="space-y-1.5">
                {(Object.entries(expenseStats.byCategory) as [string, { total: number; count: number }][])
                  .filter(([, v]) => v.total > 0)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .slice(0, 2)
                  .map(([cat, v]) => {
                    const pct = Math.round((v.total / expenseStats.total) * 100);
                    const catEmoji: Record<string, string> = { food: '🍜', dating: '💑', shopping: '🛍️', transport: '🚗', gifts: '🎁', other: '📦' };
                    const catLabel: Record<string, string> = { food: 'Ăn uống', dating: 'Hẹn hò', shopping: 'Mua sắm', transport: 'Di chuyển', gifts: 'Quà', other: 'Khác' };
                    return (
                      <div key={cat} className="flex items-center gap-1.5 text-xs">
                        <span className="shrink-0 text-white/80 min-w-[4.5rem]">{catEmoji[cat]} {catLabel[cat]}</span>
                        <div className="flex-1 bg-white/20 rounded-full h-1.5">
                          <div className="bg-white rounded-full h-1.5" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </Link>

        {/* Sprint card — only when active */}
        {activeSprint && (
          <Link
            to={`/goals/sprint/${activeSprint.id}`}
            className="block bg-white rounded-2xl p-4 shadow-sm border border-accent/20"
          >
            <p className="text-xs text-text-light font-medium mb-1">🎯 Sprint</p>
            <p className="text-sm font-semibold text-text truncate mb-1">{activeSprint.name}</p>
            <p className="text-xs text-text-light mb-2.5">{doneGoals}/{totalGoals} · {sprintProgress}%</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                style={{ width: `${sprintProgress}%` }}
              />
            </div>
            {remainingDays > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                <Clock className="w-3 h-3" />
                {remainingDays}d left
              </span>
            )}
          </Link>
        )}
      </div>
      {/* ── END ROW 3: BENTO ─────────────────────────────────────────── */}

      {/* ── ROW 4: MODULES GRID ──────────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="font-heading text-sm font-semibold text-text-light mb-2">Tất cả tính năng</h2>
        <div className="grid grid-cols-3 gap-3" data-tour="modules-grid">
          {modules.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="block bg-white rounded-2xl shadow-sm p-3 text-center active:scale-95 transition-transform"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-text leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>
      {/* ── END ROW 4: MODULES GRID ──────────────────────────────────── */}

      <FAB />
    </div>
  );
}

// ─── Active Cooking Session Pin ───────────────────────────────────────────────

const PHASE_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  ringColor: string;
}> = {
  selecting: { icon: UtensilsCrossed, label: 'Chọn món',  color: 'text-primary',    ringColor: 'ring-primary/30'   },
  shopping:  { icon: ShoppingCart,    label: 'Đi chợ',   color: 'text-secondary',  ringColor: 'ring-secondary/30' },
  cooking:   { icon: ChefHat,         label: 'Đang nấu', color: 'text-orange-500', ringColor: 'ring-orange-300'   },
  photo:     { icon: Camera,          label: 'Chụp ảnh', color: 'text-pink-500',   ringColor: 'ring-pink-300'     },
};

function ActiveDatePlanPin({ plan }: { plan: DatePlan }) {
  const doneCount = plan.stops.filter((s) => s.done).length;
  const total = plan.stops.length;
  const progress = total > 0 ? doneCount / total : 0;

  return (
    <Link
      to={`/date-planner/plans/${plan.id}`}
      className="block rounded-2xl overflow-hidden ring-1 ring-primary/30 shadow-md active:scale-[0.98] transition-transform"
    >
      <div className="relative bg-gradient-to-r from-primary/8 to-pink-50 p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
              <CalendarHeart className="w-5 h-5 text-primary" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-primary" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs font-semibold text-text-light uppercase tracking-wide">Date Planner</p>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/60 text-primary">Đang diễn ra</span>
            </div>
            <p className="font-heading font-semibold text-sm truncate text-text">{plan.title}</p>
            <p className="text-xs text-text-light mt-0.5">{doneCount}/{total} địa điểm</p>
            {total > 0 && (
              <div className="mt-2 h-1.5 bg-black/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-secondary"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-text-light flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function ActiveSessionPin({ session }: { session: CookingSession }) {
  const cfg = PHASE_CONFIG[session.status];
  if (!cfg) return null;

  const PhaseIcon = cfg.icon;
  const dishNames = session.recipes.map((r) => r.recipe.title).join(', ') || 'Đang nấu';

  let detail = '';
  let progress: number | null = null;

  if (session.status === 'shopping') {
    const checked = session.items.filter((i) => i.checked).length;
    const total = session.items.length;
    detail = `${checked}/${total} nguyên liệu`;
    progress = total > 0 ? checked / total : 0;
  } else if (session.status === 'cooking') {
    const checked = session.steps.filter((s) => s.checked).length;
    const total = session.steps.length;
    detail = `${checked}/${total} bước`;
    progress = total > 0 ? checked / total : 0;
  } else if (session.status === 'selecting') {
    detail = `${session.recipes.length} món đã chọn`;
  } else if (session.status === 'photo') {
    detail = 'Sắp xong rồi! 📸';
  }

  return (
    <Link
      to={`/what-to-eat/${session.id}`}
      className={`block rounded-2xl overflow-hidden ring-1 ${cfg.ringColor} shadow-md active:scale-[0.98] transition-transform`}
    >
      <div className="relative bg-gradient-to-r from-primary/8 to-secondary/8 p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
              <PhaseIcon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${session.status === 'cooking' ? 'bg-orange-400' : 'bg-primary'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${session.status === 'cooking' ? 'bg-orange-400' : 'bg-primary'}`} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs font-semibold text-text-light uppercase tracking-wide">
                What to Eat Today
              </p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/60 ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className="font-heading font-semibold text-sm truncate text-text">{dishNames}</p>
            {detail && <p className="text-xs text-text-light mt-0.5">{detail}</p>}

            {progress !== null && (
              <div className="mt-2 h-1.5 bg-black/8 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    session.status === 'cooking'
                      ? 'bg-gradient-to-r from-orange-400 to-primary'
                      : 'bg-gradient-to-r from-secondary to-accent'
                  }`}
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
          </div>

          <ArrowRight className="w-4 h-4 text-text-light flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
