-- Stack2Set: multi-workspace support (Vercel/GitHub/Notion/Figma style).
-- Adds a workspaces table, links workspace-scoped tables via workspace_id,
-- and backfills every existing user's data into a default "My Workspace".
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'My Workspace',
  description text not null default '',
  icon text not null default '🚀',
  color text not null default '#8b5cf6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists workspaces_user_idx
  on public.workspaces (user_id, last_opened_at desc);

alter table public.workspaces enable row level security;

drop policy if exists "Workspaces view own" on public.workspaces;
create policy "Workspaces view own"
  on public.workspaces for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Workspaces insert own" on public.workspaces;
create policy "Workspaces insert own"
  on public.workspaces for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Workspaces update own" on public.workspaces;
create policy "Workspaces update own"
  on public.workspaces for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Workspaces delete own" on public.workspaces;
create policy "Workspaces delete own"
  on public.workspaces for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Link workspace-scoped tables. All existing rows start with workspace_id null
-- and are backfilled below into the owner's default workspace.
-- ---------------------------------------------------------------------------
alter table public.stacks
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;
alter table public.favorites
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;
alter table public.saved_prompts
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;
alter table public.recently_viewed
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

create index if not exists stacks_workspace_idx
  on public.stacks (workspace_id, updated_at desc);
create index if not exists favorites_workspace_idx
  on public.favorites (workspace_id);
create index if not exists saved_prompts_workspace_idx
  on public.saved_prompts (workspace_id, updated_at desc);
create index if not exists recently_viewed_workspace_idx
  on public.recently_viewed (workspace_id);

-- ---------------------------------------------------------------------------
-- Backfill: give every existing user (from data tables or profiles) a default
-- workspace named "My Workspace", then assign all their rows to it.
-- ---------------------------------------------------------------------------
insert into public.workspaces (user_id, name)
select distinct u.id, 'My Workspace'
from (
  select user_id as id from public.stacks
  union select user_id from public.favorites
  union select user_id from public.saved_prompts
  union select user_id from public.recently_viewed
  union select id from public.profiles
) u
where u.id is not null
  and not exists (select 1 from public.workspaces w where w.user_id = u.id);

update public.stacks s
set workspace_id = w.id
from public.workspaces w
where w.user_id = s.user_id and s.workspace_id is null;

update public.favorites f
set workspace_id = w.id
from public.workspaces w
where w.user_id = f.user_id and f.workspace_id is null;

update public.saved_prompts p
set workspace_id = w.id
from public.workspaces w
where w.user_id = p.user_id and p.workspace_id is null;

update public.recently_viewed r
set workspace_id = w.id
from public.workspaces w
where w.user_id = r.user_id and r.workspace_id is null;

-- ---------------------------------------------------------------------------
-- New auth users automatically get a default workspace on signup.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_default_workspace()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.workspaces (user_id, name)
  values (new.id, 'My Workspace');
  return new;
end;
$$;

drop trigger if exists ensure_default_workspace_trigger on auth.users;
create trigger ensure_default_workspace_trigger
  after insert on auth.users
  for each row execute function public.ensure_default_workspace();

-- ---------------------------------------------------------------------------
-- updated_at trigger + grants
-- ---------------------------------------------------------------------------
drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.workspaces to authenticated;
