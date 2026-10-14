-- battle angel v1.18 - organized Day + routine weekdays
-- Safe additive upgrade. Existing routine steps stay set to Every day.
-- This does not delete workouts, videos, calendar data, routine progress, meds, or todos.

alter table public.daily_steps
  add column if not exists active_days jsonb not null default '[0,1,2,3,4,5,6]'::jsonb;

update public.daily_steps
set active_days = '[0,1,2,3,4,5,6]'::jsonb
where active_days is null;

alter table public.daily_steps
  alter column active_days set default '[0,1,2,3,4,5,6]'::jsonb;

alter table public.daily_steps
  alter column active_days set not null;

notify pgrst, 'reload schema';

select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_steps'
      and column_name = 'active_days'
  ) as routine_days_ready;
