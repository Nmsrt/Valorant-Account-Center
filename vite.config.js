import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // The rank API (vaccie.pythonanywhere.com) sends no CORS headers, so the
    // browser can't call it directly. Dev goes through this proxy; production
    // uses the equivalent rewrite in vercel.json. Same /valo-api path both ways.
    proxy: {
      '/valo-api': {
        target: 'https://vaccie.pythonanywhere.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/valo-api/, ''),
      },
    },
  },
})
