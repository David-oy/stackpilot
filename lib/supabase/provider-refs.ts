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
  const { data } = await supabase.from('providers').select('id, slug').in('id', ids);
  for (const row of (data ?? []) as Array<{ id: string; slug: string }>) {
    map.set(row.id, row.slug);
  }
  return map;
}
