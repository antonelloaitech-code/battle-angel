-- GymFlow database + private video storage
-- Run this whole file in Supabase Dashboard -> SQL Editor.
-- Safe to run again when upgrading from the first GymFlow version.

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

-- Upgrade columns for projects created with GymFlow v1.
alter table public.exercises
  add column if not exists exercise_group uuid default gen_random_uuid();

alter table public.exercises
  add column if not exists video_order integer not null default 1;

-- GymFlow v3 coaching fields. These live on each video row in an exercise group;
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

-- First-version migration: split the old Arms default into Biceps + Triceps.
-- Existing Arms videos stay in the renamed Biceps folder so nothing is deleted.
with renamed_arms as (
  update public.folders f
  set name = 'Biceps', sort_order = 5
  where lower(f.name) = 'arms'
    and not exists (
      select 1
      from public.folders b
      where b.user_id = f.user_id
        and lower(b.name) = 'biceps'
    )
  returning user_id
)
insert into public.folders (user_id, name, sort_order)
select user_id, 'Triceps', 6
from renamed_arms
on conflict (user_id, name) do nothing;

create index if not exists folders_user_sort_idx
  on public.folders(user_id, sort_order, created_at);

create index if not exists exercises_folder_sort_idx
  on public.exercises(folder_id, sort_order, video_order, created_at);

create index if not exists exercises_group_idx
  on public.exercises(exercise_group, video_order);

create index if not exists exercises_user_idx
  on public.exercises(user_id);

alter table public.folders enable row level security;
alter table public.exercises enable row level security;

grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;

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
