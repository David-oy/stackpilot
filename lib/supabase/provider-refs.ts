import type { SupabaseClient } from '@supabase/supabase-js';

export async function getProviderIdBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data } = await supabase.from('providers').select('id').eq('slug', slug).maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

export async function getProviderSlugsByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  // Chunk to avoid oversized `in` filters (long URLs return HTTP 400).
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = ids.slice(i, i + CHUNK);
    const { data } = await supabase.from('providers').select('id, slug').in('id', batch);
    for (const row of (data ?? []) as Array<{ id: string; slug: string }>) {
      map.set(row.id, row.slug);
    }
  }
  return map;
}
