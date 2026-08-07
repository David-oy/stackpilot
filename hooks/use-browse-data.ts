'use client';

import { useEffect, useState } from 'react';
import type { CategoryRecord, ProviderWithRelations } from '@/lib/db/schema';

type BrowseState = {
  categories: CategoryRecord[];
  providers: ProviderWithRelations[];
  loading: boolean;
  error: string | null;
};

export function useBrowseData(): BrowseState {
  const [state, setState] = useState<BrowseState>({
    categories: [],
    providers: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [categoriesRes, providersRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/providers'),
        ]);
        if (!categoriesRes.ok || !providersRes.ok) {
          throw new Error('Failed to load data.');
        }
        const categoriesData = (await categoriesRes.json()) as { categories: CategoryRecord[] };
        const providersData = (await providersRes.json()) as { providers: ProviderWithRelations[] };
        if (!cancelled) {
          setState({
            categories: categoriesData.categories ?? [],
            providers: providersData.providers ?? [],
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            categories: [],
            providers: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load data.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
