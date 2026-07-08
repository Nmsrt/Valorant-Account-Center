// GET /api/rank?name=<ign>&tag=<tagline>&region=<ap|eu|na|kr>
// First-choice rank source: wraps HenrikDev with the key kept server-side.
// Plain-text response in the same format as the vaccie fallback.
import { henrikRank } from './_henrik.js'

export default async function handler(req, res) {
  const { name, tag, region } = req.query
  const out = await henrikRank({
    name,
    tag,
    region,
    apiKey: process.env.HENRIKDEV_API_KEY,
  })
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  // Successful lookups cache at the Vercel edge per URL; errors must not stick.
  res.setHeader(
    'Cache-Control',
    out.status === 200 ? 's-maxage=300, stale-while-revalidate=600' : 'no-store'
  )
  res.status(out.status).send(out.body)
}
