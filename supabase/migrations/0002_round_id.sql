-- 0002 — stable client-side round id for idempotent finishes.
--
-- Bug pre-fix: clicking "Finish now" before the timer expired left the
-- ActiveTraining record alive in localStorage. Browser-back / direct URL to
-- /round re-mounted RoundRoom, AK auto-finish fired again, and POST
-- /api/trainings inserted a duplicate row — doubling the entry in history,
-- the level chart, and per-tag stats.
--
-- Fix: each round gets a UUID at creation, persisted alongside the training.
-- The API rejects duplicate (user_id, client_round_id) pairs and returns the
-- existing row, so any retry/re-entry is a no-op on the server.

alter table trainings
  add column if not exists client_round_id uuid;

create unique index if not exists trainings_user_client_round_uniq
  on trainings (user_id, client_round_id)
  where client_round_id is not null;
