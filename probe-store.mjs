import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(url, key, { auth: { persistSession: false } });

const { data: cats } = await client.from('categories').select('id, slug, name').order('name');
console.log('API getCategories:', cats?.length);
const { data: provs } = await client.from('providers').select('id, slug, category_id').order('popularity_score', { ascending: false });
console.log('API getProviders:', provs?.length);

const catIds = new Set(cats?.map((c) => c.id));
const unlinked = (provs ?? []).filter((p) => !catIds.has(p.category_id));
console.log('providers whose category_id missing from categories table:', unlinked.length);
const byCat = new Map();
for (const p of provs ?? []) byCat.set(p.category_id, (byCat.get(p.category_id) ?? 0) + 1);
const catsWithProvs = [...byCat.entries()].filter(([, n]) => n > 0).length;
console.log('distinct category_ids referenced by providers:', catsWithProvs);
console.log('categories with zero providers:', cats?.filter((c) => !byCat.has(c.id)).length);
