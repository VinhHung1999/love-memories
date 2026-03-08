import { useQuery } from '@tanstack/react-query';
import { settingsApi } from './api';

/**
 * Shared hook — returns the custom app name from settings.
 * React Query deduplicates: only one fetch per staleTime window regardless of
 * how many components call this hook simultaneously.
 * Falls back to 'Love Memories' when not set or when unauthenticated.
 */
export function useAppName(): string {
  const { data } = useQuery({
    queryKey: ['settings', 'app_name'],
    queryFn: () => settingsApi.get('app_name'),
    staleTime: 30_000,
    retry: false,
  });
  return data?.value || 'Love Memories';
}
