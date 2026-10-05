-- battle angel database + private video storage
-- Run this whole file in Supabase Dashboard -> SQL Editor.
-- Safe to run again when upgrading from the first battle angel version.

create extension if not exists pgcrypto;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  exercise_group uuid not null default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  video_path text not null,
  sort_order integer not null default 0,
  video_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, video_path)
);

-- Upgrade columns for projects created with battle angel v1.
alter table public.exercises
  add column if not exists exercise_group uuid default gen_random_uuid();

alter table public.exercises
  add column if not exists video_order integer not null default 1;

-- battle angel v3 coaching fields. These live on each video row in an exercise group;
-- the app keeps every row in the group synchronized so the UI stays simple.
alter table public.exercises
  add column if not exists sets_target integer not null default 3;

alter table public.exercises
  add column if not exists reps_target text not null default '8-12';

alter table public.exercises
  add column if not exists last_weight text not null default '';

alter table public.exercises
  add column if not exists cue_1 text not null default '';

alter table public.exercises
  add column if not exists cue_2 text not null default '';

alter table public.exercises
  add column if not exists cue_3 text not null default '';

alter table public.exercises
  add column if not exists backup_exercise text not null default '';

update public.exercises
set exercise_group = gen_random_uuid()
where exercise_group is null;

alter table public.exercises
  alter column exercise_group set default gen_random_uuid();

alter table public.exercises
  alter column exercise_group set not null;

-- (v1.8.1) The old one-time "Arms -> Biceps + Triceps" rename was removed so re-running this file
-- can never rename a folder you deliberately call "Arms".


-- Cloud-synced in-progress workout state. One active/paused workout per user.
-- This complements local browser storage so the current exercise/set follows the user across devices.
create table if not exists public.workout_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  current_index integer not null default 0 check (current_index >= 0),
  sets_done jsonb not null default '{}'::jsonb check (jsonb_typeof(sets_done) = 'object'),
  completed_group_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(completed_group_ids) = 'array'),
  status text not null default 'paused' check (status in ('active', 'paused')),
  updated_at timestamptz not null default now()
);


-- Optional calendar plan. Multiple workout modules can be assigned to the same calendar day.
-- This is additive only: it does not alter or delete existing folders, exercises, videos, or progress.
create table if not exists public.workout_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  folder_id uuid not null references public.folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_user_sort_idx
  on public.folders(user_id, sort_order, created_at);

create index if not exists exercises_folder_sort_idx
  on public.exercises(folder_id, sort_order, video_order, created_at);

create index if not exists exercises_group_idx
  on public.exercises(exercise_group, video_order);

create index if not exists exercises_user_idx
  on public.exercises(user_id);

create index if not exists workout_schedule_user_date_idx
  on public.workout_schedule(user_id, workout_date);

alter table public.folders enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_progress enable row level security;
alter table public.workout_schedule enable row level security;

grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.workout_progress to authenticated;
grant select, insert, update, delete on public.workout_schedule to authenticated;

-- Folder policies

drop policy if exists "folders_select_own" on public.folders;
create policy "folders_select_own"
on public.folders for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "folders_insert_own" on public.folders;
create policy "folders_insert_own"
on public.folders for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "folders_update_own" on public.folders;
create policy "folders_update_own"
on public.folders for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "folders_delete_own" on public.folders;
create policy "folders_delete_own"
on public.folders for delete to authenticated
using (auth.uid() = user_id);

-- Exercise/video policies

drop policy if exists "exercises_select_own" on public.exercises;
create policy "exercises_select_own"
on public.exercises for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own"
on public.exercises for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own"
on public.exercises for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own"
on public.exercises for delete to authenticated
using (auth.uid() = user_id);

-- Workout progress policies

drop policy if exists "workout_progress_select_own" on public.workout_progress;
create policy "workout_progress_select_own"
on public.workout_progress for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "workout_progress_insert_own" on public.workout_progress;
create policy "workout_progress_insert_own"
on public.workout_progress for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_progress_update_own" on public.workout_progress;
create policy "workout_progress_update_own"
on public.workout_progress for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.folders f
    where f.id = folder_id and f.user_id = auth.uid()
  )
);

drop policy if exists "workout_progress_delete_own" on public.workout_progress;
create policy "workout_progress_delete_own"
on public.workout_progress for delete to authenticated
using (auth.uid() = user_id);


-- Calendar schedule policies

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

-- Private Storage bucket. The app uses signed URLs to play videos.
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('gym-videos', 'gym-videos', false, array['video/*']::text[])
on conflict (id) do update
set public = false,
    allowed_mime_types = excluded.allowed_mime_types;

-- Video object path format:
--   USER_UUID/FOLDER_UUID/RANDOM_FILE_NAME.mp4
-- The first path segment must match the signed-in user's auth.uid().

drop policy if exists "gym_videos_select_own" on storage.objects;
create policy "gym_videos_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'gym-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "gym_videos_insert_own" on storage.objects;
create policy "gym_videos_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'gym-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "gym_videos_update_own" on storage.objects;
create policy "gym_videos_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'gym-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'gym-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "gym_videos_delete_own" on storage.objects;
create policy "gym_videos_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'gym-videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);


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
