import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Camera, Utensils, Target, MapPin, ArrowRight, Calendar, Clock, CheckCircle2, Circle, UtensilsCrossed, ShoppingCart, ChefHat, Bell, CalendarHeart } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { momentsApi, foodSpotsApi, sprintsApi, cookingSessionsApi, settingsApi, achievementsApi, datePlansApi } from '../lib/api';
import { useUnreadCount } from '../lib/useUnreadCount';
import type { CookingSession, DatePlan } from '../types';
import RelationshipTimer from '../components/RelationshipTimer';
import FAB from '../components/FAB';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: moments = [] } = useQuery({ queryKey: ['moments'], queryFn: momentsApi.list });
  const { data: foodSpots = [] } = useQuery({ queryKey: ['foodspots'], queryFn: foodSpotsApi.list });
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
  const activeDatePlan = (() => {
    const today = new Date();
    return datePlans.find((p) => {
      const pd = new Date(p.date);
      const isToday = pd.getDate() === today.getDate() && pd.getMonth() === today.getMonth() && pd.getFullYear() === today.getFullYear();
      return p.status === 'active' && isToday;
    }) ?? null;
  })();

  const { data: achievements = [] } = useQuery({ queryKey: ['achievements'], queryFn: achievementsApi.list });
  const achievementsUnlocked = achievements.filter((a) => a.unlocked).length;

  const unreadCount = useUnreadCount();

  const { data: appNameSetting } = useQuery({ queryKey: ['settings', 'app_name'], queryFn: () => settingsApi.get('app_name') });
  const { data: appSloganSetting } = useQuery({ queryKey: ['settings', 'app_slogan'], queryFn: () => settingsApi.get('app_slogan') });
  const appName = appNameSetting?.value || 'Love Scrum';
  const appSlogan = appSloganSetting?.value || 'Our little world, beautifully organized';

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const recentMoments = moments.slice(0, 3);
  const doneGoals = activeSprint?.goals.filter((g) => g.status === 'DONE').length || 0;
  const totalGoals = activeSprint?.goals.length || 0;
  const sprintProgress = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;
  const remainingDays = activeSprint
    ? Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const [statsExpanded, setStatsExpanded] = useState(false);

  const primaryStats = [
    { icon: Camera, label: 'kỷ niệm', value: moments.length, to: '/moments' },
    { icon: Target, label: 'goals xong', value: doneGoals, to: '/goals' },
  ];
  const extraStats = [
    { icon: Utensils, label: 'quán ăn', value: foodSpots.length, to: '/foodspots' },
  ];
  const visibleStats = statsExpanded ? [...primaryStats, ...extraStats] : primaryStats;

  // Stats row — rendered inside the hero card as its footer
  const statsFooter = (
    <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-2">
      {visibleStats.map((stat, i) => (
        <Fragment key={stat.label}>
          {i > 0 && <span className="text-text-light/40 text-[10px] select-none">·</span>}
          <Link
            to={stat.to}
            className="flex items-center gap-1 hover:opacity-70 active:opacity-50 transition-opacity"
          >
            <stat.icon className="w-3 h-3 text-text-light flex-shrink-0" />
            <span className="text-sm font-bold text-text">{stat.value}</span>
            <span className="text-xs text-text-light">{stat.label}</span>
          </Link>
        </Fragment>
      ))}
      <span className="text-text-light/40 text-[10px] select-none">·</span>
      <button
        onClick={() => setStatsExpanded((v) => !v)}
        className="text-xs text-text-light/60 hover:text-text-light transition-colors"
      >
        {statsExpanded ? 'ẩn bớt' : 'xem thêm'}
      </button>
    </div>
  );

  return (
    <div>
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

      {/* ── RECENT MOMENTS ────────────────────────────────────────────── */}
      <div className="mb-4">
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

            {/* Desktop: 2-row grid (3 cols × 2 rows = 6 items) */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              {recentMoments.map((moment) => (
                <MomentCard key={moment.id} moment={moment} />
              ))}
            </div>
          </>
        )}
      </div>
      {/* ── END RECENT MOMENTS ────────────────────────────────────────── */}

      {/* ── UNIFIED HERO: Timer + Stats ───────────────────────────────── */}
      <div className="mb-4">
        <RelationshipTimer footer={statsFooter} />
      </div>

      {/* ── ACHIEVEMENT SUMMARY ────────────────────────────────────────── */}
      <div className="mb-6">
        <AchievementSummary achievements={achievements} />
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Section header — outside the card, matching "Kỷ niệm gần đây" pattern */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold text-text">Active Sprint</h2>
            <Link to={`/goals/sprint/${activeSprint.id}`} className="text-accent text-xs flex items-center gap-1 hover:underline">
              Xem chi tiết <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="relative bg-gradient-to-br from-white to-accent/5 rounded-2xl p-6 shadow-sm border border-accent/20 overflow-hidden">
            {/* Decorative circle */}
            <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-accent/5 pointer-events-none" />

            {/* Sprint name + dates + remaining days */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-medium text-sm">{activeSprint.name}</h3>
                <p className="text-text-light text-xs mt-0.5">
                  {format(new Date(activeSprint.startDate), 'MMM d')} — {format(new Date(activeSprint.endDate), 'MMM d')}
                </p>
              </div>
              {remainingDays > 0 && (
                <span className="flex items-center gap-1 text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
                  <Clock className="w-3 h-3" />
                  {remainingDays}d left
                </span>
              )}
            </div>

            {/* Gradient progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-light">{doneGoals}/{totalGoals} goals</span>
                <span className="font-semibold text-accent">{sprintProgress}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-accent to-primary"
                  style={{ width: `${sprintProgress}%` }}
                />
              </div>
            </div>

            {/* Goals with status icons */}
            <div className="space-y-1.5">
              {activeSprint.goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-center gap-2 text-sm">
                  {goal.status === 'DONE' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : goal.status === 'IN_PROGRESS' ? (
                    <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 animate-pulse" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`${goal.status === 'DONE' ? 'line-through text-text-light' : ''} min-w-0 truncate`}>{goal.title}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <FAB />
    </div>
  );
}

// ─── Achievement Summary ──────────────────────────────────────────────────────

import type { Achievement } from '../types';

function AchievementSummary({ achievements }: { achievements: Achievement[] }) {
  const total = achievements.length;
  const unlocked = achievements.filter((a) => a.unlocked);
  const progress = total > 0 ? Math.round((unlocked.length / total) * 100) : 0;

  // Most recently unlocked, up to 4
  const recent = [...unlocked]
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))
    .slice(0, 4);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-secondary/5 to-accent/5 border border-secondary/10 px-4 py-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">🏆</span>
        <h2 className="font-heading text-sm font-semibold text-text flex-1">Achievements</h2>
        <span className="text-xs text-text-light mr-2">{unlocked.length}/{total} đã mở khóa</span>
        <Link to="/achievements" className="text-xs text-secondary font-medium hover:opacity-80 transition-opacity whitespace-nowrap">
          Xem tất cả →
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-black/8 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-secondary to-accent rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Recent unlocks */}
      {recent.length === 0 ? (
        <p className="text-xs text-text-light text-center py-1">Hãy bắt đầu khám phá! ✨</p>
      ) : (
        <div className="flex items-start gap-3 flex-wrap">
          {recent.map((a) => (
            <div key={a.key} className="flex flex-col items-center gap-1 w-12">
              <div className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center text-lg shadow-sm border border-secondary/10">
                {a.icon}
              </div>
              <p className="text-[10px] text-text-light text-center leading-tight line-clamp-2">{a.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Moment Card (shared between Swiper + Grid) ───────────────────────────────

function MomentCard({ moment }: { moment: { id: string; title: string; date: string; location?: string | null; tags: string[]; photos: { url: string }[] } }) {
  return (
    <Link to={`/moments/${moment.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/5 group-hover:shadow-xl transition-shadow duration-300">
        {moment.photos[0] ? (
          <img
            src={moment.photos[0].url}
            alt={moment.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
            <Camera className="w-10 h-10 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        {(moment.location || moment.tags[0]) && (
          <div className="absolute top-2.5 right-2.5">
            <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full leading-4">
              {moment.location ? (
                <><MapPin className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate max-w-[80px]">{moment.location.split(',')[0]}</span></>
              ) : (
                <span># {moment.tags[0]}</span>
              )}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <p className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-sm">{moment.title}</p>
          <p className="text-white/65 text-xs mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {format(new Date(moment.date), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </Link>
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

  // Phase-specific progress
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
        {/* Subtle animated gradient shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />

        <div className="flex items-center gap-3">
          {/* Phase icon with pulse ring */}
          <div className="relative flex-shrink-0">
            <div className={`w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm`}>
              <PhaseIcon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            {/* Pulse dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${session.status === 'cooking' ? 'bg-orange-400' : 'bg-primary'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${session.status === 'cooking' ? 'bg-orange-400' : 'bg-primary'}`} />
            </span>
          </div>

          {/* Info */}
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

            {/* Progress bar — only for shopping and cooking */}
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

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-text-light flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}
