# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # production build (also the closest thing to a "check" — no lint or tests exist)
npm run preview   # serve the build
```

Requires a `.env` (copy `.env.example`) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Without them the app boots into a "missing config" message ([src/supabase.js](src/supabase.js) guards at import time). Restart the dev server after changing `.env`.

## Architecture

Single-page React 18 + Vite app, no router, no state library. One screen (account vault) behind a passcode gate.

**Data flow:** `src/supabase.js` (client singleton) → `src/accountService.js` (all DB access) → `src/App.jsx` (owns all state) → presentational components in `src/components/` (each `Component.jsx` + co-located `Component.css`, plain CSS with vars from `src/index.css`).

**src/accountService.js is the only module that touches the DB.** Conventions it enforces:
- DB columns are snake_case; the app uses camelCase. `fromRow` maps `created_at`/`updated_at` → `createdAt`/`updatedAt` and passes everything else through. New columns flow through automatically — don't add per-field mapping.
- All functions throw `Error` with a user-facing message on failure. Postgres error `23505` (unique violation on `username`) is translated to a friendly duplicate message; a pre-check query gives the same message earlier, but the DB constraint is the real guard.
- `updateAccount`/`deleteAccount` check returned row count and throw "Account not found" on 0 rows (stale id, or RLS silently filtering) — Supabase returns no error in that case.

**Error-handling split in the UI (easy to break):** `handleAdd`/`handleEdit` in `App.jsx` deliberately have no try/catch — the rejection must propagate to `AccountModal`, which catches it and renders the inline `submitError` and resets its `submitting` state. Swallowing errors in App strands the modal. Only `handleDelete` catches in App (toast + refetch). Mutations update `accounts` state locally from the returned row; there is no full-table refetch on success.

**Auth is cosmetic:** `LockScreen.jsx` compares against a hardcoded `PASSCODE` constant and sets `sessionStorage.vac_unlocked`. There is no real auth; the Supabase anon key with an open RLS policy is the actual (non-)security model.

**Live rank/RR pipeline:** `src/rankService.js` tries two sources per account (ign/tagline/region), in order: (1) `/api/rank` — own HenrikDev wrapper, served by the Vercel function `api/rank.js` in prod and by Vite middleware in dev, both thin shells around `api/_henrik.js` (all logic lives there; keep the two entry points dumb). It needs server-side `HENRIKDEV_API_KEY` (**never** `VITE_`-prefixed — that would leak it into the client bundle) and 503s in prose without it. (2) `/valo-api` — vaccie.pythonanywhere.com fallback; it has **no CORS headers**, so never fetch it directly — `vite.config.js` proxies it in dev and `vercel.json` rewrites it in production (keep the two in sync; the SPA catch-all rewrite must keep excluding both `valo-api` and `api`). Both sources return the same plain-text contract ("Immortal 1, RR: 43 (+19)"; errors are prose), so `parseRank` failing is the error signal *and* the source-fallthrough trigger — `api/_henrik.js` must keep emitting that format. Results cache in localStorage (15 min TTL) with stale-while-revalidate: any entry younger than 1 h paints immediately via the callback, expired ones then refresh in the background (in-flight lookups dedupe per identity, one retry on network error). The callback contract is `cb(id, result|null, revalidating)` — a final `revalidating=false` call always fires per queued id (result may be null), which App tracks in `rankPending` to drive the RankBadge `loading` shimmer via `account.liveLoading`; don't restore the old `result && cb(...)` guard or rows shimmer forever. App resweeps every TTL+1 min and on tab-visible (`sweepTick` in the effect deps). `App.jsx` attaches live results as `account.live` — never overwrite the stored `rank` field, because merged rows flow into the edit modal and `rank` round-trips to the DB (overwriting it corrupts the manual fallback). Display uses `live.label ?? rank`; rank filter/sort must go through `displayTier()`/`tierOf()` because live labels carry divisions ("Immortal 2"). The canonical `TIERS`, `REGIONS`, and `tierOf` live in `rankService.js` — import them, don't redeclare. `fetchRanksFor` returns `{ done, cancel }`; the App effect must return `cancel` as cleanup so a stale lookup can't land after an edit.

**DB schema lives only in README.md** (SQL block under Setup) — there are no migration files. It expects a `unique` constraint on `accounts.username` and a `before update` trigger maintaining `updated_at`. If you change columns, update the README SQL, the insert/update payloads (`buildPayload`), and note the migration SQL for existing tables in the README.
