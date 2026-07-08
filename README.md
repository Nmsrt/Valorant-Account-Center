# V.A.C. — Valorant Account Center

A Valorant account manager built with **React + Vite** and **Supabase**.

## Features
- Add / Edit / Delete accounts (stored in Supabase)
- Copy username & password to clipboard with one click
- Toggle password visibility per row
- Search across IGN, tagline, username
- Filter by rank
- Sortable columns
- Color-coded rank badges (Iron → Radiant)
- Toast notifications

---

## Setup

### 1. Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Once ready, open the **SQL Editor** and run the schema below
4. Go to **Project Settings** → **API** to get your **Project URL** and **anon public** key

#### Schema

```sql
create table accounts (
  id          uuid primary key default gen_random_uuid(),
  ign         text not null,
  tagline     text not null,
  username    text not null unique,
  password    text not null,
  rank        text,           -- manual fallback; live rank comes from the rank API
  region      text not null default 'ap',  -- ap | eu | na | kr, for rank lookups
  verified    boolean not null default false,
  notes       text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at accurate no matter which client writes.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger accounts_set_updated_at
  before update on accounts
  for each row execute function set_updated_at();

-- Row Level Security: open policy — anyone with the anon key can
-- read/write every row. Tighten this before any real deployment.
alter table accounts enable row level security;

create policy "public access" on accounts
  for all using (true) with check (true);
```

> **Already created the table without the `unique` constraint, `region` column, or trigger?** Run:
> ```sql
> alter table accounts add constraint accounts_username_key unique (username);
> alter table accounts add column region text not null default 'ap';
> ```
> then the `create or replace function` / `create trigger` statements above.

---

## Live Rank & RR

Rank and RR are fetched automatically using each account's IGN, tagline, and region — the manual **Rank** field is only a fallback when every lookup fails (renamed account, APIs down, unranked).

Two sources, tried in order:

1. **`/api/rank`** — this repo's own endpoint ([api/rank.js](api/rank.js), a Vercel serverless function; in dev the same logic runs as Vite middleware). It wraps the [HenrikDev API](https://docs.henrikdev.xyz) with your `HENRIKDEV_API_KEY` kept server-side. Fast (~0.3&nbsp;s) and cached at the Vercel edge for 5 minutes.
2. **`/valo-api`** — [API Valorant](https://vaccie.pythonanywhere.com/) (`/mmr/{ign}/{tag}/{region}`) as fallback. It sends no CORS headers, so requests are proxied by Vite in dev (`vite.config.js`) and by a rewrite on Vercel (`vercel.json`). Slower (~1–2&nbsp;s), no key needed.

Without a `HENRIKDEV_API_KEY` the first source politely fails and everything runs off the fallback — the app works either way.

- Lookups run in the background after the table renders and fill in progressively (6 at a time); a pulsing rank badge means a lookup for that row is in flight.
- Results are cached in `localStorage` for 15 minutes and refreshed automatically while the tab is open — reloads show the last known rank immediately and revalidate silently.

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Fill in your Supabase values in .env
```

### 3. Install & Run

```bash
npm install
npm run dev
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on https://vercel.com
3. Add all environment variables from `.env` in Vercel's project settings
4. Deploy — done!

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) API key |
| `HENRIKDEV_API_KEY` | *(optional)* HenrikDev key for the fast rank source; server-side only (no `VITE_` prefix — it must never reach the browser). Get one free via the [HenrikDev Discord](https://docs.henrikdev.xyz). Add it in Vercel's project settings too. |

> **Never commit your `.env` file.** It is already in `.gitignore`.
