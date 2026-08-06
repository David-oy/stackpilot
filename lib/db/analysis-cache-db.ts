import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { analysisCache } from './cache';
import { fetchWithTimeout } from './supabase-fetch';

let dbClient: SupabaseClient | null | undefined;

function getDbClient(): SupabaseClient | null {
  if (dbClient !== undefined) return dbClient;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const timeoutMs = Number(process.env.SUPABASE_TIMEOUT_MS ?? 10_000);
  dbClient = url && key
    ? createClient(url, key, {
        auth: { persistSession: false },
        global: { fetch: fetchWithTimeout(timeoutMs) },
      })
    : null;
  return dbClient;
}

export async function getPersistedAnalysis(cacheKey: string): Promise<unknown | null> {
  const client = getDbClient();
  if (client) {
    const started = Date.now();
    try {
      const { data, error } = await client
        .from('analysis_cache')
        .select('analysis')
        .eq('cache_key', cacheKey)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (error) {
        console.warn(`[analysis-cache] read failed (${Date.now() - started}ms):`, error.message);
      } else if (data) {
        console.log(`[analysis-cache] hit (${Date.now() - started}ms)`);
        return (data as { analysis: unknown }).analysis;
      }
    } catch (error) {
      console.warn(
        `[analysis-cache] read error (${Date.now() - started}ms), falling back to in-memory:`,
        error,
      );
    }
  }
  return analysisCache.get(cacheKey);
}

export async function setPersistedAnalysis(
  cacheKey: string,
  description: string,
  analysis: unknown,
): Promise<void> {
  analysisCache.set(cacheKey, analysis);
  const client = getDbClient();
  if (!client) return;
  const started = Date.now();
  try {
    await client
      .from('analysis_cache')
      .upsert({ cache_key: cacheKey, description, analysis }, { onConflict: 'cache_key' });
    console.log(`[analysis-cache] write ok (${Date.now() - started}ms)`);
  } catch (error) {
    console.warn(
      `[analysis-cache] write error (${Date.now() - started}ms), in-memory only:`,
      error,
    );
  }
}
