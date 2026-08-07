'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StackAnalysis } from '@/lib/types';
import { analyzeProject } from '@/lib/api';
import { useAnalysisContext } from '@/lib/analysis-context';

type AnalysisState = {
  data: StackAnalysis | null;
  isLoading: boolean;
  error: string | null;
};

export function useAnalysis(query: string, enabled = true) {
  const { analysis: cached, query: cachedQuery, hydrated, saveAnalysis } = useAnalysisContext();
  const [state, setState] = useState<AnalysisState>(() =>
    cached && cachedQuery === query
      ? { data: cached, isLoading: false, error: null }
      : { data: null, isLoading: query.trim().length > 0 && enabled, error: null },
  );
  const startedForRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!query.trim()) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    setState({ data: null, isLoading: true, error: null });
    try {
      const data = await analyzeProject(query);
      saveAnalysis(query, data);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }, [query, saveAnalysis]);

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
    load();
  }, [hydrated, cached, cachedQuery, query, load, enabled]);

  return { ...state, retry: load };
}
