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
  username    text not null,
  password    text not null,
  rank        text,
  verified    boolean not null default false,
  notes       text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security: open policy (matches the previous Firestore rules).
-- Tighten this before any real deployment.
alter table accounts enable row level security;

create policy "public access" on accounts
  for all using (true) with check (true);
```

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

> **Never commit your `.env` file.** It is already in `.gitignore`.
