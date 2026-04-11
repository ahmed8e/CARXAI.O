import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Users, AlertCircle, RefreshCw } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  created_at: string
  subscription?: {
    status: string
    plan_name: string
    billing_cycle: string | null
  } | null
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-[10px] font-bold text-muted uppercase tracking-widest border border-overlay px-2 py-0.5 rounded-full bg-surface-low">No Plan</span>
  const map: Record<string, string> = {
    trialing: 'text-amber-600 bg-amber-50 border-amber-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    cancelled: 'text-red-600 bg-red-50 border-red-100',
    expired: 'text-orange-600 bg-orange-50 border-orange-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${map[status] ?? 'text-muted bg-surface-low border-overlay'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select(`
          id, email, full_name, created_at,
          subscription:subscriptions!fk_subscriptions_user_profile (
            status,
            plan_name,
            billing_cycle
          )
        `)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      const normalized = (data ?? []).map((p: any) => ({
        ...p,
        subscription: Array.isArray(p.subscription) ? (p.subscription[0] ?? null) : (p.subscription ?? null),
      }))
      setProfiles(normalized)
    } catch (e: any) {
      console.error('[AdminUsers] Load failed:', e)
      setError(e.message ?? 'Failed to load users')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRefresh = () => { setRefreshing(true); load() }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Users Management</h1>
          <p className="text-sm text-muted mt-0.5">Manage all registered users and their profile data</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-overlay text-sm font-bold text-muted hover:border-navy/20 hover:text-navy transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-navy' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error} — Ensure profiles sync trigger is active.</p>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-overlay p-5">
           <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center mb-3">
             <Users className="w-4.5 h-4.5 text-navy" />
           </div>
           <p className="text-2xl font-display font-black text-on-surface">{profiles.length}</p>
           <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total Registered Users</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-overlay overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-surface-low rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-overlay bg-surface-low/30 text-[10px] font-black uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-5 py-3.5 text-left">User Profile</th>
                  <th className="px-5 py-3.5 text-left">Subscription</th>
                  <th className="px-5 py-3.5 text-left">Joined</th>
                  <th className="px-5 py-3.5 text-left">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-overlay">
                {profiles.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-sm text-muted italic">No users found.</td></tr>
                ) : profiles.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                    className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy/70 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {p.email[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate max-w-[200px]">{p.full_name || 'No Name'}</p>
                          <p className="text-xs text-muted truncate max-w-[200px]">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={p.subscription?.status} />
                        {p.subscription?.plan_name && (
                           <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                             {p.subscription.plan_name} — {p.subscription.billing_cycle || 'manual'}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-muted">
                       {new Date(p.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                       <code className="text-[10px] p-1 bg-surface-low rounded border border-overlay text-muted font-mono">{p.id.slice(0, 8)}...</code>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
