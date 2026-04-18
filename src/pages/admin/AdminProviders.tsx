import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  MapPin, ChevronDown, RefreshCw, Plus, Search, Filter, Edit3, Trash2
} from 'lucide-react'

interface Provider {
  id: number
  Business_name: string | null
  Category: string | null
  Address: string | null
  City: string | null
  Phone: string | null
  Rating: number | null
  Review: number | null
  Lat: string | null
  Long: string | null
  Website_url: string | null
  assigned_user_id: string | null
  created_at: string | null
}

type Tab = 'all' | 'mechanics' | 'towing'

const isMechanic = (cat: string | null) => {
  const c = (cat ?? '').toLowerCase()
  return c.includes('mécanicien') || c.includes('garage') || c.includes('réparation') || c.includes('carrosserie') || c.includes('mechanic') || c.includes('auto repair')
}
const isTowing = (cat: string | null) => {
  const c = (cat ?? '').toLowerCase()
  return c.includes('remorquage') || c.includes('towing') || c.includes('transport') || c.includes('dépannage')
}

function TypeBadge({ category }: { category: string | null }) {
  if (isTowing(category)) return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 border border-blue-100 text-blue-600">Towing</span>
  if (isMechanic(category)) return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 border border-amber-100 text-amber-600">Mechanic</span>
  return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-surface-low border border-overlay text-muted">{category?.slice(0, 18) ?? 'Other'}</span>
}

function ConfirmDialog({ open, message, onConfirm, onCancel }: { open: boolean; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl border border-overlay shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-bold text-on-surface mb-5">{message}</p>
            <div className="flex gap-2">
              <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-low text-muted hover:text-on-surface transition-colors">Cancel</button>
              <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [cityFilter, setCityFilter] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const loadProviders = useCallback(async () => {
    const { data } = await supabase
      .from('service_providers_raw')
      .select('id, Business_name, Category, Address, City, Phone, Rating, Review, Lat, Long, Website_url, assigned_user_id, created_at')
      .order('Business_name', { ascending: true })
    
    const all = data ?? []
    setProviders(all)
    const uniqueCities = [...new Set(all.map((p: Provider) => p.City ?? '').filter(Boolean))].sort()
    setCities(uniqueCities)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { loadProviders() }, [loadProviders])

  const filtered = providers.filter(p => {
    const matchSearch = (p.Business_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.City ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.Phone ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' ? true : tab === 'mechanics' ? isMechanic(p.Category) : isTowing(p.Category)
    const matchCity = cityFilter ? p.City === cityFilter : true
    return matchSearch && matchTab && matchCity
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('service_providers_raw').delete().eq('id', deleteTarget)
    setProviders(prev => prev.filter(p => p.id !== deleteTarget))
    setDeleteTarget(null)
  }

  const tabCounts = {
    all: providers.length,
    mechanics: providers.filter(p => isMechanic(p.Category)).length,
    towing: providers.filter(p => isTowing(p.Category)).length,
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Providers</h1>
          <p className="text-sm text-muted mt-0.5">{providers.length} total providers in network</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setRefreshing(true); loadProviders() }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-overlay text-sm font-bold text-muted hover:border-navy/20 hover:text-navy transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-navy' : ''}`} />
          </button>
          <Link to="/admin/providers/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold shadow-sm shadow-navy/20 hover:bg-navy/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Provider
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'mechanics', 'towing'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all capitalize ${
              tab === t ? 'bg-navy text-white border-navy shadow-sm shadow-navy/20' : 'bg-white text-muted border-overlay hover:border-navy/20 hover:text-navy'
            }`}
          >
            {t}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t ? 'bg-white/20' : 'bg-surface-low'}`}>
              {tabCounts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + city filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, city, phone…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-overlay rounded-xl text-sm text-on-surface focus:border-navy/30 focus:outline-none transition-colors" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white border border-overlay rounded-xl text-sm text-on-surface focus:border-navy/30 focus:outline-none appearance-none cursor-pointer">
            <option value="">All cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Provider count */}
      <p className="text-xs text-muted font-medium -mt-2">{filtered.length} providers shown</p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-overlay overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-surface-low rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-overlay">
                <tr>
                  {['Provider', 'Category', 'City', 'Phone', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-overlay">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">No providers found</td></tr>
                ) : filtered.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                    className="hover:bg-surface-low/50 transition-colors">
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-navy" />
                        </div>
                        <p className="text-sm font-bold text-on-surface truncate">{p.Business_name ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4"><TypeBadge category={p.Category} /></td>
                    <td className="px-5 py-4 text-sm text-muted">{p.City ?? '—'}</td>
                    <td className="px-5 py-4">
                      {p.Phone ? (
                        <a href={`tel:${p.Phone}`} className="text-sm text-navy font-medium hover:underline">{p.Phone}</a>
                      ) : <span className="text-sm text-muted">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {p.assigned_user_id ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 border border-emerald-100 text-emerald-600">Assigned</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 text-slate-400">Available</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/admin/providers/add?edit=${p.id}`}
                          className="w-7 h-7 rounded-lg bg-surface-low flex items-center justify-center text-muted hover:text-navy hover:bg-navy/10 transition-colors" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => setDeleteTarget(p.id)}
                          className="w-7 h-7 rounded-lg bg-surface-low flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        message="Are you sure you want to permanently delete this provider? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
