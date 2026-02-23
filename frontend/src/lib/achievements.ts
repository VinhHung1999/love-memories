import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { achievementsApi } from './api';
import type { Achievement } from '../types';

/**
 * Returns an async function that diffs achievements before/after an action
 * and fires toast + confetti for any newly unlocked achievements.
 * If achievements have never been fetched (no cache), skips silently to avoid
 * false notifications.
 */
export function useCheckAchievements() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      const prev = queryClient.getQueryData<Achievement[]>(['achievements']);
      // No prior cache — skip to avoid false positives on first visit
      if (!prev) return;

      const prevUnlocked = new Set(prev.filter((a) => a.unlocked).map((a) => a.key));

      const next = await queryClient.fetchQuery({
        queryKey: ['achievements'],
        queryFn: achievementsApi.list,
        staleTime: 0,
      });

      const newlyUnlocked = next.filter((a) => a.unlocked && !prevUnlocked.has(a.key));
      if (newlyUnlocked.length === 0) return;

      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });

      for (const ach of newlyUnlocked) {
        toast(`${ach.icon} Achievement unlocked: ${ach.title}!`, {
          duration: 4000,
          style: { fontWeight: 600 },
        });
      }

      // Mark as seen so AchievementsPage won't re-fire confetti
      try {
        const seen: string[] = JSON.parse(localStorage.getItem('achievements_seen') ?? '[]');
        localStorage.setItem(
          'achievements_seen',
          JSON.stringify([...seen, ...newlyUnlocked.map((a) => a.key)])
        );
      } catch { /* localStorage unavailable */ }
    } catch { /* achievement check is non-critical */ }
  };
}
