-- StackPilot: categories, providers, and relation tables
-- Compatible with Supabase Postgres (15+). Apply via the Supabase dashboard SQL editor
-- or `supabase db push`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default 'layers',
  description text not null default '',
  aliases text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_slug_idx on public.categories (slug);

-- ---------------------------------------------------------------------------
-- providers
-- ---------------------------------------------------------------------------
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  slug text not null unique,
  short_description text not null default '',
  long_description text not null default '',
  logo text,
  official_website text not null default '',
  documentation text not null default '',
  github text,
  pricing_model text not null default 'freemium'
    check (pricing_model in ('free', 'freemium', 'usage-based', 'subscription', 'per-seat', 'open-source')),
  free_tier boolean not null default false,
  open_source boolean not null default false,
  popularity_score integer not null default 50,
  featured boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists providers_category_id_idx on public.providers (category_id);
create index if not exists providers_slug_idx on public.providers (slug);
create index if not exists providers_popularity_idx on public.providers (popularity_score desc);
create index if not exists providers_status_idx on public.providers (status);

-- ---------------------------------------------------------------------------
-- provider_features
-- ---------------------------------------------------------------------------
create table if not exists public.provider_features (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  feature text not null,
  unique (provider_id, feature)
);

create index if not exists provider_features_provider_id_idx on public.provider_features (provider_id);

-- ---------------------------------------------------------------------------
-- provider_tags
-- ---------------------------------------------------------------------------
create table if not exists public.provider_tags (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  tag text not null,
  unique (provider_id, tag)
);

create index if not exists provider_tags_provider_id_idx on public.provider_tags (provider_id);

-- ---------------------------------------------------------------------------
-- provider_alternatives
-- ---------------------------------------------------------------------------
create table if not exists public.provider_alternatives (
  provider_id uuid not null references public.providers (id) on delete cascade,
  alternative_provider_id uuid not null references public.providers (id) on delete cascade,
  primary key (provider_id, alternative_provider_id),
  check (provider_id <> alternative_provider_id)
);

create index if not exists provider_alternatives_alternative_idx
  on public.provider_alternatives (alternative_provider_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();
