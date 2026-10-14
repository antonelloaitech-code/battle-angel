-- battle angel v1.17 - Day Stack
-- Safe additive upgrade for an existing battle angel database.
-- It does not delete workouts, videos, routines, meds, calendar data, history, or todos.

create extension if not exists pgcrypto;

alter table public.daily_progress add column if not exists stack_order jsonb not null default '[]'::jsonb;

create table if not exists public.power_todos (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null check (char_length(title) between 1 and 160), sort_order integer not null default 0, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.power_action_plan (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, todo_id uuid not null references public.power_todos(id) on delete cascade, action_date date not null, status text not null default 'pending' check (status in ('pending','done','skipped')), sort_order integer not null default 0, started_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, todo_id, action_date));

alter table public.power_todos add column if not exists sort_order integer not null default 0;
alter table public.power_todos add column if not exists completed_at timestamptz;
alter table public.power_todos add column if not exists created_at timestamptz not null default now();
alter table public.power_todos add column if not exists updated_at timestamptz not null default now();
alter table public.power_action_plan add column if not exists action_date date;
alter table public.power_action_plan add column if not exists status text not null default 'pending';
alter table public.power_action_plan add column if not exists sort_order integer not null default 0;
alter table public.power_action_plan add column if not exists started_at timestamptz;
alter table public.power_action_plan add column if not exists created_at timestamptz not null default now();
alter table public.power_action_plan add column if not exists updated_at timestamptz not null default now();

create index if not exists power_todos_user_active_idx on public.power_todos(user_id, completed_at, sort_order, created_at);
create index if not exists power_action_plan_user_date_idx on public.power_action_plan(user_id, action_date desc, sort_order, created_at);
create unique index if not exists power_action_plan_user_todo_date_unique_v117 on public.power_action_plan(user_id, todo_id, action_date);

alter table public.power_todos enable row level security;
alter table public.power_action_plan enable row level security;
grant select, insert, update, delete on public.power_todos to authenticated;
grant select, insert, update, delete on public.power_action_plan to authenticated;

drop policy if exists "power_todos_select_own" on public.power_todos;
create policy "power_todos_select_own" on public.power_todos for select to authenticated using (auth.uid() = user_id);
drop policy if exists "power_todos_insert_own" on public.power_todos;
create policy "power_todos_insert_own" on public.power_todos for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "power_todos_update_own" on public.power_todos;
create policy "power_todos_update_own" on public.power_todos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "power_todos_delete_own" on public.power_todos;
create policy "power_todos_delete_own" on public.power_todos for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "power_action_plan_select_own" on public.power_action_plan;
create policy "power_action_plan_select_own" on public.power_action_plan for select to authenticated using (auth.uid() = user_id);
drop policy if exists "power_action_plan_insert_own" on public.power_action_plan;
create policy "power_action_plan_insert_own" on public.power_action_plan for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.power_todos t where t.id = todo_id and t.user_id = auth.uid()));
drop policy if exists "power_action_plan_update_own" on public.power_action_plan;
create policy "power_action_plan_update_own" on public.power_action_plan for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.power_todos t where t.id = todo_id and t.user_id = auth.uid()));
drop policy if exists "power_action_plan_delete_own" on public.power_action_plan;
create policy "power_action_plan_delete_own" on public.power_action_plan for delete to authenticated using (auth.uid() = user_id);

notify pgrst, 'reload schema';

select
  exists (select 1 from information_schema.columns where table_schema='public' and table_name='daily_progress' and column_name='stack_order') as day_stack_ready,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='power_todos') as todo_inbox_ready,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='power_action_plan') as today_todos_ready;
