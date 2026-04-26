import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getUnreadNotificationCount } from '@/api/notifications';
import { useNotificationsStore } from '@/stores/notificationsStore';

// T425 (Sprint 65) — Dashboard bell badge hook. Polls the unread count
// once on mount + every time the screen regains focus (user returns from
// Notifications screen, app foreground, etc). Refetches when the global
// notificationsStore.version bumps so a mark-read action elsewhere
// reflects immediately.
//
// No background polling — the BE doesn't push to the client (push
// notifications are deferred to Sprint 66+ per Lu's T425 inbox-only
// scope), and an idle timer would waste batteries. Focus-based refresh
// is the right granularity for an inbox bell.

export function useUnreadNotifications(): {
  count: number;
  reload: () => void;
} {
  const [count, setCount] = useState(0);
  const version = useNotificationsStore((s) => s.version);

  const reload = useCallback(() => {
    void getUnreadNotificationCount()
      .then((res) => setCount(res.count))
      .catch(() => {
        /* swallow — bell falls back to 0 on transient failures */
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Re-fetch on global version bumps even while the screen stays focused.
  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version]),
  );

  return { count, reload };
}
