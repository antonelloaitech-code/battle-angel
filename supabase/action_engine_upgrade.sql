-- battle angel v1.18 - Action Engine
-- Safe additive upgrade for an existing battle angel database (v1.17 Day Stack or newer).
-- It does not delete workouts, videos, routines, meds, calendar data, history, or todos.
-- Every new column has a safe default, so the app keeps working before and after you run this.
-- The same statements are included in schema.sql, so running either file is enough.

-- Core routine steps: the minimum version of the day that still runs on low-energy days.
alter table public.daily_steps
  add column if not exists is_core boolean not null default false;

-- Per-day mode, how often each card was sent to Later today, and an explicit "wrap up day".
alter table public.daily_progress
  add column if not exists energy_mode text not null default 'normal';

alter table public.daily_progress
  add column if not exists defer_counts jsonb not null default '{}'::jsonb;

alter table public.daily_progress
  add column if not exists closed_at timestamptz;

-- Inbox triage: optional size, progressive "not today" snooze, and first-step links for "Shrink it".
alter table public.power_todos
  add column if not exists size text;

alter table public.power_todos
  add column if not exists snoozed_until date;

alter table public.power_todos
  add column if not exists snooze_count integer not null default 0;

alter table public.power_todos
  add column if not exists parent_id uuid references public.power_todos(id) on delete set null;

-- Value checks, added only once so re-running never fails.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'daily_progress_energy_mode_check') then
    alter table public.daily_progress
      add constraint daily_progress_energy_mode_check check (energy_mode in ('normal', 'low'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'daily_progress_defer_counts_check') then
    alter table public.daily_progress
      add constraint daily_progress_defer_counts_check check (jsonb_typeof(defer_counts) = 'object');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'power_todos_size_check') then
    alter table public.power_todos
      add constraint power_todos_size_check check (size is null or size in ('quick', 'big'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'power_todos_snooze_count_check') then
    alter table public.power_todos
      add constraint power_todos_snooze_count_check check (snooze_count >= 0);
  end if;
end $$;

create index if not exists power_todos_user_completed_idx
  on public.power_todos(user_id, completed_at desc);

create index if not exists power_todos_parent_idx
  on public.power_todos(parent_id)
  where parent_id is not null;

-- A first step may only point at one of your own todos.
-- (power_todos.parent_id is qualified on purpose: inside the subquery a bare parent_id would mean p.parent_id.)
drop policy if exists "power_todos_insert_own" on public.power_todos;
create policy "power_todos_insert_own"
on public.power_todos for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    parent_id is null
    or exists (select 1 from public.power_todos p where p.id = power_todos.parent_id and p.user_id = auth.uid())
  )
);

drop policy if exists "power_todos_update_own" on public.power_todos;
create policy "power_todos_update_own"
on public.power_todos for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    parent_id is null
    or exists (select 1 from public.power_todos p where p.id = power_todos.parent_id and p.user_id = auth.uid())
  )
);

notify pgrst, 'reload schema';

-- Verification: every column should say true.
select
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'daily_steps' and column_name = 'is_core') as core_steps_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'daily_progress' and column_name = 'energy_mode') as low_energy_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'daily_progress' and column_name = 'defer_counts') as later_counts_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'daily_progress' and column_name = 'closed_at') as wrap_up_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'power_todos' and column_name = 'snoozed_until') as triage_snooze_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'power_todos' and column_name = 'size') as todo_size_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'power_todos' and column_name = 'parent_id') as first_steps_ready;
