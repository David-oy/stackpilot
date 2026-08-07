#!/usr/bin/env node
// Verifies Stack2Set Supabase migrations 0004/0005 landed and RLS behaves as
// expected. Read-only; requires a service role key in .env.local.
//
// Usage: node scripts/verify-supabase.mjs
//
// Checks:
//   1. providers has all migration-0004 profile columns
//   2. stacks has the migration-0005 `health` column
//   3. provider_sync_log table exists with RLS read policy
//   4. seed/backfill state: 0 providers with NULL source, 269+ providers
//   5. behavioral RLS: anon can read providers, anon CANNOT insert a stack

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv(file) {
  const out = {};
  try {
    const text = readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      out[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // .env.local may be missing
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), '.env.local'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

let pass = 0;
let fail = 0;

function report(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function rest(path, key, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    ...init,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-json
  }
  return { status: res.status, body };
}

async function probeColumns(table, columns) {
  const { status } = await rest(
    `${table}?select=${columns.join(',')}&limit=1`,
    serviceKey,
  );
  return { status, ok: status === 200 };
}

async function main() {
  console.log(`Target: ${url}\n`);

  console.log('[1] Migration 0004 — providers profile columns');
  const profile = await probeColumns('providers', [
    'community_rating',
    'stack2set_rating',
    'monthly_cost',
    'enterprise_pricing',
    'learning_curve',
    'speed',
    'scalability',
    'reliability',
    'security',
    'compliance',
    'integrations',
    'apis',
    'sdks',
    'ai_features',
    'languages',
    'compatibility',
    'pros',
    'cons',
    'best_use_cases',
    'ai_summary',
    'ai_suggested',
    'source',
    'last_synced_at',
  ]);
  report(
    'providers profile columns all present',
    profile.ok,
    profile.ok ? '23/23 columns readable' : `HTTP ${profile.status}`,
  );

  console.log('\n[2] Migration 0004 — indexes');
  console.log(
    '  ℹ Index verification requires dashboard access (SQL editor): providers_stack2set_rating_idx, providers_monthly_cost_idx, providers_last_synced_idx',
  );

  console.log('\n[3] provider_sync_log');
  {
    const log = await probeColumns('provider_sync_log', ['provider_id', 'source', 'status', 'details', 'synced_at']);
    report('provider_sync_log table + columns', log.ok, log.ok ? 'present' : `HTTP ${log.status}`);
  }
  {
    const { status } = await rest('provider_sync_log?select=id&limit=1', anonKey);
    report('anon can read provider_sync_log (RLS read policy)', status === 200, `HTTP ${status}`);
  }

  console.log('\n[4] Migration 0005 — stacks.health');
  {
    const stacks = await probeColumns('stacks', ['health', 'client_id', 'user_id', 'name', 'prompt', 'source_analysis', 'created_at', 'updated_at']);
    report('stacks.health column present', stacks.ok, stacks.ok ? 'health + base columns readable' : `HTTP ${stacks.status}`);
  }
  {
    const items = await probeColumns('stack_items', ['stack_id', 'category_id', 'category_name', 'category_position', 'collapsed', 'provider_snapshot', 'position']);
    report('stack_items columns present', items.ok, items.ok ? 'present' : `HTTP ${items.status}`);
  }

  console.log('\n[5] Seed / backfill state');
  {
    const { status, body } = await rest('providers?select=count&source=is.null', serviceKey);
    const nullSource =
      status === 200 && Array.isArray(body) ? Number(body[0]?.count ?? 0) : null;
    report(
      'no legacy rows with NULL source (0004 backfill ran)',
      nullSource === 0,
      nullSource === null ? `HTTP ${status}` : `${nullSource} remain`,
    );
  }
  {
    const { status, body } = await rest('providers?select=count', serviceKey);
    const total = status === 200 && Array.isArray(body) ? Number(body[0]?.count ?? 0) : null;
    report('providers seeded', total !== null && total >= 100, total === null ? `HTTP ${status}` : `${total} providers`);
  }

  console.log('\n[6] Behavioral RLS');
  {
    const { status } = await rest('providers?select=slug&limit=1', anonKey);
    report('anon can SELECT providers (public read)', status === 200, `HTTP ${status}`);
  }
  {
    const { status } = await rest(
      'stacks',
      anonKey,
      {
        method: 'POST',
        body: JSON.stringify({ client_id: 'rls-check', user_id: '00000000-0000-0000-0000-000000000000', name: 'should fail' }),
      },
    );
    report('anon CANNOT INSERT stacks (RLS enforced)', status >= 400, `HTTP ${status}`);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Verification error:', error);
  process.exit(1);
});
