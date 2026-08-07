-- Stack2Set: per-workspace favorites fix.
-- Favorites must be scoped to a workspace. The API previously ignored
-- workspace_id entirely, so rows created through it have NULL workspace_id,
-- and the global (user_id, provider_id) unique constraint silently prevented
-- the same provider from being favorited in more than one workspace.
--
-- This migration:
--   1. Backfills NULL workspace_id favorites into the owner's
--      most-recently-opened workspace.
--   2. Replaces the global unique constraint with a per-workspace one so a
--      provider can be saved in several workspaces.
--   3. Locks down the insert policy so a favorite can only target a workspace
--      the user owns.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- 1. Backfill legacy favorites (created without a workspace) into the owner's
--    most-recently-opened workspace.
-- ---------------------------------------------------------------------------
update public.favorites f
set workspace_id = (
  select w.id
  from public.workspaces w
  where w.user_id = f.user_id and w.archived_at is null
  order by w.last_opened_at desc nulls last, w.created_at asc
  limit 1
)
where f.workspace_id is null;

-- ---------------------------------------------------------------------------
-- 2. Per-workspace uniqueness: the same provider may appear once per workspace.
-- ---------------------------------------------------------------------------
alter table public.favorites
  drop constraint if exists favorites_user_id_provider_id_key;

alter table public.favorites
  add constraint favorites_user_id_workspace_provider_id_key
  unique (user_id, workspace_id, provider_id);

-- ---------------------------------------------------------------------------
-- 3. RLS: favorites may only target workspaces the user owns. An update policy
--    is also required for the API's upsert (on conflict do update) to pass RLS.
-- ---------------------------------------------------------------------------
drop policy if exists "Favorites insert own" on public.favorites;
create policy "Favorites insert own"
  on public.favorites for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      workspace_id is null
      or exists (
        select 1 from public.workspaces w
        where w.id = workspace_id and w.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Favorites update own" on public.favorites;
create policy "Favorites update own"
  on public.favorites for update
  to authenticated
  using (
    auth.uid() = user_id
    and (
      workspace_id is null
      or exists (
        select 1 from public.workspaces w
        where w.id = workspace_id and w.user_id = auth.uid()
      )
    )
  );
