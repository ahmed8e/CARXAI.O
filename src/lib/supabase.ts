import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = "https://heutxojrzwllempjqanv.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldXR4b2pyendsbGVtcGpxYW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTM5NjEsImV4cCI6MjA4OTYyOTk2MX0.sbPlvJTcvL5aBXj3ZxXm9ro68wXLiQodbKFcf2XqGXA"

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
