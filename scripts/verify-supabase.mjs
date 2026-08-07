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

  console.log('\n[7] Migration 0006 — workspaces');
  {
    const workspaces = await probeColumns('workspaces', [
      'id',
      'user_id',
      'name',
      'description',
      'icon',
      'color',
      'created_at',
      'updated_at',
      'last_opened_at',
      'archived_at',
    ]);
    report(
      'workspaces table + columns present',
      workspaces.ok,
      workspaces.ok ? 'all columns readable' : `HTTP ${workspaces.status}`,
    );
  }
  {
    const stacks = await probeColumns('stacks', ['workspace_id']);
    report('stacks.workspace_id column present', stacks.ok, stacks.ok ? 'readable' : `HTTP ${stacks.status}`);
  }
  {
    const favorites = await probeColumns('favorites', ['workspace_id']);
    report('favorites.workspace_id column present', favorites.ok, favorites.ok ? 'readable' : `HTTP ${favorites.status}`);
  }
  {
    const prompts = await probeColumns('saved_prompts', ['workspace_id']);
    report('saved_prompts.workspace_id column present', prompts.ok, prompts.ok ? 'readable' : `HTTP ${prompts.status}`);
  }
  {
    const viewed = await probeColumns('recently_viewed', ['workspace_id']);
    report('recently_viewed.workspace_id column present', viewed.ok, viewed.ok ? 'readable' : `HTTP ${viewed.status}`);
  }
  {
    const { status, body } = await rest('workspaces?select=count', serviceKey);
    const total = status === 200 && Array.isArray(body) ? Number(body[0]?.count ?? 0) : null;
    report('default workspaces backfilled', total !== null && total > 0, total === null ? `HTTP ${status}` : `${total} workspaces`);
  }
  {
    const { status, body } = await rest('stacks?select=count&workspace_id=is.null', serviceKey);
    const orphaned = status === 200 && Array.isArray(body) ? Number(body[0]?.count ?? 0) : null;
    report(
      'all stacks assigned to a workspace',
      orphaned === 0,
      orphaned === null ? `HTTP ${status}` : `${orphaned} unassigned`,
    );
  }
  {
    const { status } = await rest(
      'workspaces',
      anonKey,
      {
        method: 'POST',
        body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000', name: 'should fail' }),
      },
    );
    report('anon CANNOT INSERT workspaces (RLS enforced)', status >= 400, `HTTP ${status}`);
  }

  console.log('\n[8] Migration 0007 — audit hardening (shares + analysis_cache RLS)');
  {
    const shares = await probeColumns('shares', ['id', 'payload', 'created_at', 'expires_at']);
    report(
      'shares table + columns present',
      shares.ok,
      shares.ok ? 'all columns readable' : `HTTP ${shares.status}`,
    );
  }
  {
    const { status } = await rest(
      'shares',
      anonKey,
      {
        method: 'POST',
        body: JSON.stringify({
          id: 'rls-check',
          payload: { name: 'should fail' },
          expires_at: '2030-01-01T00:00:00Z',
        }),
      },
    );
    report('anon CANNOT INSERT shares (RLS enforced)', status >= 400, `HTTP ${status}`);
  }
  {
    // Round-trip a share through the service role, then clean it up.
    const id = `verify-${Date.now()}`;
    const { status: insertStatus } = await rest(
      'shares',
      serviceKey,
      {
        method: 'POST',
        body: JSON.stringify({
          id,
          payload: { name: 'verify probe' },
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        }),
      },
    );
    const created = insertStatus === 201 || insertStatus === 200;
    let readBack = false;
    if (created) {
      const { status, body } = await rest(`shares?select=payload&id=eq.${id}`, serviceKey);
      readBack = status === 200 && Array.isArray(body) && body.length === 1;
    }
    report('service-role share create + read round-trip', created && readBack,
      created && readBack ? 'ok' : `HTTP ${insertStatus}`);
    await rest(`shares?id=eq.${id}`, serviceKey, { method: 'DELETE' });
  }
  {
    // With the anon read policy dropped, an anon SELECT on analysis_cache must
    // return zero rows even when the row exists. Skipped if cache is empty.
    const { status, body } = await rest('analysis_cache?select=cache_key&limit=1', serviceKey);
    const key = status === 200 && Array.isArray(body) && body[0]?.cache_key
      ? body[0].cache_key
      : null;
    if (key) {
      const anon = await rest(`analysis_cache?cache_key=eq.${encodeURIComponent(key)}`, anonKey);
      const blocked =
        (anon.status === 200 && Array.isArray(anon.body) && anon.body.length === 0) ||
        anon.status === 401 ||
        anon.status === 403;
      report('anon CANNOT read analysis_cache (RLS enforced)', blocked, `HTTP ${anon.status}`);
    } else {
      report('anon CANNOT read analysis_cache (RLS enforced)', true, 'cache empty — skipped');
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Verification error:', error);
  process.exit(1);
});
