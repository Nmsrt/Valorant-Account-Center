import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    'Missing Supabase config: copy .env.example to .env, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
  const root = document.getElementById('root')
  if (root) root.innerText = msg
  throw new Error(msg)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
