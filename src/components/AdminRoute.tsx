import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, ShieldOff } from 'lucide-react'

/**
 * Checks whether a user object has admin access.
 * Supabase stores raw_user_meta_data as user.user_metadata on the client.
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false
  const role =
    user.user_metadata?.role ??
    user.app_metadata?.role ??
    null
  console.log('[AdminRoute] role check →', {
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata,
    detected_role: role,
    is_admin: role === 'admin',
  })
  return role === 'admin'
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [refreshed, setRefreshed] = useState(false)
  const [freshUser, setFreshUser] = useState<any>(null)

  /**
   * Force a session refresh so that Supabase re-reads raw_user_meta_data
   * from the server. Without this, metadata updates made via SQL won't be
   * visible until the user signs out and back in.
   */
  useEffect(() => {
    if (!user) { setRefreshed(true); return }

    supabase.auth.refreshSession().then(({ data }) => {
      const u = data?.user ?? user
      setFreshUser(u)
      setRefreshed(true)
    }).catch(() => {
      // refresh failed — fall back to cached user
      setFreshUser(user)
      setRefreshed(true)
    })
  }, [user])

  // Show spinner while auth is loading or session is being refreshed
  if (loading || !refreshed) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-navy animate-spin" />
          <p className="text-muted text-sm font-medium">Verifying access…</p>
        </div>
      </div>
    )
  }

  if (!freshUser) {
    return <Navigate to="/auth?mode=login" state={{ from: location }} replace />
  }

  if (!isAdminUser(freshUser)) {
    // ← Fix: Navigate must be the sole rendered element to actually redirect
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
