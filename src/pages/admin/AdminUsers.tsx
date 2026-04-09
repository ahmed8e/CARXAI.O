import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { CreditCard, Users, TrendingDown, Clock, Info, AlertCircle, RefreshCw } from 'lucide-react'

interface SubscriptionRow {
  id: string
  user_id: string
  email: string | null
  status: string
  plan: string
  billing_interval: string | null
  trial_starts_at: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  created_at: string
  // Joined from profiles
  profile?: { full_name: string | null; email: string } | null
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    trialing: 'text-amber-600 bg-amber-50 border-amber-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    canceled: 'text-red-600 bg-red-50 border-red-100',
    past_due: 'text-orange-600 bg-orange-50 border-orange-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${map[status] ?? 'text-muted bg-surface-low border-overlay'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function RenewalDate({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-muted">—</span>
  const d = new Date(date)
  const isPast = d < new Date()
  return (
    <span className={`text-xs font-medium ${isPast ? 'text-red-500' : 'text-on-surface'}`}>
      {d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })}
    </span>
  )
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('subscriptions')
        .select(`
          id, user_id, email, status, plan, billing_interval,
          trial_starts_at, trial_ends_at, current_period_end, created_at,
          profile:profiles ( full_name, email )
        `)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      const normalized = (data ?? []).map((s: any) => ({
        ...s,
        profile: Array.isArray(s.profile) ? (s.profile[0] ?? null) : (s.profile ?? null),
      }))
      setSubs(normalized)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load subscriptions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRefresh = () => { setRefreshing(true); load() }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  const stats = {
    trialing: subs.filter(s => s.status === 'trialing').length,
    active: subs.filter(s => s.status === 'active').length,
    canceled: subs.filter(s => s.status === 'canceled').length,
    total: subs.length,
  }

  const statCards = [
    { label: 'Trialing', value: stats.trialing, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active', value: stats.active, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Canceled', value: stats.canceled, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total', value: stats.total, icon: CreditCard, color: 'text-navy', bg: 'bg-navy/10' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted mt-0.5">Real subscription data from Supabase</p>
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
          <div>
            <p className="text-sm font-bold text-red-700">Could not load subscriptions</p>
            <p className="text-xs text-red-600 mt-0.5">Run <code className="font-mono bg-red-100 px-1 rounded">admin-migrations.sql</code> in Supabase first.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-overlay p-5">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              {loading ? (
                <div className="h-7 w-16 bg-surface-low rounded-lg animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-display font-black text-on-surface">{card.value}</p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'trialing', 'active', 'canceled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all capitalize ${
              filter === f ? 'bg-navy text-white border-navy shadow-sm shadow-navy/20' : 'bg-white text-muted border-overlay hover:border-navy/20 hover:text-navy'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-overlay overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-surface-low rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-overlay">
                <tr>
                  {['User', 'Plan', 'Billing', 'Status', 'Since', 'Renewal / Trial End'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-overlay">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <CreditCard className="w-8 h-8 text-muted/20 mx-auto mb-2" />
                    <p className="text-sm text-muted">{subs.length === 0 ? 'No subscriptions found — run admin-migrations.sql to seed initial data.' : 'No records match filter'}</p>
                  </td></tr>
                ) : filtered.map((s, i) => {
                  const displayEmail = s.profile?.email ?? s.email ?? 'Unknown'
                  const displayName = s.profile?.full_name ?? null
                  const renewalDate = s.status === 'trialing' ? s.trial_ends_at : s.current_period_end
                  return (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-surface-low/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy/20 to-navy/10 flex items-center justify-center text-navy text-xs font-black shrink-0">
                            {displayEmail[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{displayName || '—'}</p>
                            <p className="text-xs text-muted">{displayEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface font-medium">{s.plan}</td>
                      <td className="px-5 py-4 text-sm text-muted capitalize">{s.billing_interval ?? 'monthly'}</td>
                      <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-4 text-sm text-muted">
                        {new Date(s.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-5 py-4"><RenewalDate date={renewalDate} /></td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Polar/Stripe integration note — only show if no active subs */}
      {!loading && stats.active === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 font-medium">
            All subscriptions are on trial. Connect your <strong>Polar</strong> or <strong>Stripe</strong> webhook to sync real billing events
            into the <code className="font-mono bg-blue-100 px-1 rounded">subscriptions</code> table automatically.
          </p>
        </div>
      )}
    </div>
  )
}
