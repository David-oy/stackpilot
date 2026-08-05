'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { StackAnalysis } from './types';

const STORAGE_KEY = 'stackpilot:analysis';

type StoredAnalysis = {
  query: string;
  data: StackAnalysis;
  savedAt: number;
};

type AnalysisContextValue = {
  analysis: StackAnalysis | null;
  query: string | null;
  hydrated: boolean;
  saveAnalysis: (query: string, data: StackAnalysis) => void;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredAnalysis | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAnalysis;
        if (parsed && parsed.query && parsed.data) {
          setStored(parsed);
        }
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  const saveAnalysis = useCallback((query: string, data: StackAnalysis) => {
    const next: StoredAnalysis = { query, data, savedAt: Date.now() };
    setStored(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / privacy mode errors
    }
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysis: stored?.data ?? null,
        query: stored?.query ?? null,
        hydrated,
        saveAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysisContext must be used within AnalysisProvider');
  return ctx;
}
