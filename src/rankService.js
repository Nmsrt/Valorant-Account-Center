// Live rank/RR, two sources in order:
//   1. /api/rank — own endpoint wrapping HenrikDev (Vercel function in prod,
//      Vite middleware in dev; both share api/_henrik.js). Fast, needs
//      HENRIKDEV_API_KEY server-side; without it the endpoint 503s in prose.
//   2. /valo-api — vaccie.pythonanywhere.com fallback (no CORS headers, so it
//      goes through the Vite dev proxy + vercel.json rewrite). Slower.
// Both speak the same plain-text contract, e.g. "Immortal 1, RR: 43 (+19)",
// and errors come back as prose — parseRank deciding success is what lets the
// client fall through sources without caring which one answered.
const OWN_API = '/api/rank'
const BASE = '/valo-api'
const CACHE_KEY = 'vac_rank_cache_v1'
export const TTL_MS = 15 * 60 * 1000 // fresh enough to skip the network; App resweeps just past this
const STALE_MAX_MS = 60 * 60 * 1000 // fallback bound when the API keeps failing
const TIMEOUT_MS = 8000
const CONCURRENCY = 6

export const REGIONS = ['ap', 'eu', 'na', 'kr']

// Canonical tier vocabulary, worst → best; doubles as the sort order.
export const TIERS = ['Unranked','Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant']

// "Immortal 2" → "Immortal"; manual ranks are already plain tiers.
export const tierOf = rank => (rank || '').split(' ')[0]

// RR is optional so a bare "Unrated" (no RR yet) still parses; the tier must
// be in TIERS, which keeps error prose ("Player not found…") failing to parse.
const RANK_RE = /^\s*([A-Za-z]+)(?:\s+(\d))?\s*(?:,\s*RR:\s*(-?\d+))?/

function parseRank(text) {
  const m = RANK_RE.exec(text)
  if (!m) return null
  let tier = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()
  if (tier === 'Unrated') tier = 'Unranked' // API says "Unrated"; app vocabulary is "Unranked"
  if (!TIERS.includes(tier)) return null
  const division = m[2] ? Number(m[2]) : 0
  return {
    tier,
    division,
    label: division ? `${tier} ${division}` : tier,
    rr: m[3] != null ? Number(m[3]) : null,
    fetchedAt: Date.now(),
  }
}

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

const cache = loadCache()

// Batch localStorage writes: a cold load lands dozens of results in a burst,
// and serializing the whole cache per result blocks the main thread.
let saveTimer = null
function saveCacheSoon() {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch {
      /* storage full/blocked — cache stays in-memory only */
    }
  }, 1000)
}

const keyOf = a => `${a.ign}#${a.tagline}#${a.region || 'ap'}`.trim().toLowerCase()

// Stale cache beats nothing when the API fails, but only up to STALE_MAX_MS —
// past that a dead rank is worse than falling back to the manual one.
const usableStale = hit =>
  hit && Date.now() - hit.fetchedAt < STALE_MAX_MS ? hit : null

// One network attempt; resolves to the response text, throws on timeout/error.
async function fetchOnce(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

// In-flight lookups by identity, so overlapping sweeps (the App effect
// re-firing while the previous run is mid-flight) share one request
// instead of hitting the API twice for the same account.
const pending = new Map()

async function refresh(key, account) {
  const hit = cache[key]
  const region = (account.region || 'ap').toLowerCase()
  const name = encodeURIComponent(account.ign.trim())
  const tag = encodeURIComponent(account.tagline.trim())

  // Own endpoint first, vaccie as fallback — a failure of either kind
  // (network/timeout throw, or unparseable prose like "player not found" /
  // "HENRIKDEV_API_KEY not configured") moves on to the next source, so the
  // second source doubles as the retry.
  const sources = [
    `${OWN_API}?name=${name}&tag=${tag}&region=${region}`,
    `${BASE}/mmr/${name}/${tag}/${region}`,
  ]
  for (const url of sources) {
    let text
    try {
      text = await fetchOnce(url)
    } catch {
      continue
    }
    const parsed = parseRank(text)
    if (parsed) {
      cache[key] = parsed
      saveCacheSoon()
      return parsed
    }
  }
  return usableStale(hit)
}

export async function fetchRank(account, { force = false } = {}) {
  const key = keyOf(account)
  const hit = cache[key]
  if (!force && hit && Date.now() - hit.fetchedAt < TTL_MS) return hit
  if (pending.has(key)) return pending.get(key)
  const p = refresh(key, account).finally(() => pending.delete(key))
  pending.set(key, p)
  return p
}

// Fetch ranks for many accounts, stale-while-revalidate. Callback contract:
// `cb(accountId, result|null, revalidating)`. The sync pass delivers every
// cached value at once — fresh entries with revalidating=false (done), stale
// or missing ones with revalidating=true so the UI can show a loading state.
// Entries past TTL then refresh over the network with limited concurrency and
// `cb` fires again with revalidating=false and the outcome (null when nothing
// usable — callers must clear loading state either way). Returns
// { done, cancel }: `cancel()` stops dequeuing and suppresses further
// callbacks (in-flight fetches still settle into the cache), so a re-run for
// a changed account list can't deliver stale results.
export function fetchRanksFor(accounts, cb, opts) {
  let cancelled = false
  const queue = []
  for (const acc of accounts) {
    const hit = cache[keyOf(acc)]
    if (!opts?.force && hit && Date.now() - hit.fetchedAt < TTL_MS) {
      cb(acc.id, hit, false) // fresh — no network needed
      continue
    }
    cb(acc.id, usableStale(hit), true) // paint last known rank (if any) now…
    queue.push(acc) // …and revalidate it in the background
  }
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length && !cancelled) {
      const acc = queue.shift()
      const result = await fetchRank(acc, opts)
      if (!cancelled) cb(acc.id, result, false)
    }
  })
  return { done: Promise.all(workers), cancel: () => { cancelled = true } }
}
