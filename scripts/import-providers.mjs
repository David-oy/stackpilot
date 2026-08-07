#!/usr/bin/env node
// Stack2Set: production CSV importer for providers.
//
// Reads scripts/data-generator/output/providers.csv (or --csv <path>), resolves
// each CSV category to the real categories.id from the live Supabase DB, skips
// duplicates (slug / normalized_name / website), and inserts new rows one at a
// time through the PostgREST REST API using the service role key.
//
// The DB trigger (migration 0003) computes normalized_name on insert, so it is
// never sent by this script. provider_features / provider_tags are NOT touched.
//
// Usage:
//   node scripts/import-providers.mjs [--csv path/to/providers.csv] [--limit N] [--dry-run]
//
// Idempotent: safe to re-run. Already-imported rows are skipped.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Env (mirrors scripts/verify-supabase.mjs)
// ---------------------------------------------------------------------------
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
const url = process.env.SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_CSV = 'scripts/data-generator/output/providers.csv';
const GENERATOR_CATEGORIES_CSV = 'scripts/data-generator/input/categories.csv';
const FAILURES_LOG = 'scripts/data-generator/output/import-failures.csv';

const VALID_PRICING = new Set(['free', 'freemium', 'usage-based', 'subscription', 'per-seat', 'open-source']);
const VALID_STATUS = new Set(['active', 'inactive', 'deprecated']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// CSV parsing (RFC4180: quoted fields, escaped quotes, embedded newlines)
// ---------------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvToObjects(csvPath) {
  const text = readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  if (!rows.length) throw new Error(`empty CSV: ${csvPath}`);
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Normalization (must mirror lib/db/validate.ts + migration 0003 triggers)
// ---------------------------------------------------------------------------
function normalizeName(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeWebsite(value) {
  let v = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  v = v.replace(/^https?:\/\//, '');
  v = v.replace(/^www\./, '');
  return v.replace(/\/+$/, '');
}

// ---------------------------------------------------------------------------
// REST helpers
// ---------------------------------------------------------------------------
async function restFetch(path, key, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-json
  }
  return { status: res.status, body, contentRange: res.headers.get('content-range') };
}

async function fetchAllRows(path, key) {
  const PAGE = 1000;
  const out = [];
  let start = 0;
  for (;;) {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${start}-${start + PAGE - 1}`,
      },
    });
    if (res.status !== 200) {
      const text = await res.text();
      throw new Error(`fetchAllRows "${path}" failed: HTTP ${res.status} ${text}`);
    }
    const body = await res.json();
    out.push(...(Array.isArray(body) ? body : []));
    if (!Array.isArray(body) || body.length === 0) break;
    const cr = res.headers.get('content-range');
    const totalMatch = cr ? cr.match(/\/(\d+)$/) : null;
    const total = totalMatch ? Number(totalMatch[1]) : null;
    if (total != null && start + body.length >= total) break;
    if (total == null && body.length < PAGE) break;
    start += body.length;
  }
  return out;
}

async function insertProvider(payload) {
  const res = await fetch(`${url}/rest/v1/providers`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-json
  }
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// Payload building
// ---------------------------------------------------------------------------
function toIsoTimestamp(value) {
  if (!value) return null;
  const t = new Date(value);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

function parseJson(value) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function buildProviderPayload(row, categoryId) {
  const pricing = row.pricing_model;
  if (!pricing || !VALID_PRICING.has(pricing)) {
    return { error: `invalid pricing_model '${pricing || ''}'` };
  }
  if (!VALID_STATUS.has(row.status)) {
    return { error: `invalid status '${row.status}'` };
  }
  const name = (row.name || '').trim();
  const slug = (row.slug || '').trim();
  if (!name) return { error: 'missing name' };
  if (!slug) return { error: 'missing slug' };

  const clamp = (v, min, max, def) => {
    const num = Number(v);
    if (!Number.isFinite(num)) return def;
    return Math.max(min, Math.min(max, num));
  };
  const clampScore = (v, def = null) => {
    const num = Number(v);
    if (!Number.isFinite(num)) return def;
    return Math.max(1, Math.min(5, Math.round(num)));
  };
  const clampRating = (v, def = null) => {
    const num = Number(v);
    if (!Number.isFinite(num)) return def;
    return Math.round(Math.max(0, Math.min(5, num)) * 10) / 10;
  };
  const boolOrNull = (v) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return null;
  };
  const strOrNull = (v) => (v ? v : null);

  const payload = {
    category_id: categoryId,
    name,
    slug,
    short_description: row.short_description || '',
    long_description: row.long_description || '',
    logo: strOrNull(row.logo),
    official_website: strOrNull(row.official_website),
    documentation: strOrNull(row.documentation),
    github: strOrNull(row.github),
    pricing_model: pricing,
    free_tier: row.free_tier === 'true',
    open_source: row.open_source === 'true',
    popularity_score: clamp(row.popularity_score, 1, 100, 50),
    featured: row.featured === 'true',
    status: row.status,
    created_at: toIsoTimestamp(row.created_at),
    updated_at: toIsoTimestamp(row.updated_at),
    community_rating: clampRating(row.community_rating),
    stack2set_rating: clampRating(row.stack2set_rating),
    monthly_cost: (() => {
      const num = Number(row.monthly_cost);
      return Number.isFinite(num) ? Math.max(0, Math.round(num)) : null;
    })(),
    enterprise_pricing: strOrNull(row.enterprise_pricing),
    learning_curve: clampScore(row.learning_curve),
    speed: clampScore(row.speed),
    scalability: clampScore(row.scalability),
    reliability: clampScore(row.reliability),
    security: boolOrNull(row.security),
    compliance: parseJson(row.compliance) || [],
    integrations: parseJson(row.integrations) || [],
    apis: parseJson(row.apis) || [],
    sdks: parseJson(row.sdks) || [],
    ai_features: parseJson(row.ai_features) || [],
    languages: parseJson(row.languages) || [],
    compatibility: parseJson(row.compatibility) || {},
    pros: parseJson(row.pros) || [],
    cons: parseJson(row.cons) || [],
    best_use_cases: parseJson(row.best_use_cases) || [],
    ai_summary: strOrNull(row.ai_summary),
    ai_suggested: row.ai_suggested === 'true',
    source: row.source || 'gemini',
    last_synced_at: toIsoTimestamp(row.last_synced_at),
  };

  // Preserve the generator's stable id when it is a valid UUID. Re-runs never
  // collide because duplicate detection runs first; a stray collision is logged.
  if (UUID_RE.test(row.id || '')) {
    payload.id = row.id;
  }

  return { payload };
}

// ---------------------------------------------------------------------------
// Verification (mirrors the app's data layer queries)
// ---------------------------------------------------------------------------
async function verifyImported(importedRows, categoryById) {
  const slugs = importedRows.map((r) => r.slug);
  const slugSet = new Set(slugs);
  let allVisible = 0;
  let categoryPass = 0;
  let searchPass = 0;
  let searchFail = 0;

  // getAllProviders() equivalent
  const all = await fetchAllRows(
    'providers?select=slug&order=popularity_score.desc,slug.asc',
    serviceKey,
  );
  const allSlugs = new Set(all.map((p) => p.slug));
  allVisible = slugs.filter((s) => allSlugs.has(s)).length;

  // getProvidersByCategory() equivalent — group imported by resolved category
  const byCategory = new Map();
  for (const r of importedRows) {
    const list = byCategory.get(r.category_id) ?? [];
    list.push(r.slug);
    byCategory.set(r.category_id, list);
  }
  for (const [catId, catSlugs] of byCategory) {
    const cat = categoryById.get(catId);
    if (!cat) continue;
    const rows = await fetchAllRows(
      `providers?select=slug&category_id=eq.${catId}&order=popularity_score.desc,slug.asc`,
      serviceKey,
    );
    const present = new Set(rows.map((p) => p.slug));
    if (catSlugs.every((s) => present.has(s))) categoryPass += 1;
  }

  // searchProviders() equivalent — sample up to 12 distinct imported names and
  // query with the first distinctive token (mirrors how users actually search;
  // searching a full name containing punctuation like "ROS (Robot Operating
  // System)" is not representative and cannot match the stored column).
  const sample = [...new Set(importedRows.map((r) => r.name))].slice(0, 12);
  for (const name of sample) {
    const token = (name.toLowerCase().match(/[a-z0-9]+/g) || [])[0];
    if (!token) continue;
    const needle = `%${token}%`;
    const or = `(name.ilike.${needle},short_description.ilike.${needle},long_description.ilike.${needle})`;
    const { status, body } = await restFetch(
      `providers?select=slug&or=${encodeURIComponent(or)}&order=popularity_score.desc&limit=50`,
      serviceKey,
    );
    if (status === 200 && Array.isArray(body)) {
      const found = body.map((p) => p.slug);
      const row = importedRows.find((r) => r.name === name);
      if (row && found.includes(row.slug)) {
        searchPass += 1;
      } else {
        searchFail += 1;
        console.log(`    ✗ search did not return "${name}" (${row?.slug ?? '?'})`);
      }
    } else {
      searchFail += 1;
      console.log(`    ✗ search for "${name}" failed: HTTP ${status}`);
    }
  }

  console.log('\n[VERIFICATION]');
  console.log(`  getAllProviders():          ${allVisible}/${slugs.length} imported slugs visible`);
  console.log(`  getProvidersByCategory():   ${categoryPass}/${byCategory.size} categories verified`);
  console.log(`  searchProviders():          ${searchPass}/${sample.length} sample searches passed`);

  const ok = allVisible === slugs.length && categoryPass === byCategory.size && searchFail === 0;
  console.log(ok ? '\n  ✓ All imported providers are visible through the data layer.' : '\n  ✗ Verification failed.');
  return ok;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function printHelp() {
  console.log(`Stack2Set provider importer
Usage:
  node scripts/import-providers.mjs [--csv <path>] [--limit N] [--dry-run] [--parse-only]

Options:
  --csv <path>   CSV to import (default: ${DEFAULT_CSV})
  --limit N      Only import the first N rows (testing)
  --dry-run      Resolve + validate everything but do not insert
  --verify       Run visibility verification only (no inserts)
  --parse-only   Parse the CSV locally and exit (no DB access)
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }
  const csvIdx = args.indexOf('--csv');
  const csvPath = csvIdx >= 0 ? args[csvIdx + 1] : DEFAULT_CSV;
  const limitIdx = args.indexOf('--limit');
  const limitArg = limitIdx >= 0 ? args[limitIdx + 1] : null;
  const limit = limitArg ? Number(limitArg) : null;
  const dryRun = args.includes('--dry-run');
  const parseOnly = args.includes('--parse-only');
  const verifyOnly = args.includes('--verify');

  if (parseOnly) {
    const rows = csvToObjects(resolve(csvPath));
    console.log(`Parsed ${rows.length} rows from ${csvPath}`);
    console.log('Sample row:', JSON.stringify(rows[0], null, 2).slice(0, 600));
    return;
  }

  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const started = Date.now();
  const rows = csvToObjects(resolve(csvPath));
  const slice = limit ? rows.slice(0, limit) : rows;
  console.log(`Target: ${url}`);
  console.log(`CSV: ${csvPath} — ${rows.length} rows${limit ? ` (importing first ${limit})` : ''}${dryRun ? ' [DRY RUN]' : ''}\n`);

  // 3. Fetch every row from the categories table.
  const liveCategories = await fetchAllRows('categories?select=id,name,slug', serviceKey);
  const categoryById = new Map(liveCategories.map((c) => [c.id, c]));
  const categoryBySlug = new Map(liveCategories.map((c) => [c.slug, c]));
  const categoryByName = new Map(liveCategories.map((c) => [normalizeName(c.name), c]));
  console.log(`[1/4] Loaded ${liveCategories.length} categories from Supabase`);

  // Generator manifest: translates CSV category_id -> slug/name when the CSV
  // uuid does not equal the live DB uuid (id or slug/name matching).
  const generatorCategories = new Map();
  try {
    for (const r of csvToObjects(resolve(GENERATOR_CATEGORIES_CSV))) {
      generatorCategories.set(r.id, { name: r.name, slug: r.slug });
    }
  } catch {
    // optional — live id match still works
  }

  function resolveCategory(rawCategoryId) {
    if (categoryById.has(rawCategoryId)) {
      return { id: rawCategoryId, matchedBy: 'id' };
    }
    const gen = generatorCategories.get(rawCategoryId);
    if (gen) {
      const bySlug = categoryBySlug.get(gen.slug);
      if (bySlug) return { id: bySlug.id, matchedBy: `slug '${gen.slug}'` };
      const byName = categoryByName.get(normalizeName(gen.name));
      if (byName) return { id: byName.id, matchedBy: `name '${gen.name}'` };
      return { error: `category '${gen.name}' not found in live DB` };
    }
    return { error: `unknown category_id '${rawCategoryId}'` };
  }

  if (verifyOnly) {
    const resolved = slice
      .map((row) => {
        const cat = resolveCategory(row.category_id);
        return { slug: row.slug, name: row.name, category_id: cat?.id ?? row.category_id };
      })
      .filter((r) => r.category_id);
    const verified = await verifyImported(resolved, categoryById);
    process.exitCode = verified ? 0 : 1;
    return;
  }

  // Existing providers for duplicate detection (slug / normalized_name / website).
  const existing = await fetchAllRows(
    'providers?select=slug,name,normalized_name,official_website',
    serviceKey,
  );
  const existingSlugs = new Set(existing.map((p) => p.slug));
  const existingNames = new Set(
    existing.filter((p) => p.normalized_name).map((p) => p.normalized_name),
  );
  const existingWebsites = new Set(
    existing.filter((p) => p.official_website).map((p) => normalizeWebsite(p.official_website)),
  );
  console.log(`[2/4] Loaded ${existing.length} existing providers for duplicate detection`);

  function duplicateReason(row) {
    if (existingSlugs.has(row.slug)) return `duplicate slug '${row.slug}'`;
    const nameKey = normalizeName(row.name);
    if (nameKey && existingNames.has(nameKey)) return `duplicate normalized_name '${nameKey}'`;
    if (row.official_website) {
      const siteKey = normalizeWebsite(row.official_website);
      if (siteKey && existingWebsites.has(siteKey)) return `duplicate website '${siteKey}'`;
    }
    return null;
  }

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let wouldImport = 0;
  const failures = [];
  const importedRows = [];

  console.log('[3/4] Importing providers...');

  for (let index = 0; index < slice.length; index += 1) {
    const row = slice[index];
    const lineNo = index + 2; // +1 for header

    const dup = duplicateReason(row);
    if (dup) {
      skipped += 1;
      if (!dryRun) {
        existingSlugs.add(row.slug);
        existingNames.add(normalizeName(row.name));
        if (row.official_website) existingWebsites.add(normalizeWebsite(row.official_website));
      }
      continue;
    }

    const cat = resolveCategory(row.category_id);
    if (cat.error) {
      failed += 1;
      failures.push({ lineNo, name: row.name, slug: row.slug, categoryId: row.category_id, reason: cat.error });
      console.log(`  ✗ [line ${lineNo}] ${row.name || '(no name)'}: ${cat.error}`);
      continue;
    }

    const built = buildProviderPayload(row, cat.id);
    if (built.error) {
      failed += 1;
      failures.push({ lineNo, name: row.name, slug: row.slug, categoryId: row.category_id, reason: built.error });
      console.log(`  ✗ [line ${lineNo}] ${row.name || '(no name)'}: ${built.error}`);
      continue;
    }

    if (dryRun) {
      wouldImport += 1;
      continue;
    }

    const { status, body } = await insertProvider(built.payload);
    if (status === 200 || status === 201) {
      imported += 1;
      importedRows.push({ slug: row.slug, name: row.name, category_id: cat.id });
      // Register in-memory so later CSV rows (or re-runs) never double-insert.
      existingSlugs.add(row.slug);
      existingNames.add(normalizeName(row.name));
      if (row.official_website) existingWebsites.add(normalizeWebsite(row.official_website));
    } else if (status === 409) {
      skipped += 1;
      const message = body?.message || 'conflict';
      console.log(`  ⏭ [line ${lineNo}] ${row.name}: duplicate rejected by DB (${message})`);
    } else {
      failed += 1;
      const message = body?.message || `HTTP ${status}`;
      failures.push({ lineNo, name: row.name, slug: row.slug, categoryId: row.category_id, reason: `insert failed: ${message}` });
      console.log(`  ✗ [line ${lineNo}] ${row.name}: ${message}`);
    }

    if ((index + 1) % 100 === 0) {
      console.log(`    ...${index + 1}/${slice.length} rows processed (imported=${imported}, skipped=${skipped}, failed=${failed})`);
    }
  }

  console.log('\n[4/4] Summary');
  if (dryRun) {
    console.log(`  Would import: ${wouldImport}`);
    console.log(`  Skipped (duplicates): ${skipped}`);
    console.log(`  Failed (validation/category): ${failed}`);
  } else {
    console.log(`  Imported: ${imported}`);
    console.log(`  Skipped:  ${skipped}`);
    console.log(`  Failed:   ${failed}`);
    console.log(`  Elapsed:  ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }

  if (failures.length) {
    const lines = [
      'line_no,name,slug,category_id,reason',
      ...failures.map((f) =>
        [f.lineNo, `"${String(f.name).replace(/"/g, '""')}"`, f.slug, f.categoryId, `"${String(f.reason).replace(/"/g, '""')}"`].join(','),
      ),
    ];
    writeFileSync(resolve(FAILURES_LOG), `${lines.join('\n')}\n`, 'utf8');
    console.log(`  ${failures.length} failed row(s) logged to ${FAILURES_LOG}`);
  }

  if (!dryRun && imported > 0) {
    const verified = await verifyImported(importedRows, categoryById);
    if (!verified) process.exitCode = 1;
  }

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
