'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { CategoryRecord, ProviderWithRelations } from '@/lib/db/schema';
import {
  CATALOG_CACHE_VERSION,
  loadCachedCatalog,
  persistCatalog,
  type CatalogSnapshot,
} from '@/lib/client/catalog-cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

export type BrowseState = {
  categories: CategoryRecord[];
  providers: ProviderWithRelations[];
  loading: boolean;
  error: string | null;
  source: 'cache' | 'server';
  refreshing: boolean;
  lastUpdated: number | null;
};

const INITIAL: BrowseState = {
  categories: [],
  providers: [],
  loading: true,
  error: null,
  source: 'cache',
  refreshing: false,
  lastUpdated: null,
};

const SYNC_DEBOUNCE_MS = 1200;

// Cache-first catalog loader.
//
// Flow: IndexedDB snapshot -> instant paint -> background revalidation against
// /api/catalog (hosted Supabase via the server store) -> persist newest revision
// to IndexedDB -> update UI. Supabase Realtime (when enabled) triggers the same
// background revalidation so live catalog edits appear without a refresh.
export function useBrowseData(): BrowseState {
  const [state, setState] = useState<BrowseState>(INITIAL);
  const revisionRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setState((prev) => ({ ...prev, refreshing: true }));
    try {
      const headers: HeadersInit = { 'Cache-Control': 'no-cache' };
      if (revisionRef.current) {
        headers['If-None-Match'] = `"${revisionRef.current}"`;
      }
      const res = await fetch('/api/catalog', { cache: 'no-store', headers });
      if (res.status === 304) {
        // Cached revision is still current — nothing to re-download.
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, loading: false, refreshing: false }));
        }
        return;
      }
      if (!res.ok) throw new Error('Failed to refresh catalog.');
      const data = (await res.json()) as {
        revision: string;
        categories: CategoryRecord[];
        providers: ProviderWithRelations[];
      };
      revisionRef.current = data.revision;
      await persistCatalog({
        revision: data.revision,
        version: CATALOG_CACHE_VERSION,
        categories: data.categories,
        providers: data.providers,
      });
      if (mountedRef.current) {
        setState({
          categories: data.categories,
          providers: data.providers,
          loading: false,
          error: null,
          source: 'server',
          refreshing: false,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState((prev) => {
          const hasData = prev.categories.length > 0 || prev.providers.length > 0;
          // Never hide already-visible cached data because a revalidation failed;
          // only surface an error when there is nothing to show at all.
          return {
            ...prev,
            loading: hasData ? prev.loading : false,
            error: hasData
              ? prev.error
              : error instanceof Error
                ? error.message
                : 'Failed to load data.',
            refreshing: false,
          };
        });
      }
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => void sync(), SYNC_DEBOUNCE_MS);
  }, [sync]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    void (async () => {
      let cached: CatalogSnapshot | null = null;
      try {
        cached = await loadCachedCatalog();
      } catch {
        cached = null;
      }
      if (cancelled) return;

      revisionRef.current = cached?.revision ?? null;

      if (cached) {
        if (mountedRef.current) {
          setState({
            categories: cached.categories,
            providers: cached.providers,
            loading: false,
            error: null,
            source: 'cache',
            refreshing: false,
            lastUpdated: cached.savedAt,
          });
        }
      }

      // First render from cache (if any), then always revalidate against
      // hosted Supabase so a refresh never permanently trusts old device data.
      void sync();
    })();

    let supabase: ReturnType<typeof createSupabaseClient> | null = null;
    let channel: RealtimeChannel | null = null;
    try {
      supabase = createSupabaseClient();
      channel = supabase
        .channel('catalog-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'providers' },
          () => scheduleSync(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          () => scheduleSync(),
        )
        .subscribe();
    } catch {
      // Realtime unavailable (e.g. Supabase not configured) — background
      // revalidation on mount/refresh still keeps the cache fresh.
      channel = null;
    }

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      try {
        if (channel && supabase) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [sync, scheduleSync]);

  return state;
}
