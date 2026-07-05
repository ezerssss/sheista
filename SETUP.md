# Setup

These are the one-time external steps you have to do yourself (anything tied to your account/credentials). Total time: ~10 minutes.

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up (free tier).
2. Click **New project**. Pick any name (e.g. `sheista`), any region near you, set a database password (any — it's only used for direct DB access, not the app).
3. Wait ~1 minute for it to provision.

## 2. Get your Supabase keys

In the project dashboard:

1. Sidebar → **Project Settings** → **API**.
2. Copy two values:
   - **Project URL** → goes into `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do **not** use the `service_role` key — keep it secret; sheista doesn't need it.

## 3. Create the schema

1. Sidebar → **SQL Editor** → **New query**.
2. Open `supabase/migrations/0001_init.sql` from this repo, paste the entire contents, click **Run**.
3. You should see "Success. No rows returned." That created `profiles`, `trainings`, `training_problems`, `upsolve_problems`, RLS policies, and a trigger that creates a profile row whenever a new auth user signs up.
4. Repeat for each later migration in order: `0002_round_id.sql`, `0003_cleanup_dupes.sql`, `0004_daily_bites.sql` (adds `profiles.timezone` + the `daily_solves` table for daily bites — required, the app selects `profiles.timezone` everywhere).

## 4. Tweak auth (optional but recommended for dev)

For magic links to feel snappy in development:

1. Sidebar → **Authentication** → **Providers** → **Email**.
2. Make sure Email is enabled (default).
3. Optional: turn off **Confirm email** so the first link is also the login (useful in dev; turn it back on for production).
4. Sidebar → **Authentication** → **URL Configuration** → set **Site URL** to `http://localhost:3000` for dev. Also add `http://localhost:3000/auth/callback` to **Redirect URLs**. Add your prod URL the same way when you deploy.

## 5. Wire up the app

In the project root:

```bash
copy .env.local.example .env.local      # PowerShell / cmd
# or:    cp .env.local.example .env.local
```

Edit `.env.local` and paste the two values from step 2:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
```

## 6. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 → click **Get started** → enter your email → click the magic link in your inbox → enter your Codeforces handle → you're on the dashboard.

## What you do **not** need

- ✗ Codeforces API key (their public API is open)
- ✗ A separate backend (Supabase = backend)
- ✗ Vercel/hosting (works on `localhost`; deploy later if you want — `vercel deploy` Just Works)
- ✗ OAuth setup
- ✗ Payment (everything is on free tiers)

## Troubleshooting

**"Codeforces handle not found"** — typo in handle, or CF is rate-limiting. Wait 30s and retry.

**Magic link doesn't redirect back** — check **Site URL** and **Redirect URLs** in Supabase auth settings (step 4).

**"Failed to load problems"** — CF API blip. The `/api/cf/problems` route caches for 1 hour, so first load is slow. Refresh after 30s.

**Auto-detect AK isn't picking up a submission** — CF takes up to ~60s to publish a verdict. The app polls every 30s. Click **Refresh** in the trainer to force a check.
