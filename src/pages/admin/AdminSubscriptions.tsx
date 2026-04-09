import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Users, Search, CreditCard, Calendar, Clock, AlertCircle } from 'lucide-react'

type FilterKey = 'all' | 'trialing' | 'active' | 'canceled' | 'past_due'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  created_at: string
  subscription?: {
    status: string
    plan: string
    trial_ends_at: string | null
    current_period_end: string | null
    billing_interval: string | null
  } | null
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    trialing: 'text-amber-600 bg-amber-50 border-amber-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    canceled: 'text-red-600 bg-red-50 border-red-100',
    past_due: 'text-orange-600 bg-orange-50 border-orange-200',
    unknown: 'text-muted bg-surface-low border-overlay',
  }
  const label = status || 'unknown'
  const cls = map[label] ?? 'text-muted bg-surface-low border-overlay'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>
      {label.replace('_', ' ')}
    </span>
  )
}

function TrialCountdown({ endsAt }: { endsAt: string | null }) {
  if (!endsAt) return <span className="text-xs text-muted">—</span>
  const ms = new Date(endsAt).getTime() - Date.now()
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
  if (days < 0) return <span className="text-xs text-red-500 font-bold">Expired</span>
  if (days === 0) return <span className="text-xs text-orange-500 font-bold">Today</span>
  return <span className="text-xs text-amber-600 font-bold">{days}d left</span>
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch profiles with their subscription joined
        const { data, error: fetchErr } = await (supabase as any)
          .from('profiles')
          .select(`
            id, email, full_name, created_at,
            subscription:subscriptions ( status, plan, trial_ends_at, current_period_end, billing_interval )
          `)
          .order('created_at', { ascending: false })

        if (fetchErr) {
          // Graceful fallback: if join fails (table not yet created), fetch profiles only
          console.warn('[AdminUsers] subscription join failed, falling back:', fetchErr.message)
          const { data: plain } = await supabase
            .from('profiles')
            .select('id, email, full_name, created_at')
            .order('created_at', { ascending: false })
          setUsers((plain ?? []).map((u: any) => ({ ...u, subscription: null })))
        } else {
          // Supabase returns subscription as array from !inner; normalize to single object
          const normalized = (data ?? []).map((u: any) => ({
            ...u,
            subscription: Array.isArray(u.subscription) ? (u.subscription[0] ?? null) : (u.subscription ?? null),
          }))
          setUsers(normalized)
        }
      } catch (e: any) {
        setError('Failed to load users. Check Supabase admin RLS policies.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const status = u.subscription?.status ?? 'trialing'
    const matchFilter = filter === 'all' || status === filter
    return matchSearch && matchFilter
  })

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `All (${users.length})` },
    { key: 'trialing', label: `Trial (${users.filter(u => (u.subscription?.status ?? 'trialing') === 'trialing').length})` },
    { key: 'active', label: `Active (${users.filter(u => u.subscription?.status === 'active').length})` },
    { key: 'canceled', label: `Canceled (${users.filter(u => u.subscription?.status === 'canceled').length})` },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Users</h1>
        <p className="text-sm text-muted mt-0.5">
          {loading ? 'Loading…' : `${users.length} registered user${users.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Could not load users</p>
            <p className="text-xs text-red-600 mt-0.5">{error} — Run <code className="font-mono bg-red-100 px-1 rounded">admin-migrations.sql</code> in Supabase to fix.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-overlay rounded-xl text-sm text-on-surface focus:border-navy/30 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${
                filter === t.key
                  ? 'bg-navy text-white border-navy shadow-sm shadow-navy/20'
                  : 'bg-white text-muted border-overlay hover:border-navy/20 hover:text-navy'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-overlay overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-low rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-overlay">
                <tr>
                  {['User', 'Signed Up', 'Plan', 'Status', 'Trial Ends'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-overlay">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12">
                    <Users className="w-8 h-8 text-muted/20 mx-auto mb-2" />
                    <p className="text-sm text-muted">
                      {users.length === 0 ? 'No users yet — run admin-migrations.sql to fix RLS.' : 'No users match your filters'}
                    </p>
                  </td></tr>
                ) : filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-surface-low/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy/20 to-navy/10 flex items-center justify-center text-navy text-xs font-black shrink-0">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{user.full_name || '—'}</p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-on-surface">
                        <Calendar className="w-3.5 h-3.5 text-muted/50" />
                        {new Date(user.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-muted/50" />
                        <span className="text-sm text-on-surface">{user.subscription?.plan ?? 'Pro'}</span>
                        {user.subscription?.billing_interval && (
                          <span className="text-[9px] font-bold text-muted/60 uppercase">{user.subscription.billing_interval}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={user.subscription?.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-muted/40" />
                        <TrialCountdown endsAt={user.subscription?.trial_ends_at ?? null} />
                      </div>
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
