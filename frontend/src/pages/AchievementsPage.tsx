import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { achievementsApi } from '../lib/api';
import type { Achievement } from '../types';

const CATEGORY_ORDER = ['moments', 'cooking', 'recipes', 'foodspots', 'goals', 'time'] as const;

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  moments:   { label: 'Kỷ niệm',     icon: '📸' },
  cooking:   { label: 'Nấu ăn',      icon: '🍳' },
  recipes:   { label: 'Công thức',   icon: '📝' },
  foodspots: { label: 'Food Spots',  icon: '🍜' },
  goals:     { label: 'Goals',       icon: '🎯' },
  time:      { label: 'Thời gian',   icon: '⏰' },
};

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        achievement.unlocked
          ? 'bg-white border-accent/20 shadow-sm'
          : 'bg-gray-50 border-transparent'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl ${
          achievement.unlocked ? 'bg-accent/10' : 'bg-gray-100 grayscale opacity-40'
        }`}
      >
        {achievement.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${achievement.unlocked ? 'text-text' : 'text-text-light'}`}>
          {achievement.title}
        </p>
        <p className="text-xs text-text-light truncate">
          {achievement.unlocked ? achievement.description : 'Chưa mở khóa'}
        </p>
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-xs text-accent mt-0.5">
            {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Check badge */}
      {achievement.unlocked && (
        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </motion.div>
  );
}

export default function AchievementsPage() {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.list,
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;
  const progress = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  // Fire confetti for achievements not yet celebrated
  const hasTriggered = useRef(false);
  useEffect(() => {
    if (hasTriggered.current || achievements.length === 0) return;
    hasTriggered.current = true;
    try {
      const seen: string[] = JSON.parse(localStorage.getItem('achievements_seen') ?? '[]');
      const newlyUnlocked = achievements.filter((a) => a.unlocked && !seen.includes(a.key));
      if (newlyUnlocked.length > 0) {
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
        localStorage.setItem(
          'achievements_seen',
          JSON.stringify([...seen, ...newlyUnlocked.map((a) => a.key)])
        );
      }
    } catch { /* localStorage unavailable */ }
  }, [achievements]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-secondary" />
          <h1 className="font-heading text-3xl font-bold">Achievements</h1>
        </div>
        <p className="text-text-light text-sm">
          {unlockedCount}/{total} đã mở khóa
        </p>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-secondary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="text-right text-xs text-text-light mt-1">{progress}% hoàn thành</p>
      </div>

      {/* Category groups */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((cat) => {
          const group = achievements.filter((a) => a.category === cat);
          if (group.length === 0) return null;
          const meta = CATEGORY_META[cat];
          if (!meta) return null;
          const catUnlocked = group.filter((a) => a.unlocked).length;

          return (
            <div key={cat}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{meta.icon}</span>
                <h2 className="text-sm font-semibold text-text-light uppercase tracking-wide flex-1">
                  {meta.label}
                </h2>
                <span className="text-xs text-text-light">{catUnlocked}/{group.length}</span>
              </div>
              <div className="space-y-2">
                {group.map((achievement, i) => (
                  <AchievementCard key={achievement.key} achievement={achievement} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
