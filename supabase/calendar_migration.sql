-- battle angel calendar migration (current)
-- Safe for an existing project with uploaded workouts/videos.
-- Creates the optional planner and supports multiple workout modules on the same day.

create extension if not exists pgcrypto;

create table if not exists public.workout_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  folder_id uuid references public.folders(id) on delete cascade,
  is_skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_schedule add column if not exists is_skipped boolean not null default false;
alter table public.workout_schedule alter column folder_id drop not null;
alter table public.workout_schedule drop constraint if exists workout_schedule_user_id_workout_date_key;

create index if not exists workout_schedule_user_date_idx
  on public.workout_schedule(user_id, workout_date);
create unique index if not exists workout_schedule_user_date_folder_unique
  on public.workout_schedule(user_id, workout_date, folder_id);
create unique index if not exists workout_schedule_user_date_skip_unique
  on public.workout_schedule(user_id, workout_date)
  where is_skipped = true;

alter table public.workout_schedule enable row level security;
grant select, insert, update, delete on public.workout_schedule to authenticated;

drop policy if exists "workout_schedule_all_own" on public.workout_schedule;
create policy "workout_schedule_all_own"
on public.workout_schedule for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
