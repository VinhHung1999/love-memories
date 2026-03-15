import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { achievementsApi } from '../../lib/api';
import type { Achievement } from '../../types';
import { useTranslation } from 'react-i18next';
export type AchievementGroup = {
  category: string;
  label: string;
  unlocked: number;
  total: number;
  items: Achievement[];
};

export function useAchievementsViewModel() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.list,
    staleTime: 60_000,
  });

  const { groups, unlockedCount, totalCount } = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    achievements.forEach(a => {
      const arr = map.get(a.category) ?? [];
      arr.push(a);
      map.set(a.category, arr);
    });
    const groups: AchievementGroup[] = Array.from(map.entries()).map(([cat, items]) => ({
      category: cat,
      label: t(`achievements.categories.${cat}`) || cat,
      unlocked: items.filter(i => i.unlocked).length,
      total: items.length,
      items: [...items].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0)),
    }));
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    return { groups, unlockedCount, totalCount: achievements.length };
  }, [achievements]);

  return {
    isLoading,
    groups,
    unlockedCount,
    totalCount,
    progress: totalCount > 0 ? unlockedCount / totalCount : 0,
    handleBack: () => navigation.goBack(),
  };
}
