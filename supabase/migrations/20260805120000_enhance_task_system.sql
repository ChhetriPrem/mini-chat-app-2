-- =====================================================================
-- Enhanced Task System Migration
-- =====================================================================

-- 1. USERS: ensure gender exists on profiles
alter table public.profiles add column if not exists gender text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_gender_check') then
    alter table public.profiles
      add constraint profiles_gender_check
      check (gender is null or gender in ('male','female','other','prefer_not_to_say'));
  end if;
end $$;

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 2. TASKS TABLE
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon_url text,
  reward_coins integer not null default 0,
  target_gender text not null default 'all',
  duration_type text not null,
  expiry_date timestamptz,
  target_count integer not null default 1,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_reward_coins_check check (reward_coins >= 0),
  constraint tasks_target_gender_check check (target_gender in ('male','female','all')),
  constraint tasks_duration_type_check check (duration_type in ('24h','custom','weekly','permanent')),
  constraint tasks_status_check check (status in ('active','inactive')),
  constraint tasks_target_count_check check (target_count >= 1)
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_expiry on public.tasks(expiry_date);
create index if not exists idx_tasks_gender on public.tasks(target_gender);

-- 3. USER_TASKS TABLE
create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  progress integer not null default 0,
  completed boolean not null default false,
  claimed boolean not null default false,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_tasks_unique unique (user_id, task_id),
  constraint user_tasks_progress_check check (progress >= 0)
);

create index if not exists idx_user_tasks_user on public.user_tasks(user_id);
create index if not exists idx_user_tasks_task on public.user_tasks(task_id);

-- 4. updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $f$
begin
  new.updated_at = now();
  return new;
end;
$f$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_tasks_updated_at on public.user_tasks;
create trigger trg_user_tasks_updated_at before update on public.user_tasks
for each row execute function public.set_updated_at();

-- 5. Expiry auto-calc + validation trigger
create or replace function public.tasks_before_insert_update()
returns trigger language plpgsql as $f$
begin
  if new.duration_type = '24h' then
    if tg_op = 'INSERT' then
      new.expiry_date := now() + interval '24 hours';
    end if;
  elsif new.duration_type = 'weekly' then
    if tg_op = 'INSERT' then
      new.expiry_date := now() + interval '7 days';
    end if;
  elsif new.duration_type = 'permanent' then
    new.expiry_date := null;
  elsif new.duration_type = 'custom' then
    if new.expiry_date is null then
      raise exception 'Custom duration_type requires an expiry_date';
    end if;
    if tg_op = 'INSERT' and new.expiry_date < now() then
      raise exception 'Expiry date cannot be in the past';
    end if;
  else
    raise exception 'Invalid duration_type';
  end if;

  if new.reward_coins < 0 then
    raise exception 'Reward coins cannot be negative';
  end if;

  return new;
end;
$f$;

drop trigger if exists trg_tasks_validate on public.tasks;
create trigger trg_tasks_validate before insert or update on public.tasks
for each row execute function public.tasks_before_insert_update();

-- 6. Weekly reset maintenance function (call via cron/edge function)
create or replace function public.reset_weekly_tasks()
returns void language plpgsql security definer as $f$
begin
  update public.user_tasks ut
  set progress = 0, completed = false, claimed = false, completed_at = null, claimed_at = null
  from public.tasks t
  where ut.task_id = t.id
    and t.duration_type = 'weekly'
    and t.expiry_date < now();

  update public.tasks
  set expiry_date = expiry_date + interval '7 days'
  where duration_type = 'weekly' and expiry_date < now();
end;
$f$;

-- 7. RLS
alter table public.tasks enable row level security;
alter table public.user_tasks enable row level security;

drop policy if exists tasks_select_active on public.tasks;
create policy tasks_select_active on public.tasks
for select using (
  status = 'active' and (expiry_date is null or expiry_date >= now())
);

drop policy if exists tasks_admin_all on public.tasks;
create policy tasks_admin_all on public.tasks
for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists user_tasks_select_own on public.user_tasks;
create policy user_tasks_select_own on public.user_tasks
for select using (auth.uid() = user_id);

drop policy if exists user_tasks_admin_select on public.user_tasks;
create policy user_tasks_admin_select on public.user_tasks
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists user_tasks_update_own on public.user_tasks;
create policy user_tasks_update_own on public.user_tasks
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_tasks_insert_own on public.user_tasks;
create policy user_tasks_insert_own on public.user_tasks
for insert with check (auth.uid() = user_id);

-- 8. RPC: get eligible tasks for a user (gender + status + expiry filtered)
create or replace function public.get_client_tasks(p_user_id uuid)
returns table (
  task_id uuid,
  title text,
  description text,
  icon_url text,
  reward_coins integer,
  duration_type text,
  expiry_date timestamptz,
  target_count integer,
  progress integer,
  completed boolean,
  claimed boolean
) language sql stable as $f$
  select
    t.id, t.title, t.description, t.icon_url, t.reward_coins, t.duration_type, t.expiry_date, t.target_count,
    coalesce(ut.progress, 0), coalesce(ut.completed, false), coalesce(ut.claimed, false)
  from public.tasks t
  left join public.user_tasks ut on ut.task_id = t.id and ut.user_id = p_user_id
  left join public.profiles p on p.id = p_user_id
  where t.status = 'active'
    and (t.expiry_date is null or t.expiry_date >= now())
    and (t.target_gender = 'all' or t.target_gender = p.gender)
  order by t.created_at desc;
$f$;

-- 9. RPC: increment progress
create or replace function public.increment_task_progress(p_user_id uuid, p_task_id uuid, p_amount integer default 1)
returns public.user_tasks language plpgsql security definer as $f$
declare
  v_task public.tasks;
  v_row public.user_tasks;
begin
  select * into v_task from public.tasks where id = p_task_id and status = 'active';
  if v_task is null then
    raise exception 'Task not found or inactive';
  end if;
  if v_task.expiry_date is not null and v_task.expiry_date < now() then
    raise exception 'Task expired';
  end if;

  insert into public.user_tasks (user_id, task_id, progress)
  values (p_user_id, p_task_id, p_amount)
  on conflict (user_id, task_id) do update
    set progress = public.user_tasks.progress + p_amount
  returning * into v_row;

  if v_row.progress >= v_task.target_count and not v_row.completed then
    update public.user_tasks
      set completed = true, completed_at = now()
      where id = v_row.id
      returning * into v_row;
  end if;

  return v_row;
end;
$f$;

-- 10. RPC: claim reward (atomic, duplicate-claim safe)
create or replace function public.claim_task_reward(p_user_id uuid, p_task_id uuid)
returns integer language plpgsql security definer as $f$
declare
  v_reward integer;
  v_updated integer;
  v_new_balance integer;
begin
  select reward_coins into v_reward from public.tasks where id = p_task_id;
  if v_reward is null then
    raise exception 'Task not found';
  end if;

  update public.user_tasks
    set claimed = true, claimed_at = now()
    where user_id = p_user_id and task_id = p_task_id
      and completed = true and claimed = false;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Task not completed or reward already claimed';
  end if;

  update public.profiles
    set coins = coins + v_reward
    where id = p_user_id
    returning coins into v_new_balance;

  return v_new_balance;
end;
$f$;

-- 11. Admin RPCs (CRUD)
create or replace function public.admin_create_task(
  p_title text, p_description text, p_icon_url text, p_reward_coins integer,
  p_target_gender text, p_duration_type text, p_expiry_date timestamptz, p_target_count integer default 1
) returns public.tasks language plpgsql security definer as $f$
declare
  v_row public.tasks;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin privileges required';
  end if;

  insert into public.tasks (title, description, icon_url, reward_coins, target_gender, duration_type, expiry_date, target_count)
  values (p_title, p_description, p_icon_url, p_reward_coins, p_target_gender, p_duration_type, p_expiry_date, coalesce(p_target_count,1))
  returning * into v_row;

  return v_row;
end;
$f$;

create or replace function public.admin_update_task(
  p_task_id uuid, p_title text, p_description text, p_icon_url text, p_reward_coins integer,
  p_target_gender text, p_duration_type text, p_expiry_date timestamptz, p_status text, p_target_count integer
) returns public.tasks language plpgsql security definer as $f$
declare
  v_row public.tasks;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin privileges required';
  end if;

  update public.tasks set
    title = coalesce(p_title, title),
    description = coalesce(p_description, description),
    icon_url = coalesce(p_icon_url, icon_url),
    reward_coins = coalesce(p_reward_coins, reward_coins),
    target_gender = coalesce(p_target_gender, target_gender),
    duration_type = coalesce(p_duration_type, duration_type),
    expiry_date = p_expiry_date,
    status = coalesce(p_status, status),
    target_count = coalesce(p_target_count, target_count)
  where id = p_task_id
  returning * into v_row;

  if v_row is null then
    raise exception 'Task not found';
  end if;

  return v_row;
end;
$f$;

create or replace function public.admin_delete_task(p_task_id uuid)
returns void language plpgsql security definer as $f$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin privileges required';
  end if;

  delete from public.tasks where id = p_task_id;
end;
$f$;

create or replace function public.admin_list_tasks()
returns setof public.tasks language sql stable as $f$
  select * from public.tasks order by created_at desc;
$f$;

grant execute on function public.get_client_tasks(uuid) to authenticated, anon;
grant execute on function public.increment_task_progress(uuid, uuid, integer) to authenticated;
grant execute on function public.claim_task_reward(uuid, uuid) to authenticated;
grant execute on function public.reset_weekly_tasks() to service_role;
grant execute on function public.admin_create_task(text, text, text, integer, text, text, timestamptz, integer) to authenticated;
grant execute on function public.admin_update_task(uuid, text, text, text, integer, text, text, timestamptz, text, integer) to authenticated;
grant execute on function public.admin_delete_task(uuid) to authenticated;
grant execute on function public.admin_list_tasks() to authenticated;
