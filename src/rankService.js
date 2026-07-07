// Live rank/RR from vaccie.pythonanywhere.com. The API sends no CORS headers,
// so all requests go through /valo-api (Vite dev proxy + vercel.json rewrite).
// Responses are plain text for StreamElements, e.g. "Immortal 1, RR: 43 (+19)",
// and errors come back as HTTP 200 with prose — parsing decides success.
const BASE = '/valo-api'
const CACHE_KEY = 'vac_rank_cache_v1'
const TTL_MS = 5 * 60 * 1000
const TIMEOUT_MS = 8000
const CONCURRENCY = 4

export const REGIONS = ['ap', 'eu', 'na', 'kr']

const RANK_RE = /^\s*([A-Za-z]+)(?:\s+(\d))?\s*,\s*RR:\s*(-?\d+)(?:\s*\(([+-]?\d+)\))?/

function parseRank(text) {
  const m = RANK_RE.exec(text)
  if (!m) return null
  const tier = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()
  const division = m[2] ? Number(m[2]) : 0
  return {
    tier,
    division,
    label: division ? `${tier} ${division}` : tier,
    rr: Number(m[3]),
    delta: m[4] != null ? Number(m[4]) : null,
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

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* storage full/blocked — cache stays in-memory only */
  }
}

const keyOf = a => `${a.ign}#${a.tagline}#${a.region || 'ap'}`.trim().toLowerCase()

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
      saveCache()
      return parsed
    }
    return hit || null // unparseable (player not found / API error) — stale cache beats nothing
  } catch {
    return hit || null // network error or timeout
  } finally {
    clearTimeout(timer)
  }
}

// Fetch ranks for many accounts with limited concurrency. `cb(accountId, result)`
// fires as each lookup lands so the UI fills in progressively; cached entries
// resolve instantly. Returns a promise that settles when all lookups finish.
export function fetchRanksFor(accounts, cb, opts) {
  const queue = [...accounts]
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) {
      const acc = queue.shift()
      const result = await fetchRank(acc, opts)
      if (result) cb(acc.id, result)
    }
  })
  return Promise.all(workers)
}
