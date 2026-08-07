-- Stack2Set: audit hardening — tighten RLS on analysis_cache.
-- The app only reads/writes analysis_cache with the service-role key (bypasses
-- RLS), so the anonymous/authenticated read+insert policies exposed cached
-- AI analysis snapshots publicly and let any signed-in user write rows.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.

drop policy if exists "Analysis cache read" on public.analysis_cache;
drop policy if exists "Analysis cache insert" on public.analysis_cache;

-- Service role (used by the API) ignores RLS; these grants no longer reach
-- unauthenticated/browser clients.
revoke select on public.analysis_cache from anon, authenticated;
revoke insert on public.analysis_cache from anon, authenticated;

-- ---------------------------------------------------------------------------
-- shares — persisted share links so they survive serverless cold starts and
-- multiple instances. The API writes/reads with the service role only.
-- ---------------------------------------------------------------------------
create table if not exists public.shares (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists shares_expires_idx
  on public.shares (expires_at);

alter table public.shares enable row level security;

-- No policies: only the service role (which bypasses RLS) touches this table.
revoke all on public.shares from anon, authenticated;
