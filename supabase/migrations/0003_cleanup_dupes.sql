-- 0003 — one-shot cleanup of duplicate trainings inserted by the
-- back-button-revival bug (fixed in 0002 + the RoundRoom code change).
--
-- A duplicate is identified by (user_id, started_at, ends_at) appearing more
-- than once: those timestamps are set when the round is first persisted to
-- localStorage and are guaranteed unique per real round (Date.now() + offset).
-- Two trainings sharing all three are necessarily the same logical round
-- replayed by browser-back.
--
-- We keep the *earliest* finished_at as the canonical row and delete the rest.
-- training_problems cascades automatically. profiles.level was set to the same
-- value by both inserts (the API computes newLevel from level_at_start, not
-- the live profile), so no profile fix is needed. upsolve_problems used
-- on-conflict-ignore so duplicates were never inserted there either.
--
-- Run this ONCE in the Supabase SQL editor. Preview first if you're nervous:
--
--   select user_id, started_at, ends_at, count(*) as cnt
--   from trainings
--   group by user_id, started_at, ends_at
--   having count(*) > 1;

with ranked as (
  select id,
         row_number() over (
           partition by user_id, started_at, ends_at
           order by finished_at asc, id asc
         ) as rn
  from trainings
)
delete from trainings
where id in (select id from ranked where rn > 1);
