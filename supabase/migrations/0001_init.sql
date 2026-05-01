-- sheista — ThemeCP tracker initial schema.
-- Run in Supabase Dashboard → SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  cf_handle text unique,
  cf_rating int,
  cf_avatar text,
  level int not null default 1 check (level between 1 and 109),
  updated_at timestamptz not null default now()
);

create table if not exists trainings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  level_at_start int not null,
  level_at_end int not null,
  is_ak boolean not null,
  performance int not null,
  tag_filter text[] not null default '{}',
  started_at timestamptz not null,
  ends_at timestamptz not null,
  finished_at timestamptz not null default now()
);

create table if not exists training_problems (
  training_id uuid not null references trainings(id) on delete cascade,
  slot smallint not null check (slot between 1 and 4),
  contest_id int not null,
  problem_index text not null,
  problem_name text not null default '',
  rating int not null,
  tags text[] not null default '{}',
  solved_at timestamptz,
  primary key (training_id, slot)
);

create table if not exists upsolve_problems (
  user_id uuid not null references profiles(id) on delete cascade,
  contest_id int not null,
  problem_index text not null,
  problem_name text not null default '',
  rating int,
  tags text[] not null default '{}',
  added_at timestamptz not null default now(),
  solved_at timestamptz,
  primary key (user_id, contest_id, problem_index)
);

create index if not exists trainings_user_started_idx on trainings(user_id, started_at desc);
create index if not exists trainings_user_finished_idx on trainings(user_id, finished_at desc);

-- Row level security: every user only sees their own rows.
alter table profiles enable row level security;
alter table trainings enable row level security;
alter table training_problems enable row level security;
alter table upsolve_problems enable row level security;

drop policy if exists "self read"  on profiles;
drop policy if exists "self write" on profiles;
create policy "self read"  on profiles for select using (auth.uid() = id);
create policy "self write" on profiles for all    using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "self trainings read"  on trainings;
drop policy if exists "self trainings write" on trainings;
create policy "self trainings read"  on trainings for select using (auth.uid() = user_id);
create policy "self trainings write" on trainings for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "self tp read"  on training_problems;
drop policy if exists "self tp write" on training_problems;
create policy "self tp read"  on training_problems for select
  using (exists (select 1 from trainings t where t.id = training_id and t.user_id = auth.uid()));
create policy "self tp write" on training_problems for all
  using (exists (select 1 from trainings t where t.id = training_id and t.user_id = auth.uid()))
  with check (exists (select 1 from trainings t where t.id = training_id and t.user_id = auth.uid()));

drop policy if exists "self upsolve read"  on upsolve_problems;
drop policy if exists "self upsolve write" on upsolve_problems;
create policy "self upsolve read"  on upsolve_problems for select using (auth.uid() = user_id);
create policy "self upsolve write" on upsolve_problems for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profiles row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, level)
  values (new.id, 1)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
