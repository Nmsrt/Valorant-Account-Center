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

**DB schema lives only in README.md** (SQL block under Setup) — there are no migration files. It expects a `unique` constraint on `accounts.username` and a `before update` trigger maintaining `updated_at`. If you change columns, update the README SQL, the insert/update payloads (`buildPayload`), and note the migration SQL for existing tables in the README.
