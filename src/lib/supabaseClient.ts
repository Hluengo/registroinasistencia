import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/db'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseAuthStorageKey =
  import.meta.env.VITE_SUPABASE_AUTH_STORAGE_KEY ??
  'registroinasistencia-auth-token'

if (!supabaseUrl || !supabasePublicKey) {
  const message =
    'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY for legacy compatibility).'
  throw new Error(message)
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublicKey, {
  auth: {
    storageKey: supabaseAuthStorageKey,
  },
})
