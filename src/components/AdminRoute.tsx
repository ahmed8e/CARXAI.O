import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

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
  const { user, loading, isAdmin, isRoleVerified } = useAuth()
  const location = useLocation()

  // Show spinner while auth is loading or role is being verified
  if (loading || !isRoleVerified) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-navy animate-spin" />
          <p className="text-muted text-sm font-medium">Verifying access…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('[AdminRoute] no user → redirecting to /auth, redirect_target:', location.pathname)
    return <Navigate to="/auth?mode=login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    console.log('[AdminRoute] not admin → redirecting to /dashboard')
    return <Navigate to="/dashboard" replace />
  }

  console.log('[AdminRoute] access granted, final_redirect_destination:', location.pathname)
  return <>{children}</>
}
