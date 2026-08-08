// db-audit.mjs — read-only audit of a Supabase (PostgREST) database.
//
// Usage:
//   node scripts/db-audit.mjs
//
// It audits a SOURCE database (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from
// the environment or .env.local). To audit a second database side-by-side,
// also set SUPABASE_TARGET_URL and SUPABASE_TARGET_SERVICE_ROLE_KEY.
//
// The tool only issues read requests (GET/HEAD). It never writes data.
// It never prints secrets.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function loadEnv(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      else if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

function apiHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

function stripUrl(u) {
  return String(u).replace(/\/+$/, '');
}

async function listTables(url, key) {
  const res = await fetch(`${stripUrl(url)}/rest/v1/`, {
    headers: apiHeaders(key),
  });
  if (!res.ok) throw new Error(`OpenAPI listing failed (${res.status} ${res.statusText})`);
  const spec = await res.json();
  const tables = Object.keys(spec.paths ?? {})
    .map((p) => p.replace(/^\//, ''))
    .filter((p) => p && !p.includes('{') && !p.includes('/'));
  return [...new Set(tables)].sort();
}

async function exactCount(url, key, table) {
  const res = await fetch(`${stripUrl(url)}/rest/v1/${table}?select=*`, {
    headers: { ...apiHeaders(key), Range: '0-0', Prefer: 'count=exact' },
  });
  if (!res.ok) {
    return { error: `${res.status} ${res.statusText}` };
  }
  const cr = res.headers.get('content-range') ?? '';
  const m = cr.match(/\/(\d+)$/);
  return { count: m ? Number(m[1]) : null, contentRange: cr };
}

async function fetchAll(url, key, table, select) {
  const out = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const res = await fetch(
      `${stripUrl(url)}/rest/v1/${table}?select=${encodeURIComponent(select)}`,
      {
        headers: {
          ...apiHeaders(key),
          Range: `${from}-${from + page - 1}`,
          Prefer: 'return=representation',
        },
      },
    );
    if (!res.ok) throw new Error(`${table} fetch failed (${res.status} ${res.statusText})`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < page) break;
    from += page;
  }
  return out;
}

async function auditDb(label, url, key) {
  const out = { label, url: stripUrl(url), counts: {}, providers: null, errors: [] };
  if (!url || !key) {
    out.errors.push('missing credentials');
    return out;
  }

  let tables;
  try {
    tables = await listTables(url, key);
  } catch (e) {
    out.errors.push(`listTables: ${e.message}`);
    return out;
  }
  for (const t of tables) {
    const r = await exactCount(url, key, t);
    out.counts[t] = r.error ? { error: r.error } : { count: r.count };
  }

  if (out.counts.providers && !out.counts.providers.error) {
    try {
      const rows = await fetchAll(url, key, 'providers', 'slug,source,featured,ai_suggested,last_synced_at');
      const slugs = new Map();
      const bySource = {};
      let featured = 0;
      let ai = 0;
      let synced = 0;
      let nullSlug = 0;
      for (const r of rows) {
        if (!r.slug) nullSlug++;
        else slugs.set(r.slug, (slugs.get(r.slug) ?? 0) + 1);
        const s = r.source ?? '(null)';
        bySource[s] = (bySource[s] ?? 0) + 1;
        if (r.featured) featured++;
        if (r.ai_suggested) ai++;
        if (r.last_synced_at) synced++;
      }
      out.providers = {
        total: rows.length,
        nullSlug,
        duplicateSlugs: [...slugs.entries()].filter(([, n]) => n > 1),
        bySource,
        featured,
        aiSuggested: ai,
        lastSynced: synced,
        unsynced: rows.length - synced,
      };
    } catch (e) {
      out.errors.push(`providers detail: ${e.message}`);
    }
  }

  if (out.counts.provider_categories && !out.counts.provider_categories.error && out.providers) {
    try {
      const links = await fetchAll(url, key, 'provider_categories', 'provider_id');
      const linked = new Set(links.map((l) => l.provider_id));
      out.providers.withoutCategory = out.providers.total - linked.size;
    } catch (e) {
      out.errors.push(`provider_categories detail: ${e.message}`);
    }
  }

  return out;
}

function fmtCount(c) {
  if (c.error) return `ERR ${c.error}`;
  return String(c.count ?? 'n/a');
}

function printReport(reports) {
  const allTables = new Set();
  for (const r of reports) Object.keys(r.counts).forEach((t) => allTables.add(t));
  const sorted = [...allTables].sort();
  const w = Math.max(8, ...sorted.map((t) => t.length));
  const header = `TABLE`.padEnd(w) + reports.map((r) => `  ${r.label}`.padEnd(18)).join('');
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const t of sorted) {
    console.log(t.padEnd(w) + reports.map((r) => `  ${fmtCount(r.counts[t])}`.padEnd(18)).join(''));
  }
  console.log('');
  for (const r of reports) {
    console.log(`== ${r.label} ==  url=${r.url}`);
    for (const e of r.errors) console.log(`  ERROR: ${e}`);
    if (r.providers) {
      const p = r.providers;
      console.log(`  providers: total=${p.total} featured=${p.featured} ai_suggested=${p.aiSuggested} ` +
        `last_synced=${p.lastSynced} unsynced=${p.unsynced} null_slug=${p.nullSlug} ` +
        `without_category_link=${p.withoutCategory ?? '?'}`);
      console.log(`    by source: ${JSON.stringify(p.bySource)}`);
      if (p.duplicateSlugs.length) {
        console.log(`    DUPLICATE SLUGS: ${p.duplicateSlugs.map(([s, n]) => `${s}(${n})`).join(', ')}`);
      }
    }
  }
}

loadEnv('.env.local');

const src = {
  label: 'SOURCE',
  url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const tgt = {
  label: 'TARGET',
  url: process.env.SUPABASE_TARGET_URL ?? process.env.SUPABASE_TARGET_NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.SUPABASE_TARGET_SERVICE_ROLE_KEY,
};

const reports = [];
reports.push(await auditDb(src.label, src.url, src.key));
if (tgt.url && tgt.key) reports.push(await auditDb(tgt.label, tgt.url, tgt.key));

printReport(reports);

const mismatch = [];
if (reports.length === 2) {
  for (const t of new Set([...Object.keys(reports[0].counts), ...Object.keys(reports[1].counts)])) {
    const a = reports[0].counts[t];
    const b = reports[1].counts[t];
    if (!a || !b || a.error || b.error || a.count !== b.count) mismatch.push(t);
  }
  if (mismatch.length) {
    console.log('\nMISMATCHED TABLES:', mismatch.join(', '));
  } else {
    console.log('\nAll table counts match between SOURCE and TARGET.');
  }
}
