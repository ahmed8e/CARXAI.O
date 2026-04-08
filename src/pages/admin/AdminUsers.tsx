import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Users, Search, Filter, Mail, Calendar, Zap, ChevronDown } from 'lucide-react'

type Filter = 'all' | 'trial' | 'paid' | 'canceled'

interface UserRow {
  id: string
  email: string
  full_name: string | null
  created_at: string
  plan?: string
  subscription_status?: string
  trial_ends_at?: string
  is_paid_user?: boolean
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    trialing: 'text-amber-600 bg-amber-50 border-amber-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    paid: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    canceled: 'text-red-600 bg-red-50 border-red-100',
    inactive: 'text-muted bg-surface-low border-overlay',
  }
  const label = status || 'unknown'
  const cls = map[label] ?? 'text-muted bg-surface-low border-overlay'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>
      {label}
    </span>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setUsers(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All Users' },
    { key: 'trial', label: 'Trial' },
    { key: 'paid', label: 'Paid' },
    { key: 'canceled', label: 'Canceled' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Users</h1>
        <p className="text-sm text-muted mt-0.5">{users.length} total registered users</p>
      </div>

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
        <div className="flex gap-2">
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
                  {['User', 'Signed up', 'Status', 'Plan'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-overlay">
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-muted text-sm">No users found</td></tr>
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
                      <p className="text-sm text-on-surface">{new Date(user.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={user.subscription_status ?? 'trialing'} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted">{user.plan ?? 'Pro'}</span>
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
