-- battle angel v1.20 - routine steps on chosen days, and a routine step linked to your workout
-- Safe additive upgrade for an existing battle angel database. Run it once in the Supabase SQL editor.
-- It does not delete or change any workouts, videos, routines, boosters, calendar data, history, or todos.
-- Until it runs, battle angel keeps working: every routine step runs every day, and a step with
-- gym, workout or training in its name opens today's workout.
-- The same statements are included in schema.sql, so running either file is enough.

-- The days a routine step runs on: 0 = Sunday, 1 = Monday ... 6 = Saturday.
-- NULL (the default, and what every existing step gets) means every day.
alter table public.daily_steps
  add column if not exists weekdays smallint[];

-- true: this step opens today's workout. false: it never does. NULL: decided by the step's name.
alter table public.daily_steps
  add column if not exists opens_workout boolean;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'daily_steps_weekdays_valid' and conrelid = 'public.daily_steps'::regclass
  ) then
    alter table public.daily_steps
      add constraint daily_steps_weekdays_valid
      check (
        weekdays is null
        or (cardinality(weekdays) between 1 and 7 and weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[])
      );
  end if;
end $$;

notify pgrst, 'reload schema';

-- Verification: both should say true.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_steps' and column_name = 'weekdays'
  ) as routine_days_ready,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_steps' and column_name = 'opens_workout'
  ) as workout_link_ready;
