import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { henrikRank } from './api/_henrik.js'

// Dev stand-in for the Vercel function api/rank.js — `vite` doesn't run
// Vercel functions, so the same shared helper answers /api/rank here. Keep
// the two entry points thin; all logic lives in api/_henrik.js.
function devRankApi(apiKey) {
  return {
    name: 'dev-rank-api',
    configureServer(server) {
      server.middlewares.use('/api/rank', async (req, res) => {
        const q = new URL(req.url, 'http://localhost').searchParams
        const out = await henrikRank({
          name: q.get('name'),
          tag: q.get('tag'),
          region: q.get('region'),
          apiKey,
        })
        res.statusCode = out.status
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(out.body)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Loads .env without the VITE_ filter: HENRIKDEV_API_KEY is server-side
  // only and must never be exposed to client code via import.meta.env.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), devRankApi(env.HENRIKDEV_API_KEY)],
    server: {
      // Fallback rank API (vaccie.pythonanywhere.com) sends no CORS headers,
      // so the browser can't call it directly. Dev goes through this proxy;
      // production uses the equivalent rewrite in vercel.json. Same /valo-api
      // path both ways.
      proxy: {
        '/valo-api': {
          target: 'https://vaccie.pythonanywhere.com',
          changeOrigin: true,
          rewrite: p => p.replace(/^\/valo-api/, ''),
        },
      },
    },
  }
})
