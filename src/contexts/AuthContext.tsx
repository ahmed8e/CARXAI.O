import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string, remember?: boolean) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any, error: Error | null }>
  signOut: () => Promise<void>
  signOutAll: () => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateProfile: (updates: { fullName?: string, phoneNumber?: string, preferredLanguage?: string, city?: string, latitude?: number, longitude?: number, location_timestamp?: number }) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  isAdmin: boolean
  isRoleVerified: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRoleVerified, setIsRoleVerified] = useState(false)

  const checkAdminStatus = async (user: User | null) => {
    if (!user) {
      setIsAdmin(false)
      setIsRoleVerified(true)
      return
    }

    // First check local metadata
    const role = user.user_metadata?.role ?? user.app_metadata?.role ?? null
    if (role === 'admin') {
      setIsAdmin(true)
      setIsRoleVerified(true)
      return
    }

    // Role verification: Admin state is primarily driven by metadata for performance and avoiding loops.
    // If a manual refresh is needed, it should be triggered by specific user actions, not on every event.
    setIsAdmin(role === 'admin')
    setIsRoleVerified(true)
  }

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const u = session?.user ?? null
      setUser(u)
      checkAdminStatus(u).then(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      const u = session?.user ?? null
      setUser(u)
      
      // Re-verify on sign-in or session update
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        setIsRoleVerified(false)
        checkAdminStatus(u).then(() => setLoading(false))
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false)
        setIsRoleVerified(true)
        setLoading(false)
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string, remember: boolean = false) => {
    if (remember) {
      localStorage.setItem('supabase.auth.remember', 'true')
    } else {
      localStorage.removeItem('supabase.auth.remember')
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) console.error('Sign-in error:', error)
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          subscription_status: 'trialing',
          trial_started_at: now.toISOString(),
          trial_ends_at: threeDaysLater.toISOString(),
          plan: 'Pro',
          is_paid_user: false
        }
      }
    })
    
    if (!error && data.user) {
      try {
        const { error: profileError } = await (supabase as any).from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
        })
        if (profileError) console.error('Profile creation error:', profileError)
      } catch (err) {
        console.error('Unexpected profile error:', err)
      }
    }
    
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    return { error }
  }

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updateProfile = async (updates: { fullName?: string, phoneNumber?: string, preferredLanguage?: string, city?: string, latitude?: number, longitude?: number, location_timestamp?: number }) => {
    if (!user) return { error: new Error('User not logged in') }

    // 1. Update Auth Metadata (for immediate UI response using user_metadata)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: updates.fullName,
        phone_number: updates.phoneNumber,
        preferred_language: updates.preferredLanguage,
        city: updates.city,
        latitude: updates.latitude,
        longitude: updates.longitude,
        location_timestamp: updates.location_timestamp
      }
    })

    if (authError) return { error: authError }

    // 2. Update Profiles table (only valid columns)
    const { error: dbError } = await (supabase as any)
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: updates.fullName || null,
        email: user.email || '',
        city: updates.city,
        latitude: updates.latitude,
        longitude: updates.longitude,
        location_timestamp: updates.location_timestamp,
      })

    if (dbError) {
      console.error('Database Profile Error:', dbError);
      return { error: new Error(`Database Error: ${dbError.message || dbError.details || 'Unknown error'}`) };
    }

    // 3. Update User Settings table
    const { error: settingsError } = await (supabase as any)
      .from('user_settings')
      .upsert({
        user_id: user.id,
        preferred_language: updates.preferredLanguage || 'en',
        phone_number: updates.phoneNumber || null
      })

    if (settingsError) {
      console.error('Database Settings Error:', settingsError);
      return { error: new Error(`Settings Error: ${settingsError.message || settingsError.details || 'Unknown error'}`) };
    }
    
    return { error: null }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, isAdmin, isRoleVerified,
      signIn, signUp, signOut, signOutAll, signInWithOAuth,
      resetPassword, updateProfile, updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
