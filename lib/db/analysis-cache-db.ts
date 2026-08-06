import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { analysisCache } from './cache';

let dbClient: SupabaseClient | null | undefined;

function getDbClient(): SupabaseClient | null {
  if (dbClient !== undefined) return dbClient;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  dbClient = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return dbClient;
}

export async function getPersistedAnalysis(cacheKey: string): Promise<unknown | null> {
  const client = getDbClient();
  if (client) {
    try {
      const { data } = await client
        .from('analysis_cache')
        .select('analysis')
        .eq('cache_key', cacheKey)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();
      if (data) return (data as { analysis: unknown }).analysis;
    } catch {
      // Supabase unavailable — fall back to in-memory cache.
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
  try {
    await client
      .from('analysis_cache')
      .upsert({ cache_key: cacheKey, description, analysis }, { onConflict: 'cache_key' });
  } catch {
    // Supabase unavailable — keep the in-memory copy only.
  }
}
