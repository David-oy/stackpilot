'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { StackAnalysis } from './types';
import { useWorkspaces } from '@/lib/workspaces/context';

const STORAGE_KEY = 'stack2set:analysis';
const HISTORY_KEY = 'stack2set:search-history';
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
  const { currentWorkspace } = useWorkspaces();
  const workspaceId = currentWorkspace?.id ?? null;

  // Workspace-scoped keys; fall back to the legacy global keys when there is
  // no workspace (pre-workspaces data / not yet hydrated).
  const analysisKey = workspaceId ? `${STORAGE_KEY}:${workspaceId}` : STORAGE_KEY;
  const historyKey = workspaceId ? `${HISTORY_KEY}:${workspaceId}` : HISTORY_KEY;

  const [stored, setStored] = useState<StoredAnalysis | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    setStored(null);
    setSearchHistory([]);
    setHydrated(false);
    try {
      const raw = localStorage.getItem(analysisKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAnalysis;
        if (parsed && parsed.query && parsed.data) {
          setStored(parsed);
        }
      }
      const historyRaw = localStorage.getItem(historyKey);
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
  }, [analysisKey, historyKey]);

  const saveAnalysis = useCallback(
    (query: string, data: StackAnalysis) => {
      const next: StoredAnalysis = { query, data, savedAt: Date.now() };
      setStored(next);
      try {
        localStorage.setItem(analysisKey, JSON.stringify(next));
      } catch {
        // ignore quota / privacy mode errors
      }
      setSearchHistory((prev) => {
        const updated = [query, ...prev.filter((item) => item !== query)].slice(0, MAX_HISTORY);
        try {
          localStorage.setItem(historyKey, JSON.stringify(updated));
        } catch {
          // ignore quota / privacy mode errors
        }
        return updated;
      });
    },
    [analysisKey, historyKey],
  );

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(historyKey);
    } catch {
      // ignore
    }
  }, [historyKey]);

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
