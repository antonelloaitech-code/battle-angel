-- battle angel v1.25 - Tiger Flow
-- Additive only. Safe to run more than once.
-- Does not delete or rewrite workouts, videos, routines, todos, boosters, history, or reflection entries.

alter table public.daily_progress
  add column if not exists day_mode text not null default 'standard';

alter table public.daily_steps
  add column if not exists day_order jsonb not null default '{}'::jsonb;

update public.daily_progress
set day_mode = 'standard'
where day_mode is null or day_mode not in ('standard', 'sleeping_tiger');

update public.daily_steps
set day_order = '{}'::jsonb
where day_order is null or jsonb_typeof(day_order) <> 'object';

notify pgrst, 'reload schema';

select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_progress' and column_name = 'day_mode'
  ) as sleeping_tiger_ready,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_steps' and column_name = 'day_order'
  ) as routine_day_order_ready;
