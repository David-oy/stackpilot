-- Stack2Set: persist stack health snapshot (cost / difficulty / AI confidence)
-- so Saved Stacks cards render without recomputing and Current Stack restores
-- its metrics after a refresh.

alter table public.stacks
  add column if not exists health jsonb;

-- Keep the new column behind the same RLS as the rest of the stacks row
-- (stacks table already has per-user select/insert/update/delete policies).
