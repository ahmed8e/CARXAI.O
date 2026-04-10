import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { Search, AlertCircle, Edit2, X, Save, RefreshCw } from 'lucide-react'

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

type SubscriptionRow = {
  id: string
  user_id: string
  plan_name: string
  billing_cycle: string
  status: string
  starts_at: string | null
  ends_at: string | null
  payment_method: string | null
  notes: string | null
}

type UserWithSub = ProfileRow & { subscription: SubscriptionRow | null }

type FilterKey = 'all' | 'active' | 'pending' | 'expired' | 'cancelled' | 'trialing'

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    trialing: 'text-amber-600 bg-amber-50 border-amber-200',
    active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    pending: 'text-blue-600 bg-blue-50 border-blue-200',
    cancelled: 'text-red-600 bg-red-50 border-red-100',
    expired: 'text-orange-600 bg-orange-50 border-orange-200',
    unknown: 'text-muted bg-surface-low border-overlay',
  }
  const label = status || 'unknown'
  const cls = map[label] ?? 'text-muted bg-surface-low border-overlay'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>
      {label}
    </span>
  )
}

export default function AdminSubscriptions() {
  const [users, setUsers] = useState<UserWithSub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  // Modal State
  const [editingUser, setEditingUser] = useState<UserWithSub | null>(null)
  const [formData, setFormData] = useState<Partial<SubscriptionRow>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      // First get profiles
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profErr) throw profErr

      // Then get subscriptions
      const { data: subs, error: subErr } = await supabase
        .from('subscriptions')
        .select('*')

      if (subErr) {
        // If subscriptions fails, log and show without subs
        console.warn('Subscriptions table error, maybe columns not updated yet?', subErr)
        setUsers(profiles.map(p => ({ ...p, subscription: null })))
        return
      }

      const subsMap = new Map(subs.map(s => [s.user_id, s]))
      
      const merged = profiles.map(p => ({
        ...p,
        subscription: subsMap.get(p.id) || null
      }))

      setUsers(merged)
    } catch (e: any) {
      setError(e.message || 'Failed to load data. Run migrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = (user: UserWithSub) => {
    setEditingUser(user)
    if (user.subscription) {
      setFormData(user.subscription)
    } else {
      setFormData({
        user_id: user.id,
        plan_name: 'pro',
        billing_cycle: 'monthly',
        status: 'active',
        starts_at: new Date().toISOString(),
        payment_method: 'whatsapp_manual',
        notes: ''
      })
    }
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSaving(true)
    setSaveError(null)
    
    // Ensure minimal required fields
    const payload = {
      user_id: editingUser.id,
      email: editingUser.email,
      plan_name: formData.plan_name || 'pro',
      billing_cycle: formData.billing_cycle || 'monthly',
      status: formData.status || 'pending',
      starts_at: formData.starts_at || null,
      ends_at: formData.ends_at || null,
      payment_method: formData.payment_method || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString()
    }

    try {
      if (editingUser.subscription?.id) {
        // Update existing
        const { error } = await supabase
          .from('subscriptions')
          .update(payload)
          .eq('id', editingUser.subscription.id)
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('subscriptions')
          .insert(payload)
        if (error) throw error
      }
      
      // Reload on success
      setEditingUser(null)
      load()
    } catch (err: any) {
      setSaveError(err.message || 'Could not save subscription.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
    
    const status = u.subscription?.status ?? 'none'
    const matchFilter = filter === 'all' || status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 space-y-6 max-w-[1400px] h-full relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted mt-0.5">
          {loading ? 'Crunching data…' : `Manage billing & access for ${users.length} users`}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Database Connection Failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error} — Did you run the SQL migration?</p>
          </div>
        </div>
      )}

      {/* Tools */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email, name, or User ID…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-overlay rounded-xl text-sm text-on-surface focus:border-navy/30 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'pending', 'trialing', 'expired'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t as FilterKey)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${
                filter === t
                  ? 'bg-navy text-white border-navy shadow-sm shadow-navy/20'
                  : 'bg-white text-muted border-overlay hover:border-navy/20 hover:text-navy'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-overlay overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 flex justify-center py-20">
            <RefreshCw className="w-6 h-6 text-navy animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-overlay bg-slate-50/50">
                <tr>
                  {['User', 'Plan Details', 'Gate Status', 'Timeline', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-overlay">
                {filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-navy">{user.email}</span>
                        <span className="text-[10px] text-muted font-mono">{user.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">
                      {user.subscription ? (
                        <div className="flex flex-col">
                          <span className="capitalize">{user.subscription.plan_name} • {user.subscription.billing_cycle}</span>
                          <span className="text-xs text-muted mt-0.5">{user.subscription.payment_method?.replace('_', ' ')}</span>
                        </div>
                      ) : (
                        <span className="text-muted text-xs italic">No Record</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {user.subscription ? <StatusBadge status={user.subscription.status} /> : <StatusBadge status="none" />}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-muted">
                       {user.subscription?.starts_at ? new Date(user.subscription.starts_at).toLocaleDateString() : '-'} <br/>
                       to {user.subscription?.ends_at ? new Date(user.subscription.ends_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-navy hover:bg-slate-50 transition flex items-center gap-2"
                      >
                         <Edit2 className="w-3.5 h-3.5" /> Manage
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal Drawer Overlay */}
      <AnimatePresence>
        {editingUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 border-l border-overlay overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-overlay bg-slate-50">
                <div>
                   <h2 className="text-lg font-black text-navy">{editingUser.subscription ? 'Edit Subscription' : 'Activate Subscription'}</h2>
                   <p className="text-xs text-muted truncate max-w-[200px]">{editingUser.email}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1">
                {saveError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest text-navy">Plan</label>
                    <select 
                      value={formData.plan_name || ''} 
                      onChange={e => setFormData({ ...formData, plan_name: e.target.value })}
                      className="w-full text-sm font-medium border border-overlay rounded-xl p-2.5 bg-white"
                    >
                      <option value="pro">Pro</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest text-navy">Cycle</label>
                    <select 
                      value={formData.billing_cycle || ''} 
                      onChange={e => setFormData({ ...formData, billing_cycle: e.target.value })}
                      className="w-full text-sm font-medium border border-overlay rounded-xl p-2.5 bg-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest text-navy">Access Status</label>
                    <select 
                      value={formData.status || ''} 
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full text-sm font-medium border border-overlay rounded-xl p-2.5 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active (Unlock App)</option>
                      <option value="trialing">Trialing</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest text-navy">Payment Method</label>
                    <select 
                      value={formData.payment_method || ''} 
                      onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full text-sm font-medium border border-overlay rounded-xl p-2.5 bg-white"
                    >
                      <option value="">Select Method...</option>
                      <option value="whatsapp_manual">WhatsApp Manual</option>
                      <option value="paypal_manual">PayPal Manual</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest text-navy">Start Date</label>
                    <input 
                      type="date"
                      value={formData.starts_at ? new Date(formData.starts_at).toISOString().split('T')[0] : ''} 
                      onChange={e => setFormData({ ...formData, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full text-sm font-medium border border-overlay rounded-xl p-2.5 bg-white text-on-surface"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest text-navy">End Date</label>
                    <input 
                      type="date"
                      value={formData.ends_at ? new Date(formData.ends_at).toISOString().split('T')[0] : ''} 
                      onChange={e => setFormData({ ...formData, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full text-sm font-medium border border-overlay rounded-xl p-2.5 bg-white text-on-surface"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted tracking-widest text-navy">Admin Notes</label>
                  <textarea 
                     rows={3}
                     placeholder="Payment ref, reasons..."
                     value={formData.notes || ''} 
                     onChange={e => setFormData({ ...formData, notes: e.target.value })}
                     className="w-full text-sm font-medium border border-overlay rounded-xl p-3 bg-white text-on-surface"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-overlay bg-white">
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-white transition ${saving ? 'bg-navy/50 cursor-not-allowed' : 'bg-navy hover:bg-navy/90'}`}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Subscription'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
