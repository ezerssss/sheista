-- 0004 — user timezone + daily bites ("one ~15-minute problem" days).
--
-- profiles.timezone: IANA zone used to bucket ALL day-keys (streak, heatmap,
-- daily bites). Server code must never use Date#getDate()-style local math.
--
-- daily_solves: one row per user per local day. Does NOT touch levels or any
-- round stat — trainings remains rounds-only. Streak/heatmap union this table
-- with trainings.finished_at and upsolve_problems.solved_at.

alter table profiles
  add column if not exists timezone text not null default 'UTC';

-- Sole user is in the Philippines; TimezoneSync keeps this fresh thereafter.
update profiles set timezone = 'Asia/Manila';

create table if not exists daily_solves (
  user_id uuid not null references profiles(id) on delete cascade,
  day_key text not null,                -- YYYY-MM-DD in profiles.timezone at solve time
  contest_id int not null,
  problem_index text not null,
  problem_name text not null default '',
  rating int,
  tags text[] not null default '{}',
  source text not null default 'random'
    check (source in ('upsolve', 'weak-tag', 'random')),
  started_at timestamptz not null,
  solved_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day_key)        -- idempotency: max one bite per local day
);

alter table daily_solves enable row level security;

drop policy if exists "self daily read"  on daily_solves;
drop policy if exists "self daily write" on daily_solves;
create policy "self daily read"  on daily_solves for select using (auth.uid() = user_id);
create policy "self daily write" on daily_solves for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);
