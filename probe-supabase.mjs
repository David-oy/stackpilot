import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve('C:/coding/getstack/get.stack/.env.local');
const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const key = serviceKey || anonKey;

if (!url || !key) {
  console.error('missing supabase env');
  process.exit(1);
}

function fetchWithTimeout(timeoutMs) {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const cleanup = () => clearTimeout(timer);
    const existing = init?.signal;
    const noStore = { ...init, cache: 'no-store', signal: controller.signal };
    if (existing) {
      if (existing.aborted) {
        clearTimeout(timer);
        controller.abort();
      } else {
        const onAbort = () => controller.abort();
        existing.addEventListener('abort', onAbort);
        return fetch(input, noStore).finally(() => {
          clearTimeout(timer);
          existing.removeEventListener('abort', onAbort);
        });
      }
    }
    return fetch(input, noStore).finally(cleanup);
  };
}

const client = createClient(url, key, {
  auth: { persistSession: false },
  global: { fetch: fetchWithTimeout(10_000) },
});

const step = async (label, fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(`[OK] ${label} (${Date.now() - start}ms)`);
    return result;
  } catch (e) {
    console.log(`[ERR] ${label} (${Date.now() - start}ms):`, e?.message ?? e);
    return null;
  }
};

// 1. count providers (ensureSeeded)
const countRes = await step('count providers', async () => {
  const { count, error } = await client.from('providers').select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count;
});
console.log('provider count =', countRes);

// 2. rows with source null (backfill check)
const legacy = await step('select source=null rows', async () => {
  const { data, error } = await client
    .from('providers')
    .select('slug, popularity_score, pricing_model, free_tier, open_source, github, short_description')
    .is('source', null);
  if (error) throw error;
  return data;
});
console.log('legacy (source null) count =', legacy?.length ?? 'n/a');

// 3. categories
const cats = await step('getAllCategories', async () => {
  const { data, error } = await client.from('categories').select('id, name, slug, icon, description, aliases, created_at, updated_at').order('name');
  if (error) throw error;
  return data;
});
console.log('categories count =', cats?.length ?? 'n/a');

// 4. providers by category (frontend)
if (cats?.length) {
  const slug = cats[0]?.slug ?? 'frontend';
  const catRes = await step(`providers by category slug=${slug}`, async () => {
    const { data: category } = await client.from('categories').select('id').eq('slug', slug).maybeSingle();
    if (!category) return { category: null, providers: [] };
    const { data, error } = await client
      .from('providers')
      .select('*, categories!providers_category_id_fkey(slug)')
      .eq('category_id', category.id)
      .order('popularity_score', { ascending: false });
    if (error) throw error;
    return { category, providers: data ?? [] };
  });
  console.log(`providers for ${slug} =`, JSON.stringify(catRes, null, 2)?.slice(0, 600));

  // 5. hydrate relation queries
  const ids = (catRes?.providers ?? []).map((p) => p.id);
  if (ids.length) {
    await step('hydrate relations', async () => {
      const [features, tags, alternatives] = await Promise.all([
        client.from('provider_features').select('provider_id, feature').in('provider_id', ids),
        client.from('provider_tags').select('provider_id, tag').in('provider_id', ids),
        client.from('provider_alternatives').select('provider_id, alternative_provider_id').in('provider_id', ids),
      ]);
      return { features: features?.error, tags: tags?.error, alternatives: alternatives?.error };
    });
  }
}

console.log('DONE');
process.exit(0);
