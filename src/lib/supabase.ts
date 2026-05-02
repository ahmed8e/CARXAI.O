import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Coolify Production Environment Variables.')
}

// Custom storage to handle "Remember Me"
// If 'supabase.auth.remember' is true in localStorage, we use localStorage
// Otherwise we use sessionStorage for the current session only
const customStorage = {
  getItem: (key: string) => {
    const remember = localStorage.getItem('supabase.auth.remember') === 'true'
    if (remember) {
      return localStorage.getItem(key)
    }
    return sessionStorage.getItem(key) || localStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    const remember = localStorage.getItem('supabase.auth.remember') === 'true'
    if (remember) {
      localStorage.setItem(key, value)
    } else {
      sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
