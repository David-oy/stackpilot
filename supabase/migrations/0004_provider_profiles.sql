-- Stack2Set Phase 8: extended provider profiles + 48h sync metadata
-- Applies on top of 0001_init.sql and 0002_saas.sql.
-- Run in the Supabase SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- providers — extended profile columns (used by detail pages + comparison).
-- All columns are optional so existing rows seed gracefully.
-- ---------------------------------------------------------------------------
alter table public.providers
  add column if not exists community_rating numeric(2,1),
  add column if not exists stack2set_rating numeric(2,1),
  add column if not exists monthly_cost integer,
  add column if not exists enterprise_pricing text,
  add column if not exists learning_curve integer check (learning_curve between 1 and 5),
  add column if not exists speed integer check (speed between 1 and 5),
  add column if not exists scalability integer check (scalability between 1 and 5),
  add column if not exists reliability integer check (reliability between 1 and 5),
  add column if not exists security boolean,
  add column if not exists compliance text[] not null default '{}',
  add column if not exists integrations text[] not null default '{}',
  add column if not exists apis text[] not null default '{}',
  add column if not exists sdks text[] not null default '{}',
  add column if not exists ai_features text[] not null default '{}',
  add column if not exists languages text[] not null default '{}',
  add column if not exists compatibility jsonb not null default '{}'::jsonb,
  add column if not exists pros text[] not null default '{}',
  add column if not exists cons text[] not null default '{}',
  add column if not exists best_use_cases text[] not null default '{}',
  add column if not exists ai_summary text,
  add column if not exists ai_suggested boolean not null default false;

create index if not exists providers_stack2set_rating_idx
  on public.providers (stack2set_rating desc);
create index if not exists providers_monthly_cost_idx
  on public.providers (monthly_cost);

-- ---------------------------------------------------------------------------
-- Sync metadata for the 48h refresh service (task: future DB design).
-- ---------------------------------------------------------------------------
alter table public.providers
  add column if not exists source text,
  add column if not exists last_synced_at timestamptz;

create index if not exists providers_last_synced_idx
  on public.providers (last_synced_at);

-- ---------------------------------------------------------------------------
-- provider_sync_log — record of each sync run (service health / freshness).
-- ---------------------------------------------------------------------------
create table if not exists public.provider_sync_log (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers (id) on delete cascade,
  source text not null,
  status text not null default 'success'
    check (status in ('success', 'skipped', 'failed')),
  details jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists provider_sync_log_provider_idx
  on public.provider_sync_log (provider_id, synced_at desc);

alter table public.provider_sync_log enable row level security;

drop policy if exists "Provider sync log read" on public.provider_sync_log;
create policy "Provider sync log read"
  on public.provider_sync_log for select
  to anon, authenticated
  using (true);
