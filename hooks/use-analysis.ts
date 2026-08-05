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

export function useAnalysis(query: string) {
  const { analysis: cached, query: cachedQuery, hydrated, saveAnalysis } = useAnalysisContext();
  const [state, setState] = useState<AnalysisState>(() =>
    cached && cachedQuery === query
      ? { data: cached, isLoading: false, error: null }
      : { data: null, isLoading: true, error: null },
  );
  const startedRef = useRef(false);

  const load = useCallback(async () => {
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
    if (!hydrated || startedRef.current) return;
    startedRef.current = true;

    if (cached && cachedQuery === query) {
      setState({ data: cached, isLoading: false, error: null });
      return;
    }
    load();
  }, [hydrated, cached, cachedQuery, query, load]);

  return { ...state, retry: load };
}
