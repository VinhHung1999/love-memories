import React, { createContext, useContext, useState, useCallback } from 'react';

export interface UploadProgressState {
  done: number;
  total: number;
  label: string;
}

interface UploadProgressContextType {
  upload: UploadProgressState | null;
  startUpload: (total: number, label?: string) => void;
  incrementUpload: () => void;
  clearUpload: () => void;
}

const UploadProgressContext = createContext<UploadProgressContextType>({
  upload: null,
  startUpload: () => {},
  incrementUpload: () => {},
  clearUpload: () => {},
});

export function UploadProgressProvider({ children }: { children: React.ReactNode }) {
  const [upload, setUpload] = useState<UploadProgressState | null>(null);

  const startUpload = useCallback((total: number, label = 'photo') => {
    setUpload({ done: 0, total, label });
  }, []);

  const incrementUpload = useCallback(() => {
    setUpload(prev => (prev ? { ...prev, done: prev.done + 1 } : null));
  }, []);

  const clearUpload = useCallback(() => {
    setUpload(null);
  }, []);

  return (
    <UploadProgressContext.Provider value={{ upload, startUpload, incrementUpload, clearUpload }}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  return useContext(UploadProgressContext);
}
