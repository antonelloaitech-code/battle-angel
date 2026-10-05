-- battle angel calendar-only migration
-- Safe for an existing battle angel project with uploaded workouts/videos.
-- This file only creates the optional workout_schedule table, index, grants, RLS, and policies.
-- It does not update or delete folders, exercises, workout_progress, or Storage objects.

create extension if not exists pgcrypto;

create table if not exists public.workout_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  folder_id uuid not null references public.folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_date)
);

create index if not exists workout_schedule_user_date_idx
  on public.workout_schedule(user_id, workout_date);

alter table public.workout_schedule enable row level security;

grant select, insert, update, delete on public.workout_schedule to authenticated;

drop policy if exists "workout_schedule_select_own" on public.workout_schedule;
create policy "workout_schedule_select_own"
on public.workout_schedule for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_schedule_insert_own" on public.workout_schedule;
create policy "workout_schedule_insert_own"
on public.workout_schedule for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_schedule_update_own" on public.workout_schedule;
create policy "workout_schedule_update_own"
on public.workout_schedule for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_schedule_delete_own" on public.workout_schedule;
create policy "workout_schedule_delete_own"
on public.workout_schedule for delete to authenticated
using (auth.uid() = user_id);
