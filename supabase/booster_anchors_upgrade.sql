-- battle angel v1.19 - booster anchors
-- Safe additive upgrade for an existing battle angel database.
-- It does not delete workouts, videos, routines, todos, meds/boosters, plans, history, or logs.

alter table public.daily_meds
  add column if not exists routine_step_id uuid references public.daily_steps(id) on delete set null;

create index if not exists daily_meds_user_routine_step_idx
  on public.daily_meds(user_id, routine_step_id);

-- Keep a booster link private to the signed-in user's own routine steps.
drop policy if exists "daily_meds_insert_own" on public.daily_meds;
create policy "daily_meds_insert_own"
on public.daily_meds for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    routine_step_id is null
    or exists (
      select 1 from public.daily_steps s
      where s.id = routine_step_id and s.user_id = auth.uid()
    )
  )
);

drop policy if exists "daily_meds_update_own" on public.daily_meds;
create policy "daily_meds_update_own"
on public.daily_meds for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    routine_step_id is null
    or exists (
      select 1 from public.daily_steps s
      where s.id = routine_step_id and s.user_id = auth.uid()
    )
  )
);

notify pgrst, 'reload schema';

select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_meds'
      and column_name = 'routine_step_id'
  ) as booster_anchors_ready;
