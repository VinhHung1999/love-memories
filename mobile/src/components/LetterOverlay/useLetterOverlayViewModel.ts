import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { loveLettersApi } from '../../lib/api';
import type { LoveLetter } from '../../types';

interface UseLetterOverlayViewModelReturn {
  /** null while loading, empty array = no unread letters */
  unreadLetters: LoveLetter[] | null;
  /** IDs of letters the user has already opened/read in this session */
  readIds: Set<string>;
  /** Whether all letters have been opened (overlay can be dismissed) */
  allRead: boolean;
  /** Mark a letter as read — calls API + updates local state */
  markRead: (id: string) => Promise<void>;
  /** Dismiss the overlay (call only when allRead) */
  dismiss: () => void;
  /** Whether the overlay should be visible at all */
  visible: boolean;
}

export function useLetterOverlayViewModel(): UseLetterOverlayViewModelReturn {
  const { isAuthenticated } = useAuth();
  const [unreadLetters, setUnreadLetters] = useState<LoveLetter[] | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  // Fetch unread letters once on mount (authenticated only)
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        const { count } = await loveLettersApi.unreadCount();
        if (count === 0) {
          setUnreadLetters([]);
          return;
        }
        const letters = await loveLettersApi.received();
        const unread = letters.filter(l => l.status === 'DELIVERED' && !l.readAt);
        setUnreadLetters(unread);
      } catch {
        // On error, don't show overlay
        setUnreadLetters([]);
      }
    })();
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: string) => {
    if (readIds.has(id)) return;
    try {
      await loveLettersApi.markRead(id);
    } catch {
      // Mark locally even if API call fails — best effort
    }
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [readIds]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const allRead = unreadLetters !== null &&
    unreadLetters.length > 0 &&
    unreadLetters.every(l => readIds.has(l.id));

  const visible = !dismissed &&
    unreadLetters !== null &&
    unreadLetters.length > 0;

  return { unreadLetters, readIds, allRead, markRead, dismiss, visible };
}
