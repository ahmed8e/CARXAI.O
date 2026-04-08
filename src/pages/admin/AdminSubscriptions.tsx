import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { CreditCard, Users, TrendingDown, Clock, AlertCircle } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  created_at: string
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

export default function AdminSubscriptions() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    supabase.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data ?? []); setLoading(false) })
  }, [])

  // Simulate subscription status from user metadata (since stored in auth.users metadata)
  // In a real setup, you'd join with a subscriptions table or fetch from Polar/Stripe webhook data
  const enriched = users.map((u, i) => ({
    ...u,
    status: i % 4 === 0 ? 'active' : i % 4 === 1 ? 'trialing' : i % 4 === 2 ? 'canceled' : 'trialing',
    plan: 'Pro',
    billingInterval: i % 2 === 0 ? 'monthly' : 'yearly',
    startedAt: u.created_at,
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))

  const filtered = filter === 'all' ? enriched : enriched.filter(u => u.status === filter)

  const stats = {
    active: enriched.filter(u => u.status === 'active').length,
    trialing: enriched.filter(u => u.status === 'trialing').length,
    canceled: enriched.filter(u => u.status === 'canceled').length,
    total: enriched.length,
  }

  const statCards = [
    { label: 'Trialing', value: stats.trialing, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active', value: stats.active, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Canceled', value: stats.canceled, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total', value: stats.total, icon: CreditCard, color: 'text-navy', bg: 'bg-navy/10' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted mt-0.5">Subscription status across all users</p>
      </div>

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
                  {['User', 'Plan', 'Billing', 'Status', 'Since', 'Renewal'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-overlay">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">No records found</td></tr>
                ) : filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy/20 to-navy/10 flex items-center justify-center text-navy text-xs font-black shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{u.full_name || '—'}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface">{u.plan}</td>
                    <td className="px-5 py-4 text-sm text-muted capitalize">{u.billingInterval}</td>
                    <td className="px-5 py-4"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-4 text-sm text-muted">{new Date(u.startedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                    <td className="px-5 py-4 text-sm text-muted">{new Date(u.renewalDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-700 font-medium">
          Subscription statuses are simulated. Connect your Polar/Stripe webhook to a <code className="font-mono bg-amber-100 px-1 rounded">subscriptions</code> table to show real billing data.
        </p>
      </div>
    </div>
  )
}
