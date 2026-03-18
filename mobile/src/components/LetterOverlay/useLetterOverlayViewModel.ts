import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { loveLettersApi } from '../../lib/api';
import type { LoveLetter } from '../../types';

const SNIPPET_MAX = 120;

function buildSnippet(content: string): string {
  if (content.length <= SNIPPET_MAX) return content;
  const cutoff = content.lastIndexOf(' ', SNIPPET_MAX);
  return content.slice(0, cutoff > 0 ? cutoff : SNIPPET_MAX) + '…';
}

export interface LetterOverlayViewModelReturn {
  visible: boolean;
  firstLetter: LoveLetter | null;
  snippet: string;
  unreadCount: number;
  extraCount: number;
  /** Dismiss overlay without navigating (Để sau) */
  dismiss: () => void;
  /** Mark first letter read and return its id (for navigation) */
  readNow: () => string | null;
}

export function useLetterOverlayViewModel(): LetterOverlayViewModelReturn {
  const { isAuthenticated } = useAuth();
  const [unreadLetters, setUnreadLetters] = useState<LoveLetter[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Fetch once per session on mount
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
        // Sort by deliveredAt descending — show most recent first
        unread.sort((a, b) =>
          new Date(b.deliveredAt ?? b.createdAt).getTime() -
          new Date(a.deliveredAt ?? a.createdAt).getTime(),
        );
        setUnreadLetters(unread);
      } catch {
        setUnreadLetters([]);
      }
    })();
  }, [isAuthenticated]);

  const dismiss = useCallback(() => setDismissed(true), []);

  const readNow = useCallback((): string | null => {
    const first = unreadLetters?.[0] ?? null;
    if (first) {
      loveLettersApi.markRead(first.id).catch(() => {});
    }
    setDismissed(true);
    return first?.id ?? null;
  }, [unreadLetters]);

  const firstLetter = unreadLetters?.[0] ?? null;
  const unreadCount = unreadLetters?.length ?? 0;

  return {
    visible: !dismissed && unreadCount > 0,
    firstLetter,
    snippet: firstLetter ? buildSnippet(firstLetter.content) : '',
    unreadCount,
    extraCount: Math.max(0, unreadCount - 1),
    dismiss,
    readNow,
  };
}
