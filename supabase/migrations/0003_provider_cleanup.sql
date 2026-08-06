-- StackPilot: provider data cleanup + uniqueness constraints
-- Applies on top of 0001_init.sql and 0002_saas.sql.
--
-- All steps are idempotent and safe to re-run. No recursive CTEs, no PL/pgSQL
-- record variables.
--
--   1. Adds a maintained `normalized_name` column (lowercased, trimmed,
--      punctuation-stripped provider name) plus a trigger that keeps it in sync.
--   2. Normalizes stored website / documentation values (trim, collapse spaces,
--      strip trailing slashes; empty -> NULL) and relaxes NOT NULL so unknown
--      URLs are stored as NULL instead of fabricated values.
--   3. Deduplicates providers whose normalized name OR normalized website
--      matches. Duplicate groups are resolved by connected components using
--      temp tables and an iterative flood fill (no recursion). The OLDEST row
--      of each group survives; missing metadata and every relation (features,
--      tags, alternatives, provider_categories, favorites, recently_viewed,
--      stack_items, metrics) is merged into the keeper before the duplicates
--      are deleted. It is a no-op when the table has no duplicates.
--   4. Adds unique indexes on slug, normalized_name (non-empty), and the
--      normalized website (non-empty) so duplicates can never recur.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- 1. Normalization helpers
-- ---------------------------------------------------------------------------
create or replace function public.normalize_provider_name(p_name text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(lower(trim(coalesce(p_name, ''))), '\s+', ' ', 'g'),
    '[^a-z0-9]+',
    '',
    'g'
  );
$$;

create or replace function public.normalize_provider_website(p_url text)
returns text
language sql
immutable
as $$
  select case
    when p_url is null or btrim(p_url) = '' then null
    else regexp_replace(
      regexp_replace(
        regexp_replace(btrim(lower(p_url)), '\s+', ' ', 'g'),
        '^https?://', ''),
      '^www\.', '')
  end;
$$;

create or replace function public.set_provider_normalized_name()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name := public.normalize_provider_name(new.name);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. normalized_name column + backfill + trigger
-- ---------------------------------------------------------------------------
alter table public.providers add column if not exists normalized_name text;

update public.providers
set normalized_name = public.normalize_provider_name(name)
where normalized_name is null or normalized_name = '';

drop trigger if exists providers_normalized_name on public.providers;
create trigger providers_normalized_name
  before insert or update of name on public.providers
  for each row execute function public.set_provider_normalized_name();

-- ---------------------------------------------------------------------------
-- 3. Normalize stored website / documentation values; allow NULL
-- ---------------------------------------------------------------------------
alter table public.providers alter column official_website drop not null;
alter table public.providers alter column documentation drop not null;

update public.providers
set official_website = null
where official_website is not null and btrim(official_website) = '';

update public.providers
set official_website = regexp_replace(regexp_replace(btrim(official_website), '\s+', ' ', 'g'), '/+$', '')
where official_website is not null
  and regexp_replace(regexp_replace(btrim(official_website), '\s+', ' ', 'g'), '/+$', '') <> official_website;

update public.providers
set documentation = null
where documentation is not null and btrim(documentation) = '';

update public.providers
set documentation = regexp_replace(regexp_replace(btrim(documentation), '\s+', ' ', 'g'), '/+$', '')
where documentation is not null
  and regexp_replace(regexp_replace(btrim(documentation), '\s+', ' ', 'g'), '/+$', '') <> documentation;

-- ---------------------------------------------------------------------------
-- 4. Deduplicate
-- ---------------------------------------------------------------------------
drop table if exists _dup_edges;
create temp table _dup_edges (
  a_id uuid not null,
  b_id uuid not null
);
create unique index _dup_edges_uniq on _dup_edges (a_id, b_id);

insert into _dup_edges (a_id, b_id)
select distinct least(p1.id, p2.id), greatest(p1.id, p2.id)
from public.providers p1
join public.providers p2 on p1.id < p2.id
  and (
        public.normalize_provider_name(p1.name) = public.normalize_provider_name(p2.name)
     or (
          public.normalize_provider_website(p1.official_website) is not null
      and public.normalize_provider_website(p1.official_website)
            = public.normalize_provider_website(p2.official_website)
        )
  );

drop table if exists _comp;
create temp table _comp (
  node_id uuid not null primary key
);

do $$
declare
  keeper_id uuid;
  member_id uuid;
  added_rows bigint;
  extra_rows bigint;
begin
  loop
    -- The oldest row that participates in any duplicate edge is the oldest row
    -- of its whole connected component, so it is the keeper to preserve.
    select p.id into keeper_id
    from (
      select e.a_id as pid from _dup_edges e
      union
      select e.b_id as pid from _dup_edges e
    ) edge_rows
    join public.providers p on p.id = edge_rows.pid
    order by coalesce(p.created_at, '1970-01-01'::timestamptz), p.id
    limit 1;

    exit when not found;

    delete from _comp;
    insert into _comp (node_id) values (keeper_id);

    -- Flood-fill the connected component of keeper_id (no recursion).
    loop
      insert into _comp (node_id)
      select distinct e.b_id
      from _dup_edges e
      join _comp c on c.node_id = e.a_id
      where not exists (select 1 from _comp c2 where c2.node_id = e.b_id);

      get diagnostics added_rows = row_count;

      insert into _comp (node_id)
      select distinct e.a_id
      from _dup_edges e
      join _comp c on c.node_id = e.b_id
      where not exists (select 1 from _comp c2 where c2.node_id = e.a_id);

      get diagnostics extra_rows = row_count;

      exit when added_rows + extra_rows = 0;
    end loop;

    -- Merge every other member of the component into the keeper, then delete it.
    for member_id in
      select c.node_id from _comp c where c.node_id <> keeper_id
    loop
      -- Merge missing metadata only; never overwrite an existing keeper value.
      update public.providers k
      set name = coalesce(nullif(k.name, ''), d.name),
          short_description = coalesce(nullif(k.short_description, ''), d.short_description),
          long_description = coalesce(nullif(k.long_description, ''), d.long_description),
          logo = coalesce(k.logo, d.logo),
          official_website = coalesce(nullif(k.official_website, ''), d.official_website),
          documentation = coalesce(nullif(k.documentation, ''), d.documentation),
          github = coalesce(k.github, d.github),
          pricing_model = coalesce(nullif(k.pricing_model, ''), d.pricing_model),
          free_tier = coalesce(k.free_tier, d.free_tier),
          open_source = coalesce(k.open_source, d.open_source),
          popularity_score = coalesce(k.popularity_score, d.popularity_score),
          featured = coalesce(k.featured, d.featured),
          status = coalesce(nullif(k.status, ''), d.status)
      from public.providers d
      where k.id = keeper_id
        and d.id = member_id;

      -- Rewire provider_alternatives (both directions), avoiding PK conflicts.
      update public.provider_alternatives pa
      set alternative_provider_id = keeper_id
      where pa.alternative_provider_id = member_id
        and not exists (
          select 1 from public.provider_alternatives pa2
          where pa2.provider_id = pa.provider_id
            and pa2.alternative_provider_id = keeper_id
        );

      update public.provider_alternatives pa
      set provider_id = keeper_id
      where pa.provider_id = member_id
        and not exists (
          select 1 from public.provider_alternatives pa2
          where pa2.provider_id = keeper_id
            and pa2.alternative_provider_id = pa.alternative_provider_id
        );

      -- Drop rows that would violate provider_id <> alternative_provider_id.
      delete from public.provider_alternatives where provider_id = alternative_provider_id;

      -- Rewire favorites / recently_viewed / stack_items.
      update public.favorites f
      set provider_id = keeper_id
      where f.provider_id = member_id
        and not exists (
          select 1 from public.favorites f2
          where f2.user_id = f.user_id and f2.provider_id = keeper_id
        );
      delete from public.favorites where provider_id = member_id;

      update public.recently_viewed rv
      set provider_id = keeper_id
      where rv.provider_id = member_id
        and not exists (
          select 1 from public.recently_viewed rv2
          where rv2.user_id = rv.user_id and rv2.provider_id = keeper_id
        );
      delete from public.recently_viewed where provider_id = member_id;

      update public.stack_items
      set provider_id = keeper_id
      where provider_id = member_id;

      -- Merge metrics (sum) into the keeper.
      insert into public.provider_metrics (id, provider_id, views, saves, favorites_count)
      select gen_random_uuid(), keeper_id, views, saves, favorites_count
      from public.provider_metrics
      where provider_id = member_id
      on conflict (provider_id) do update
        set views = public.provider_metrics.views + excluded.views,
            saves = public.provider_metrics.saves + excluded.saves,
            favorites_count = public.provider_metrics.favorites_count + excluded.favorites_count;
      delete from public.provider_metrics where provider_id = member_id;

      -- Rewire provider_categories links.
      update public.provider_categories pc
      set provider_id = keeper_id
      where pc.provider_id = member_id
        and not exists (
          select 1 from public.provider_categories pc2
          where pc2.provider_id = keeper_id and pc2.category_id = pc.category_id
        );
      delete from public.provider_categories where provider_id = member_id;

      -- Merge features / tags into the keeper.
      insert into public.provider_features (provider_id, feature)
      select keeper_id, feature from public.provider_features where provider_id = member_id
      on conflict (provider_id, feature) do nothing;

      insert into public.provider_tags (provider_id, tag)
      select keeper_id, tag from public.provider_tags where provider_id = member_id
      on conflict (provider_id, tag) do nothing;

      -- Finally remove the duplicate (cascades any leftover relations).
      delete from public.providers where id = member_id;
    end loop;

    -- Drop the whole component from the edge map.
    delete from _dup_edges
    where a_id in (select node_id from _comp)
       or b_id in (select node_id from _comp);
  end loop;
end;
$$;

drop table if exists _comp;
drop table if exists _dup_edges;

-- ---------------------------------------------------------------------------
-- 5. Unique indexes
-- ---------------------------------------------------------------------------
-- slug is already unique from 0001; keep an explicit index under the expected
-- name so the constraint set is explicit and idempotent.
create unique index if not exists providers_slug_key on public.providers (slug);

alter table public.providers alter column normalized_name set not null;

-- Partial: '' normalizes to '' which is not a meaningful identity.
create unique index if not exists providers_normalized_name_key
  on public.providers (normalized_name)
  where normalized_name <> '';

create unique index if not exists providers_website_key
  on public.providers (public.normalize_provider_website(official_website))
  where public.normalize_provider_website(official_website) is not null;
