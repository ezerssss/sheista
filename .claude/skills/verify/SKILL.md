---
name: verify
description: How to build, run, and drive sheista to verify changes end-to-end
---

# Verifying sheista changes

## Build / typecheck

```bash
npx tsc --noEmit      # fast gate
npm run build         # full production build
# `npm run lint` is NOT set up (next lint prompts interactively) — skip it.
```

## Run + drive

```bash
npm run dev           # http://localhost:3000
```

- Most of the app is auth-gated (Supabase login). Headless verification
  without credentials is limited to the landing page and the dev panel.
- **Dev panel**: mounts on every page when `NODE_ENV=development` or with
  `?dev=1`. It fires training-finished events and hosts the **pet lab**
  (PetSprite action × mood stage with dust/feather effect buttons) —
  the best surface for verifying chicken sprite/animation changes
  without logging in.
- The roaming `PetCompanion` (locomotion, perching, shadow) renders only
  for authenticated users — needs a real login to observe.

## Headless browser

No Playwright in the repo. Install `playwright-core` in the session
scratchpad and use the system Edge — no browser download needed:

```js
import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
```

Dev panel selector: `div.fixed.left-4.top-20`; the pet sprite inside it:
`[aria-label^="pet chicken"]`. Compare successive element screenshots to
verify animation frames advance (walk alternates every 180ms; idle
peck/flap kicks in 5–10s after standing still; blink is a 140ms blip).

## Gotchas

- PetSprite frames are ASCII grids validated at module load in dev — a
  malformed frame throws on first page load, so "page renders with zero
  console errors" already covers frame integrity.
- Share-PNG capture (`html-to-image`) runs from the dashboard share
  dialog — auth required; verify manually after login.
