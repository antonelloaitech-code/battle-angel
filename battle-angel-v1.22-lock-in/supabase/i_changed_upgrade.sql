-- battle angel v1.21 - "I changed" gratitude + story
-- Additive only. Safe to re-run. Does not delete or modify gym, day, todo, booster, or media data.

create extension if not exists pgcrypto;

create table if not exists public.changed_board_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  side text not null check (side in ('present', 'absent')),
  body text not null check (char_length(body) between 1 and 400),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists changed_board_entries_user_side_sort_idx
  on public.changed_board_entries(user_id, side, sort_order, created_at);

create unique index if not exists changed_board_entries_no_exact_duplicates
  on public.changed_board_entries(user_id, side, lower(btrim(body)));

create table if not exists public.changed_story_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists changed_story_entries_user_sort_idx
  on public.changed_story_entries(user_id, sort_order, created_at);

create unique index if not exists changed_story_entries_no_exact_duplicates
  on public.changed_story_entries(user_id, lower(btrim(body)));

alter table public.changed_board_entries enable row level security;
alter table public.changed_story_entries enable row level security;

grant select, insert, update, delete on public.changed_board_entries to authenticated;
grant select, insert, update, delete on public.changed_story_entries to authenticated;

drop policy if exists "changed_board_entries_select_own" on public.changed_board_entries;
create policy "changed_board_entries_select_own"
on public.changed_board_entries for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "changed_board_entries_insert_own" on public.changed_board_entries;
create policy "changed_board_entries_insert_own"
on public.changed_board_entries for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "changed_board_entries_update_own" on public.changed_board_entries;
create policy "changed_board_entries_update_own"
on public.changed_board_entries for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "changed_board_entries_delete_own" on public.changed_board_entries;
create policy "changed_board_entries_delete_own"
on public.changed_board_entries for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "changed_story_entries_select_own" on public.changed_story_entries;
create policy "changed_story_entries_select_own"
on public.changed_story_entries for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "changed_story_entries_insert_own" on public.changed_story_entries;
create policy "changed_story_entries_insert_own"
on public.changed_story_entries for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "changed_story_entries_update_own" on public.changed_story_entries;
create policy "changed_story_entries_update_own"
on public.changed_story_entries for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "changed_story_entries_delete_own" on public.changed_story_entries;
create policy "changed_story_entries_delete_own"
on public.changed_story_entries for delete to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';

select
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'changed_board_entries') as gratitude_board_ready,
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'changed_story_entries') as story_ready;
