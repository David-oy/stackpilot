import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const env = fs.readFileSync('C:\\coding\\getstack\\get.stack\\.env.local', 'utf8');
const get = (re) => (env.match(re) || [])[1] || '';

const url = get(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/);
const key = get(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/);
const prefix = get(/SUPABASE_TABLE_PREFIX=(\S+)/);
const client = createClient(url, key, { auth: { persistSession: false } });
const t = (n) => `${prefix}${n}`;

const { data: cats } = await client.from(t('categories')).select('slug').order('slug');
console.log('total categories:', cats?.length ?? 0);
console.log(cats?.map((c) => c.slug).join('\n'));
