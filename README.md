# V.A.C. — Valorant Account Center

A Valorant account manager built with **React + Vite** and **Firebase Firestore**.

## Features
- Add / Edit / Delete accounts (stored in Firestore)
- Copy username & password to clipboard with one click
- Toggle password visibility per row
- Search across IGN, tagline, username
- Filter by rank
- Sortable columns
- Color-coded rank badges (Iron → Radiant)
- Toast notifications

---

## Setup

### 1. Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Go to **Firestore Database** → **Create database** (Start in test mode)
4. Go to **Project Settings** → **Your apps** → click the **Web** icon (`</>`)
5. Copy the `firebaseConfig` values

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Fill in your Firebase values in .env
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
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

> **Never commit your `.env` file.** It is already in `.gitignore`.
