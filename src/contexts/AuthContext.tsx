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
  updateProfile: (updates: { fullName?: string, phoneNumber?: string, preferredLanguage?: string }) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
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
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    
    if (!error && data.user) {
      try {
        const { error: profileError } = await supabase.from('profiles').upsert({
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

  const updateProfile = async (updates: { fullName?: string, phoneNumber?: string, preferredLanguage?: string }) => {
    if (!user) return { error: new Error('User not logged in') }

    // 1. Update Auth Metadata (for immediate UI response using user_metadata)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: updates.fullName,
        phone_number: updates.phoneNumber,
        preferred_language: updates.preferredLanguage
      }
    })

    if (authError) return { error: authError }

    // 2. Update/Upsert into Profiles table
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: updates.fullName,
        phone_number: updates.phoneNumber,
        preferred_language: updates.preferredLanguage,
        email: user.email // Ensure email is present
      })
    
    return { error: dbError }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, signOutAll, signInWithOAuth, resetPassword, updateProfile, updatePassword }}>
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
