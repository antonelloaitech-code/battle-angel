-- battle angel v1.8 planner upgrade
-- Safe for an existing project. This does not delete folders, exercises, uploaded videos, workout history, or schedule rows.
-- It only removes the old one-workout-per-day / one-workout-per-weekday uniqueness rules.

begin;

-- Allow multiple workout modules on one calendar date.
alter table public.workout_schedule
  drop constraint if exists workout_schedule_user_id_workout_date_key;

create unique index if not exists workout_schedule_user_date_folder_unique
  on public.workout_schedule(user_id, workout_date, folder_id);

-- Keep a single whole-day "skip recurring plan" marker when folder_id is null.
create unique index if not exists workout_schedule_user_date_skip_unique
  on public.workout_schedule(user_id, workout_date)
  where is_skipped = true;

-- Allow multiple workout modules on one recurring weekday.
alter table public.workout_weekly_plan
  drop constraint if exists workout_weekly_plan_user_id_weekday_key;

create unique index if not exists workout_weekly_plan_user_weekday_folder_unique
  on public.workout_weekly_plan(user_id, weekday, folder_id);

commit;

notify pgrst, 'reload schema';

-- Verification: both rows should say true.
select
  exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'workout_schedule_user_date_folder_unique'
  ) as multiple_workouts_per_date,
  exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'workout_weekly_plan_user_weekday_folder_unique'
  ) as multiple_workouts_per_weekday;
