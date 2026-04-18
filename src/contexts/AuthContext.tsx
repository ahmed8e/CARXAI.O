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

  const updateProfile = async (updates: { 
    fullName?: string, 
    phoneNumber?: string, 
    preferredLanguage?: string, 
    city?: string, 
    latitude?: number, 
    longitude?: number, 
    location_timestamp?: number 
  }) => {
    if (!user) return { error: new Error('User not logged in') }

    try {
      // 1. One canonical upsert to profiles table
      // Note: We use type casting as any to avoid TS errors if the schema cache is stale
      const { error: dbError } = await (supabase as any)
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          full_name: updates.fullName,
          city: updates.city,
          latitude: updates.latitude,
          longitude: updates.longitude,
          location_timestamp: updates.location_timestamp,
          phone_number: updates.phoneNumber,
          preferred_language: updates.preferredLanguage,
        }, { onConflict: 'id' })

      if (dbError) {
        console.error('[AuthContext] Profile Update Error:', dbError)
        return { error: dbError }
      }

      return { error: null }
    } catch (error: any) {
      console.error('[AuthContext] Unexpected Error:', error)
      return { error }
    }
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
