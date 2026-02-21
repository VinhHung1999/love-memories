import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Camera, Utensils, Target, MapPin, ArrowRight, Calendar, Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import { momentsApi, foodSpotsApi, sprintsApi } from '../lib/api';
import RelationshipTimer from '../components/RelationshipTimer';

export default function Dashboard() {
  const { data: moments = [] } = useQuery({ queryKey: ['moments'], queryFn: momentsApi.list });
  const { data: foodSpots = [] } = useQuery({ queryKey: ['foodspots'], queryFn: foodSpotsApi.list });
  const { data: sprints = [] } = useQuery({ queryKey: ['sprints'], queryFn: sprintsApi.list });

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const recentMoments = moments.slice(0, 6);
  const doneGoals = activeSprint?.goals.filter((g) => g.status === 'DONE').length || 0;
  const totalGoals = activeSprint?.goals.length || 0;
  const sprintProgress = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;

  const stats = [
    { icon: Camera, label: 'Moments', value: moments.length, color: 'bg-primary/10 text-primary', to: '/moments' },
    { icon: Utensils, label: 'Food Spots', value: foodSpots.length, color: 'bg-secondary/10 text-secondary', to: '/foodspots' },
    { icon: MapPin, label: 'Places', value: moments.filter(m => m.latitude).length + foodSpots.filter(f => f.latitude).length, color: 'bg-accent/10 text-accent', to: '/map' },
    { icon: Target, label: 'Goals Done', value: doneGoals, color: 'bg-purple-100 text-purple-600', to: '/goals' },
  ];

  // ── Carousel scroll tracking ──────────────────────────────────────────
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || recentMoments.length === 0) return;
    const idx = Math.round(el.scrollLeft / (el.scrollWidth / recentMoments.length));
    setActiveIndex(Math.min(Math.max(0, idx), recentMoments.length - 1));
  }, [recentMoments.length]);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <h1 className="font-heading text-3xl font-bold">Love Scrum</h1>
        </div>
        <p className="text-text-light text-sm">Our little world, beautifully organized</p>
      </div>

      {/* Timer inline — compact, above hero */}
      <div className="mb-3 px-0.5">
        <RelationshipTimer />
      </div>

      {/* ── HERO CAROUSEL ─────────────────────────────────────────────── */}
      {/* -mx-4 breaks out of Layout px-4 on mobile only; desktop keeps md:mx-0 */}
      <div className="mb-6 -mx-4 md:mx-0 overflow-hidden">
        {recentMoments.length === 0 ? (
          <div className="mx-4 md:mx-0 aspect-[4/3] max-h-72 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-text-light gap-3">
            <Camera className="w-12 h-12 text-gray-300" />
            <p className="text-sm">Chưa có kỷ niệm nào.</p>
            <Link to="/moments?new=1" className="text-xs text-primary font-medium hover:underline">Tạo moment đầu tiên →</Link>
          </div>
        ) : (
          <>
            {/*
              CSS Grid with grid-auto-columns: min(85vw, 320px) — vw units are
              reliable in overflow-x scroll containers (reference viewport, not
              the indeterminate container width). min() caps at 320px on desktop.
              -mx-4 md:mx-0: mobile breakout only, desktop stays inside layout.
            */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="hero-carousel pb-2"
            >
              {recentMoments.map((moment) => (
                <Link
                  key={moment.id}
                  to={`/moments/${moment.id}`}
                  className="hero-carousel-item group"
                >
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                    {/* Image */}
                    {moment.photos[0] ? (
                      <img
                        src={moment.photos[0].url}
                        alt={moment.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-primary/30" />
                      </div>
                    )}

                    {/* Bottom gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    {/* Text overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold text-base leading-snug line-clamp-2 drop-shadow">
                        {moment.title}
                      </p>
                      <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {format(new Date(moment.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center items-center gap-1.5 mt-3">
              {recentMoments.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? 'w-5 h-1.5 bg-primary'
                      : 'w-1.5 h-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* ── END HERO ──────────────────────────────────────────────────── */}

      {/* View all moments link */}
      <div className="flex justify-end mb-6">
        <Link to="/moments" className="text-primary text-xs flex items-center gap-1 hover:underline">
          Xem tất cả <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={stat.to} className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-text-light text-sm">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex gap-3">
          <Link
            to="/moments?new=1"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-3 text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Moment
          </Link>
          <Link
            to="/foodspots?new=1"
            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white rounded-2xl py-3 text-sm font-medium hover:bg-secondary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Food Spot
          </Link>
        </div>
        <Link
          to="/photobooth"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl py-3.5 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          Photo Booth ✨ — Create beautiful memories
        </Link>
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold">Active Sprint</h2>
              <Link to={`/goals/sprint/${activeSprint.id}`} className="text-accent text-sm flex items-center gap-1 hover:underline">
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <h3 className="font-medium">{activeSprint.name}</h3>
            <p className="text-text-light text-xs mt-1">
              {format(new Date(activeSprint.startDate), 'MMM d')} — {format(new Date(activeSprint.endDate), 'MMM d')}
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-light">{doneGoals}/{totalGoals} goals</span>
                <span className="font-medium">{sprintProgress}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${sprintProgress}%` }} />
              </div>
            </div>
            {activeSprint.goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center gap-2 mt-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${goal.status === 'DONE' ? 'bg-green-400' : goal.status === 'IN_PROGRESS' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                <span className={goal.status === 'DONE' ? 'line-through text-text-light' : ''}>{goal.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
