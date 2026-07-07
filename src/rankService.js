// Live rank/RR from vaccie.pythonanywhere.com. The API sends no CORS headers,
// so all requests go through /valo-api (Vite dev proxy + vercel.json rewrite).
// Responses are plain text for StreamElements, e.g. "Immortal 1, RR: 43 (+19)",
// and errors come back as HTTP 200 with prose — parsing decides success.
const BASE = '/valo-api'
const CACHE_KEY = 'vac_rank_cache_v1'
const TTL_MS = 5 * 60 * 1000 // fresh enough to skip the network
const STALE_MAX_MS = 60 * 60 * 1000 // fallback bound when the API keeps failing
const TIMEOUT_MS = 8000
const CONCURRENCY = 4

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

export async function fetchRank(account, { force = false } = {}) {
  const key = keyOf(account)
  const hit = cache[key]
  if (!force && hit && Date.now() - hit.fetchedAt < TTL_MS) return hit

  const region = (account.region || 'ap').toLowerCase()
  const url = `${BASE}/mmr/${encodeURIComponent(account.ign.trim())}/${encodeURIComponent(
    account.tagline.trim()
  )}/${region}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    const parsed = parseRank(await res.text())
    if (parsed) {
      cache[key] = parsed
      saveCacheSoon()
      return parsed
    }
    return usableStale(hit) // unparseable (player not found / API error)
  } catch {
    return usableStale(hit) // network error or timeout
  } finally {
    clearTimeout(timer)
  }
}

// Fetch ranks for many accounts with limited concurrency. `cb(accountId, result)`
// fires as each lookup lands so the UI fills in progressively; cached entries
// resolve instantly. Returns { done, cancel }: `cancel()` stops dequeuing and
// suppresses further callbacks (in-flight fetches still settle into the cache),
// so a re-run for a changed account list can't deliver stale results.
export function fetchRanksFor(accounts, cb, opts) {
  let cancelled = false
  const queue = [...accounts]
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length && !cancelled) {
      const acc = queue.shift()
      const result = await fetchRank(acc, opts)
      if (result && !cancelled) cb(acc.id, result)
    }
  })
  return { done: Promise.all(workers), cancel: () => { cancelled = true } }
}
