-- Stack2Set: enable Supabase Realtime for the public catalog so the client can
-- refresh its IndexedDB cache live when providers/categories change.
--
-- Additive only — no data is changed. Apply once in the Supabase dashboard
-- SQL editor or `supabase db push`.
--
-- replica identity full lets DELETE events carry the removed row's key fields
-- so the client knows the catalog changed. The client treats Realtime as
-- optional: if this migration has not been applied yet, catalog refreshes still
-- happen on mount/refresh via conditional HTTP revalidation (ETag/304).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'providers'
  ) then
    alter publication supabase_realtime add table public.providers;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;
end $$;

alter table public.providers replica identity full;
alter table public.categories replica identity full;
