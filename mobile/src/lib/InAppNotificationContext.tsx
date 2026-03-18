import React, { createContext, useCallback, useContext, useState } from 'react';
import InAppNotificationBanner from '../components/InAppNotificationBanner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InAppNotification {
  title: string;
  body?: string;
  data?: Record<string, string>;
}

interface InAppNotificationContextType {
  showNotification: (notification: InAppNotification) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const InAppNotificationContext = createContext<InAppNotificationContextType>({
  showNotification: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function InAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<InAppNotification | null>(null);

  const showNotification = useCallback((n: InAppNotification) => {
    setNotification(n);
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <InAppNotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <InAppNotificationBanner
          notification={notification}
          onDismiss={dismissNotification}
        />
      )}
    </InAppNotificationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useInAppNotification(): InAppNotificationContextType {
  return useContext(InAppNotificationContext);
}
