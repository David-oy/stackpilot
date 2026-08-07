'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { StackAnalysis } from './types';

const STORAGE_KEY = 'stackpilot:analysis';
const HISTORY_KEY = 'stackpilot:search-history';
const MAX_HISTORY = 8;

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
  searchHistory: string[];
  clearHistory: () => void;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredAnalysis | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAnalysis;
        if (parsed && parsed.query && parsed.data) {
          setStored(parsed);
        }
      }
      const historyRaw = localStorage.getItem(HISTORY_KEY);
      if (historyRaw) {
        const parsed = JSON.parse(historyRaw) as unknown;
        if (Array.isArray(parsed)) {
          setSearchHistory(
            parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_HISTORY),
          );
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
    setSearchHistory((prev) => {
      const updated = [query, ...prev.filter((item) => item !== query)].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // ignore quota / privacy mode errors
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysis: stored?.data ?? null,
        query: stored?.query ?? null,
        hydrated,
        saveAnalysis,
        searchHistory,
        clearHistory,
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
