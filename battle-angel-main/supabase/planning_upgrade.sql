-- battle angel planning upgrade
-- Safe for an existing project with uploaded workouts/videos.
-- This only adds planning/history fields and tables. It does not delete workouts or Storage objects.

create extension if not exists pgcrypto;

-- Keep one-tap backup-exercise state synced with the in-progress workout.
alter table public.workout_progress
  add column if not exists backup_group_ids jsonb not null default '[]'::jsonb;

-- Calendar overrides can now explicitly skip a recurring weekly day.
create table if not exists public.workout_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  folder_id uuid references public.folders(id) on delete cascade,
  is_skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_schedule
  add column if not exists is_skipped boolean not null default false;

alter table public.workout_schedule
  alter column folder_id drop not null;

-- v1.8: allow more than one workout module on the same date.
alter table public.workout_schedule
  drop constraint if exists workout_schedule_user_id_workout_date_key;

create unique index if not exists workout_schedule_user_date_folder_unique
  on public.workout_schedule(user_id, workout_date, folder_id);

create unique index if not exists workout_schedule_user_date_skip_unique
  on public.workout_schedule(user_id, workout_date)
  where is_skipped = true;

-- Recurring weekly plan: 0=Sunday, 1=Monday ... 6=Saturday.
create table if not exists public.workout_weekly_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  folder_id uuid not null references public.folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Minimal history only records completed workouts so missed-day handling is reliable.
-- v1.8: allow multiple recurring modules on the same weekday.
alter table public.workout_weekly_plan
  drop constraint if exists workout_weekly_plan_user_id_weekday_key;

create unique index if not exists workout_weekly_plan_user_weekday_folder_unique
  on public.workout_weekly_plan(user_id, weekday, folder_id);

create table if not exists public.workout_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  folder_id uuid not null references public.folders(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, workout_date, folder_id)
);

create index if not exists workout_weekly_plan_user_weekday_idx
  on public.workout_weekly_plan(user_id, weekday);

create index if not exists workout_history_user_date_idx
  on public.workout_history(user_id, workout_date desc);

create index if not exists workout_schedule_user_date_idx
  on public.workout_schedule(user_id, workout_date);

alter table public.workout_weekly_plan enable row level security;
alter table public.workout_history enable row level security;
alter table public.workout_schedule enable row level security;

grant select, insert, update, delete on public.workout_weekly_plan to authenticated;
grant select, insert, update, delete on public.workout_history to authenticated;
grant select, insert, update, delete on public.workout_schedule to authenticated;


-- Schedule select/delete policies are included here too so this migration is standalone.
drop policy if exists "workout_schedule_select_own" on public.workout_schedule;
create policy "workout_schedule_select_own"
on public.workout_schedule for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_schedule_delete_own" on public.workout_schedule;
create policy "workout_schedule_delete_own"
on public.workout_schedule for delete to authenticated
using (auth.uid() = user_id);

-- Replace schedule insert/update policies so a skipped recurring date may have folder_id = null.
drop policy if exists "workout_schedule_insert_own" on public.workout_schedule;
create policy "workout_schedule_insert_own"
on public.workout_schedule for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    (is_skipped = true and folder_id is null)
    or
    (is_skipped = false and exists (
      select 1 from public.folders f
      where f.id = folder_id and f.user_id = auth.uid()
    ))
  )
);

drop policy if exists "workout_schedule_update_own" on public.workout_schedule;
create policy "workout_schedule_update_own"
on public.workout_schedule for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    (is_skipped = true and folder_id is null)
    or
    (is_skipped = false and exists (
      select 1 from public.folders f
      where f.id = folder_id and f.user_id = auth.uid()
    ))
  )
);

-- Weekly plan policies.
drop policy if exists "workout_weekly_plan_select_own" on public.workout_weekly_plan;
create policy "workout_weekly_plan_select_own"
on public.workout_weekly_plan for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_weekly_plan_insert_own" on public.workout_weekly_plan;
create policy "workout_weekly_plan_insert_own"
on public.workout_weekly_plan for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_weekly_plan_update_own" on public.workout_weekly_plan;
create policy "workout_weekly_plan_update_own"
on public.workout_weekly_plan for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_weekly_plan_delete_own" on public.workout_weekly_plan;
create policy "workout_weekly_plan_delete_own"
on public.workout_weekly_plan for delete to authenticated
using (auth.uid() = user_id);

-- Workout history policies.
drop policy if exists "workout_history_select_own" on public.workout_history;
create policy "workout_history_select_own"
on public.workout_history for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_history_insert_own" on public.workout_history;
create policy "workout_history_insert_own"
on public.workout_history for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_history_update_own" on public.workout_history;
create policy "workout_history_update_own"
on public.workout_history for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_history_delete_own" on public.workout_history;
create policy "workout_history_delete_own"
on public.workout_history for delete to authenticated
using (auth.uid() = user_id);
