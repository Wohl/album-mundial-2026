import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Prefer the JWT anon key (compatible with @supabase/supabase-js v2.x).
// The sb_publishable_ format requires SDK v2.60+ to be used as a Bearer token.
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Using offline mode.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export const isOfflineMode = !supabaseUrl || !supabaseKey
