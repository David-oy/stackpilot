'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StackAnalysis } from '@/lib/types';
import { analyzeProject } from '@/lib/api';
import { useAnalysisContext } from '@/lib/analysis-context';

type AnalysisState = {
  data: StackAnalysis | null;
  isLoading: boolean;
  error: string | null;
  errorCode?: 'NOT_A_PROJECT';
};

export function useAnalysis(query: string, enabled = true) {
  const { analysis: cached, query: cachedQuery, hydrated, saveAnalysis } = useAnalysisContext();
  const [state, setState] = useState<AnalysisState>(() =>
    cached && cachedQuery === query
      ? { data: cached, isLoading: false, error: null }
      : { data: null, isLoading: query.trim().length > 0 && enabled, error: null },
  );
  const startedForRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (q = query) => {
      if (!q.trim()) {
        setState({ data: null, isLoading: false, error: null });
        return;
      }
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ data: null, isLoading: true, error: null });
      try {
        const data = await analyzeProject(q, controller.signal);
        if (controllerRef.current !== controller) return;
        saveAnalysis(q, data);
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        if (controllerRef.current !== controller || controller.signal.aborted) return;
        const code =
          error && typeof error === 'object' && 'code' in error
            ? (error as { code?: 'NOT_A_PROJECT' }).code
            : undefined;
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          errorCode: code,
        });
      }
    },
    [query, saveAnalysis],
  );

  useEffect(() => {
    if (!hydrated || !enabled) return;
    if (startedForRef.current === query) return;
    startedForRef.current = query;

    if (!query.trim()) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    if (cached && cachedQuery === query) {
      setState({ data: cached, isLoading: false, error: null });
      return;
    }
    load(query);
  }, [hydrated, cached, cachedQuery, query, load, enabled]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  return { ...state, retry: load };
}
