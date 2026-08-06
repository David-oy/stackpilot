-- StackPilot Phase 6: SaaS schema (users, profiles, stacks, favorites, etc.)
-- Applies on top of 0001_init.sql. Run in the Supabase SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- Enable RLS on existing reference tables and allow public reads.
-- The app reads providers via the service-role key (bypasses RLS); these
-- policies are for direct anon/authenticated access.
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.providers enable row level security;
alter table public.provider_features enable row level security;
alter table public.provider_tags enable row level security;
alter table public.provider_alternatives enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read providers" on public.providers;
create policy "Public read providers"
  on public.providers for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read provider_features" on public.provider_features;
create policy "Public read provider_features"
  on public.provider_features for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read provider_tags" on public.provider_tags;
create policy "Public read provider_tags"
  on public.provider_tags for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read provider_alternatives" on public.provider_alternatives;
create policy "Public read provider_alternatives"
  on public.provider_alternatives for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- users — mirrors auth.users so the app has a stable, ownable user record.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Users view own row" on public.users;
create policy "Users view own row"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- profiles — public user profile data.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles view own row" on public.profiles;
create policy "Profiles view own row"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles update own row" on public.profiles;
create policy "Profiles update own row"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- provider_categories — many-to-many join (kept in sync with providers.category_id).
-- ---------------------------------------------------------------------------
create table if not exists public.provider_categories (
  provider_id uuid not null references public.providers (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (provider_id, category_id)
);

create index if not exists provider_categories_category_idx
  on public.provider_categories (category_id);

alter table public.provider_categories enable row level security;

drop policy if exists "Public read provider_categories" on public.provider_categories;
create policy "Public read provider_categories"
  on public.provider_categories for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- stacks — a user's saved stack. client_id preserves the app's short ids
-- so existing share links and saved stacks keep working after sync.
-- ---------------------------------------------------------------------------
create table if not exists public.stacks (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  prompt text not null default '',
  source_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists stacks_user_updated_idx
  on public.stacks (user_id, updated_at desc);

alter table public.stacks enable row level security;

drop policy if exists "Stacks view own" on public.stacks;
create policy "Stacks view own"
  on public.stacks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Stacks insert own" on public.stacks;
create policy "Stacks insert own"
  on public.stacks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Stacks update own" on public.stacks;
create policy "Stacks update own"
  on public.stacks for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Stacks delete own" on public.stacks;
create policy "Stacks delete own"
  on public.stacks for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- stack_items — one row per provider in a stack. provider_snapshot keeps the
-- stack self-contained so it renders even if the provider DB changes.
-- ---------------------------------------------------------------------------
create table if not exists public.stack_items (
  id uuid primary key default gen_random_uuid(),
  stack_id uuid not null references public.stacks (id) on delete cascade,
  category_id text not null,
  category_name text not null,
  provider_id uuid references public.providers (id) on delete set null,
  provider_snapshot jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists stack_items_stack_idx
  on public.stack_items (stack_id);

alter table public.stack_items enable row level security;

drop policy if exists "Stack items view own" on public.stack_items;
create policy "Stack items view own"
  on public.stack_items for select
  to authenticated
  using (
    exists (
      select 1 from public.stacks
      where stacks.id = stack_items.stack_id
        and stacks.user_id = auth.uid()
    )
  );

drop policy if exists "Stack items insert own" on public.stack_items;
create policy "Stack items insert own"
  on public.stack_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.stacks
      where stacks.id = stack_items.stack_id
        and stacks.user_id = auth.uid()
    )
  );

drop policy if exists "Stack items update own" on public.stack_items;
create policy "Stack items update own"
  on public.stack_items for update
  to authenticated
  using (
    exists (
      select 1 from public.stacks
      where stacks.id = stack_items.stack_id
        and stacks.user_id = auth.uid()
    )
  );

drop policy if exists "Stack items delete own" on public.stack_items;
create policy "Stack items delete own"
  on public.stack_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.stacks
      where stacks.id = stack_items.stack_id
        and stacks.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- favorites — providers a user saved.
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  category_id text,
  created_at timestamptz not null default now(),
  unique (user_id, provider_id)
);

create index if not exists favorites_user_idx
  on public.favorites (user_id);

alter table public.favorites enable row level security;

drop policy if exists "Favorites view own" on public.favorites;
create policy "Favorites view own"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Favorites insert own" on public.favorites;
create policy "Favorites insert own"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Favorites delete own" on public.favorites;
create policy "Favorites delete own"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- recently_viewed — last-viewed providers per user.
-- ---------------------------------------------------------------------------
create table if not exists public.recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, provider_id)
);

create index if not exists recently_viewed_user_idx
  on public.recently_viewed (user_id, viewed_at desc);

alter table public.recently_viewed enable row level security;

drop policy if exists "Recently viewed view own" on public.recently_viewed;
create policy "Recently viewed view own"
  on public.recently_viewed for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Recently viewed insert own" on public.recently_viewed;
create policy "Recently viewed insert own"
  on public.recently_viewed for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Recently viewed delete own" on public.recently_viewed;
create policy "Recently viewed delete own"
  on public.recently_viewed for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- saved_prompts — user's saved AI prompts and their analysis snapshots.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt text not null,
  analysis_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_prompts_user_idx
  on public.saved_prompts (user_id, updated_at desc);

alter table public.saved_prompts enable row level security;

drop policy if exists "Saved prompts view own" on public.saved_prompts;
create policy "Saved prompts view own"
  on public.saved_prompts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Saved prompts insert own" on public.saved_prompts;
create policy "Saved prompts insert own"
  on public.saved_prompts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Saved prompts update own" on public.saved_prompts;
create policy "Saved prompts update own"
  on public.saved_prompts for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Saved prompts delete own" on public.saved_prompts;
create policy "Saved prompts delete own"
  on public.saved_prompts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- analysis_cache — persistent cache for AI analysis results keyed by prompt.
-- ---------------------------------------------------------------------------
create table if not exists public.analysis_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  description text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists analysis_cache_expires_idx
  on public.analysis_cache (expires_at);

alter table public.analysis_cache enable row level security;

drop policy if exists "Analysis cache read" on public.analysis_cache;
create policy "Analysis cache read"
  on public.analysis_cache for select
  to anon, authenticated
  using (true);

drop policy if exists "Analysis cache insert" on public.analysis_cache;
create policy "Analysis cache insert"
  on public.analysis_cache for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- provider_metrics — aggregate popularity counters.
-- ---------------------------------------------------------------------------
create table if not exists public.provider_metrics (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.providers (id) on delete cascade,
  views bigint not null default 0,
  saves bigint not null default 0,
  favorites_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.provider_metrics enable row level security;

drop policy if exists "Provider metrics read" on public.provider_metrics;
create policy "Provider metrics read"
  on public.provider_metrics for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Auto-create users + profiles when a Supabase auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (new.id, null, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at triggers for new tables.
-- ---------------------------------------------------------------------------
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists stacks_set_updated_at on public.stacks;
create trigger stacks_set_updated_at
  before update on public.stacks
  for each row execute function public.set_updated_at();

drop trigger if exists saved_prompts_set_updated_at on public.saved_prompts;
create trigger saved_prompts_set_updated_at
  before update on public.saved_prompts
  for each row execute function public.set_updated_at();

drop trigger if exists provider_metrics_set_updated_at on public.provider_metrics;
create trigger provider_metrics_set_updated_at
  before update on public.provider_metrics
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select on public.categories, public.providers,
  public.provider_features, public.provider_tags,
  public.provider_alternatives, public.provider_categories,
  public.analysis_cache, public.provider_metrics
  to anon, authenticated;

grant select, insert, update, delete on
  public.users, public.profiles, public.stacks, public.stack_items,
  public.favorites, public.recently_viewed, public.saved_prompts
  to authenticated;

grant usage on schema public to anon, authenticated;
