import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const env = fs.readFileSync('C:\\coding\\getstack\\get.stack\\.env.local', 'utf8');
const get = (re) => (env.match(re) || [])[1] || '';

const url = get(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/);
const key = get(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/);
const prefix = get(/SUPABASE_TABLE_PREFIX=(\S+)/);
const client = createClient(url, key, { auth: { persistSession: false } });
const t = (n) => `${prefix}${n}`;

const { data: pCount, error: pe } = await client
  .from(t('providers'))
  .select('slug', { count: 'exact', head: true });
console.log('providers count:', pCount?.length ?? 'err', pe?.message ?? '');

const { count } = await client
  .from(t('providers'))
  .select('slug', { count: 'exact', head: true });
console.log('exact providers:', count, pe?.message ?? '');

const { data: cats, error: ce } = await client.from(t('categories')).select('slug, id');
console.log('categories count:', cats?.length ?? 'err', ce?.message ?? '');

const { data: byCat } = await client
  .from(t('providers'))
  .select('categories!providers_category_id_fkey(slug)');
const grouped = {};
for (const row of byCat ?? []) {
  const s = row.categories?.[0]?.slug ?? '(none)';
  grouped[s] = (grouped[s] ?? 0) + 1;
}
console.log('providers per category:', JSON.stringify(grouped, null, 2));

const { data: rels } = await client.from(t('provider_relations')).select('provider_id');
console.log('provider_relations count:', rels?.length ?? 'err');
