import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/db'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const message =
    'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  throw new Error(message)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
