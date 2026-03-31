import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-navy animate-spin" />
          <p className="text-muted text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
