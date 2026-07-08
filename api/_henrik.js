// Shared by the Vercel function (api/rank.js) and the Vite dev middleware
// (vite.config.js) so dev and prod answer /api/rank identically. Output
// mirrors the vaccie prose contract ("Immortal 1, RR: 43") — parseRank in
// src/rankService.js stays the single parser for every rank source, and the
// client can fall back between sources without caring which one answered.
// The leading underscore keeps Vercel from exposing this file as a route.
const HENRIK_BASE = 'https://api.henrikdev.xyz/valorant/v2/mmr'
const UPSTREAM_TIMEOUT_MS = 6000
const REGIONS = new Set(['ap', 'eu', 'na', 'kr'])

export async function henrikRank({ name, tag, region, apiKey }) {
  if (!apiKey) return { status: 503, body: 'HENRIKDEV_API_KEY not configured' }
  const reg = (region || '').toLowerCase()
  if (!name || !tag || !REGIONS.has(reg)) {
    return { status: 400, body: 'Expected ?name=&tag=&region=ap|eu|na|kr' }
  }

  const url = `${HENRIK_BASE}/${reg}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
  let res
  try {
    res = await fetch(url, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch {
    return { status: 502, body: 'HenrikDev unreachable' }
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON error body — handled below */
  }

  // v2 shape: data.current_data.{currenttierpatched, ranking_in_tier};
  // tolerate the v3 shape (data.current.{tier.name, rr}) in case of upgrade.
  const cur = json?.data?.current_data ?? json?.data?.current ?? null
  const label = cur?.currenttierpatched ?? cur?.tier?.name ?? null
  if (!res.ok || !label) {
    const detail =
      json?.errors?.[0]?.message ?? json?.message ?? `HenrikDev HTTP ${res.status}`
    return { status: res.ok ? 502 : res.status, body: String(detail) }
  }

  const rr = cur.ranking_in_tier ?? cur.rr ?? null
  return { status: 200, body: rr != null ? `${label}, RR: ${rr}` : String(label) }
}
