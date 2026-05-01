# sheista

A personal **ThemeCP** tracker for Codeforces. ThemeCP ([blog by pwned](https://codeforces.com/blog/entry/136704)) is a self-balancing competitive programming ladder: every day you do a 4-problem mock at your current "level" (each level maps to four specific ratings, e.g. level 49 = 1700/1900/2100/2300), all four problems share a common Codeforces tag, and your level moves ±1 based on whether you AK (solve all four).

This app implements the ThemeCP method faithfully and adds:

- **Auto-detect AK** — polls your real CF submissions every 30s during a round and auto-finishes when 4/4 are accepted; no manual marking.
- **Streak counter** — current daily streak + longest, GitHub-style.
- **Calendar heatmap** — 365-day grid of rounds per day.
- **Per-tag mastery** — AK rate and average performance per tag, with "weakest 3" surfaced.
- **Upsolve queue** — failed problems land here automatically; sync with CF to mark them solved.
- **Cross-device** — Supabase backs everything; log in anywhere.

Problem selection has one **hard rule**: a problem you've already solved on Codeforces is never suggested. If no unsolved problem matches your filters at a given rating, the app escalates (drop range → drop tag → tell you to loosen filters) — it never silently substitutes a solved one.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind + shadcn/ui
- Supabase (Postgres + Auth via email magic link)
- SWR for client cache
- Recharts + react-calendar-heatmap

## Setup

See [SETUP.md](./SETUP.md) — ~10 minutes, one external service (Supabase, free).

```bash
npm install
cp .env.local.example .env.local   # paste Supabase URL + anon key
npm run dev
```

## What's where

```
app/                          Next.js routes
  page.tsx                    landing + onboarding
  dashboard/                  level + streak + 90-day heatmap
  training/                   the round flow
  history/                    full list + perf/level charts
  heatmap/                    365-day calendar
  tags/                       per-tag mastery
  upsolve/                    queue of failed problems
  api/cf/                     server proxies for the CF public API (cached)
  api/profile/                upsert profile from CF handle
  api/trainings/              POST one round; GET history
  api/upsolve/                CRUD upsolve queue
  auth/login/                 magic-link form
  auth/callback/              Supabase code exchange

components/                   UI; Trainer.tsx is the core mock
lib/themecp/                  pwned's ThemeCP rules in pure functions
  levels.ts                   load + lookup the 109-row sheet
  tags.ts                     35 official tags
  select-problems.ts          round selector (HARD: never solved)
  performance.ts              the Excel-style perf formula (verbatim port)
  streak.ts                   current/longest from finished_at list
  tag-stats.ts                per-tag AK rate + avg perf
lib/codeforces/               typed CF API wrappers
lib/supabase/                 browser + SSR clients + middleware
public/data/                  level.json (109 rows) + tag.json (35)  — verbatim from pwned
supabase/migrations/          one-shot SQL to set up your DB
types/                        TS types for ThemeCP + DB schema
```

## Credit

- ThemeCP method by [pwned](https://codeforces.com/profile/pwned) — see the [Codeforces blog](https://codeforces.com/blog/entry/136704).
- Reference implementation [C0ldSmi1e/Training-Tracker](https://github.com/C0ldSmi1e/training-tracker) — `level.json`, `tag.json`, the contest-exclusion list, and the performance formula are sourced from there (which mirrors pwned's spreadsheet).
