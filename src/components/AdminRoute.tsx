import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, ShieldOff } from 'lucide-react'

/**
 * Checks whether the current user has admin access.
 * Set role via Supabase SQL:
 *   UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
 *   WHERE email = 'your@email.com';
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false
  return (
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin'
  )
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-navy animate-spin" />
          <p className="text-muted text-sm font-medium">Checking access…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" state={{ from: location }} replace />
  }

  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-surface-low flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-on-surface mb-2">Access Restricted</h2>
            <p className="text-sm text-muted">You do not have admin privileges to view this page.</p>
          </div>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
