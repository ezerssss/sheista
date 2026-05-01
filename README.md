# sheista

A personal **ThemeCP** tracker for Codeforces. ThemeCP ([blog by pwned](https://codeforces.com/blog/entry/136704)) is a self-balancing competitive programming ladder: every day you do a 4-problem mock at your current "level" (each level maps to four specific ratings, e.g. level 49 = 1700/1900/2100/2300), all four problems share a common Codeforces tag, and your level moves ±1 based on whether you AK (solve all four).

This app implements the ThemeCP method faithfully and adds:

- **Auto-detect AK** — polls your real CF submissions every 30s during a round and auto-finishes when 4/4 are accepted; no manual marking.
- **Streak counter** — current daily streak + longest, GitHub-style.
- **Calendar heatmap** — 365-day grid of rounds per day.
- **Per-tag mastery** — AK rate and average performance per tag, with "weakest 3" surfaced.
- **Upsolve queue** — failed problems land here automatically; sync with CF to mark them solved.
- **Cross-device** — Supabase backs everything; log in anywhere.
- **Pet chicken** — a Stardew-style pixel-art chicken roams the page bottom, perches on top of high-value buttons, paces while it sits there, and reacts to your state (nudges if today's round isn't done, gets urgent near midnight if your streak is on the line, focuses during a round, sleeps when you've been gone). Click to pat, right-click to mute or hide.
- **Shareable progress card** — one-click PNG export sized for Instagram / FB stories / WhatsApp status (9:16), square posts (1:1), or wide cards (16:9). Three templates: daily recap, streak, level up.
- **Level-up celebration / level-down overlay** — a full-screen modal fires when your level changes after a round. Level-up shows the chicken celebrating + a share button; level-down shows the chicken disappointed + no share, just back-to-grind.

Problem selection has one **hard rule**: a problem you've already solved on Codeforces is never suggested. If no unsolved problem matches your filters at a given rating, the app escalates (drop range → drop tag → tell you to loosen filters) — it never silently substitutes a solved one.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind + shadcn/ui
- Supabase (Postgres + Auth via email magic link)
- SWR for client cache
- Recharts + react-calendar-heatmap
- html-to-image for the share-card PNG export
- Pet sprite is hand-rolled SVG `<rect>` pixel art (no asset pipeline)

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
  layout.tsx                  mounts NavBar + PetCompanion + LevelChangeOverlay + PreviewPanel
  icon.svg                    chicken sprite — auto-wired as the favicon
  dashboard/                  level + streak + 90-day heatmap + share button
  training/                   the round flow
  round/                      live round room (auto-detect AK, dispatches training-finished)
  history/                    full list + perf/level charts
  heatmap/                    365-day calendar
  tags/                       per-tag mastery
  upsolve/                    queue of failed problems
  about/                      credits + inspiration
  api/cf/                     server proxies for the CF public API (cached)
  api/profile/                upsert profile from CF handle
  api/trainings/              POST one round; GET history
  api/upsolve/                CRUD upsolve queue
  api/pet/state/              consolidated user-state endpoint that drives the pet
  auth/login/                 magic-link form
  auth/callback/              Supabase code exchange

components/                   UI; Trainer.tsx is the core mock
  pet/                        chicken sprite + companion + bubble + menu
    PetSprite.tsx             16x16 SVG-rect pixel art, walk-cycle frames, mood eye overrides
    PetCompanion.tsx          roaming behavior: rAF movement, perch detection, mood resolution
    PetBubble.tsx             speech bubble with bubble-in animation
    PetMenu.tsx               long-press popover (mute / hide for session)
  share/                      one-click PNG export of progress
    ShareButton.tsx           dashboard entry point; auto-opens via ?share=<template>
    ShareDialog.tsx           Radix Dialog, template + format tabs, download/copy/share actions
    ShareCard.tsx             routes to one of the templates at full export resolution
    templates/                CardFrame + DailyRecap / Streak / LevelUp templates
  LevelChangeOverlay.tsx      full-screen celebrate/disappointed modal on level change
  dev/PreviewPanel.tsx        dev-only buttons that fire training-finished events for previews

lib/themecp/                  pwned's ThemeCP rules in pure functions
  levels.ts                   load + lookup the 109-row sheet
  tags.ts                     35 official tags
  select-problems.ts          round selector (HARD: never solved)
  performance.ts              the Excel-style perf formula (verbatim port)
  streak.ts                   current/longest from finished_at list
  tag-stats.ts                per-tag AK rate + avg perf
  user-stats.ts               shared Supabase query helper (dashboard + pet API)
  active-training.ts          localStorage helpers for in-progress rounds
lib/pet/                      pet client logic
  types.ts                    PetStatePayload + MoodId
  events.ts                   typed window event bus (sheista:training-finished)
  personality.ts              getMood() + message bank (per mood, anti-repeat picker) + share milestone detection
lib/share/                    html-to-image wrapper (download / copy / native share)
lib/codeforces/               typed CF API wrappers
lib/supabase/                 browser + SSR clients + middleware
hooks/usePetState.ts          SWR hook over /api/pet/state
public/data/                  level.json (109 rows) + tag.json (35)  — verbatim from pwned
supabase/migrations/          one-shot SQL to set up your DB
types/                        TS types for ThemeCP + DB schema
```

### Previewing the chicken + level overlay locally

A dev-only panel sits in the top-left of every page (visible when `NODE_ENV=development`, or any environment when you append `?dev=1` to the URL). It fires fake `training-finished` events so you can see:

- ↑ level up (AK) — overlay celebration + share button + chicken celebrating
- ↓ level down — disappointed overlay + chicken slumped + no share
- 🏆 AK at max level — chicken celebrates, no overlay (level didn't change)
- ⚡ milestone level — share-suggestion variant
- 😞 miss at min level — disappointed chicken, no overlay

## Credit

- ThemeCP method by [pwned](https://codeforces.com/profile/pwned) — see the [Codeforces blog](https://codeforces.com/blog/entry/136704).
- Reference implementation [C0ldSmi1e/Training-Tracker](https://github.com/C0ldSmi1e/training-tracker) — `level.json`, `tag.json`, the contest-exclusion list, and the performance formula are sourced from there (which mirrors pwned's spreadsheet).
- The pet chicken's vibe is a love letter to the coops in [Stardew Valley](https://www.stardewvalley.net/) by [ConcernedApe](https://twitter.com/ConcernedApe). Pixel art is original to sheista; no SDV assets are used.
