import { useEffect, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import { useAuth } from './auth';
import { settingsApi } from './api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useModuleTour(moduleKey: string, steps: DriveStep[], delay = 600) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const settingKey = `tour_done__${moduleKey}__${user?.id}`;

  const { data: setting } = useQuery({
    queryKey: ['settings', settingKey],
    queryFn: async () => {
      try { return await settingsApi.get(settingKey); }
      catch { return { key: settingKey, value: null }; }
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!setting || setting.value) return; // already completed

    const timer = setTimeout(() => {
      // Verify first step element exists before starting
      const firstStep = steps[0];
      if (firstStep?.element && !document.querySelector(firstStep.element as string)) return;

      driverRef.current = driver({
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        animate: true,
        allowClose: true,
        nextBtnText: 'Tiếp →',
        prevBtnText: '← Trước',
        doneBtnText: 'Xong ✓',
        steps,
        onDestroyed: () => {
          settingsApi.set(settingKey, 'true');
          queryClient.invalidateQueries({ queryKey: ['settings', settingKey] });
        },
      });
      driverRef.current.drive();
    }, delay);

    return () => {
      clearTimeout(timer);
      driverRef.current?.destroy();
    };
  }, [setting]); // eslint-disable-line react-hooks/exhaustive-deps

  const replay = () => {
    driverRef.current = driver({
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      animate: true,
      allowClose: true,
      nextBtnText: 'Tiếp →',
      prevBtnText: '← Trước',
      doneBtnText: 'Xong ✓',
      steps,
    });
    driverRef.current.drive();
  };

  return { replay };
}
