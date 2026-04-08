import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Users, TrendingUp, Zap, MapPin, Wrench, FileText,
  Star, Activity, Clock, RefreshCw, AlertCircle
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────
interface KPICard {
  label: string
  value: string | number
  sub?: string
  icon: any
  color: string
  bgColor: string
}

// ── Skeleton ─────────────────────────────────────────────────────────
function KPISkeleton() {
  return <div className="h-28 bg-white rounded-2xl border border-overlay animate-pulse" />
}

// ── KPI Card ─────────────────────────────────────────────────────────
function KPICardUI({ card, delay = 0 }: { card: KPICard; delay?: number }) {
  const Icon = card.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-overlay p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${card.color}`} />
        </div>
      </div>
      <p className="text-2xl font-display font-black text-on-surface mb-0.5">{card.value}</p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
      {card.sub && <p className="text-[10px] text-muted/60 mt-0.5">{card.sub}</p>}
    </motion.div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-overlay rounded-xl px-3 py-2 shadow-lg">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-navy">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    aiChats: 0,
    reports: 0,
    providers: 0,
    mechanics: 0,
    towing: 0,
  })
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [signupChart, setSignupChart] = useState<any[]>([])
  const [providerCities, setProviderCities] = useState<{ city: string; count: number }[]>([])

  const loadData = async () => {
    try {
      // Parallel fetch all critical data
      const [profilesRes, chatsRes, providersRes] = await Promise.all([
        supabase.from('profiles').select('id, email, created_at', { count: 'exact' }),
        supabase.from('ai_chats').select('id, user_id, issue_name, urgency_level, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('service_providers_raw').select('id, Category, City', { count: 'exact' }),
      ])

      const totalUsers = profilesRes.count ?? 0
      const aiChats = chatsRes.data?.length ?? 0
      const totalProviders = providersRes.count ?? 0
      const mechanics = (providersRes.data ?? []).filter((p: any) => {
        const cat = (p.Category ?? '').toLowerCase()
        return cat.includes('mécanicien') || cat.includes('garage') || cat.includes('réparation') || cat.includes('mechanic')
      }).length
      const towing = (providersRes.data ?? []).filter((p: any) => {
        const cat = (p.Category ?? '').toLowerCase()
        return cat.includes('remorquage') || cat.includes('towing')
      }).length

      // City distribution for providers
      const cityMap: Record<string, number> = {}
      for (const p of (providersRes.data ?? [])) {
        const city = p.City || 'Unknown'
        cityMap[city] = (cityMap[city] || 0) + 1
      }
      const topCities = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([city, count]) => ({ city, count }))

      // Build signup sparkline from profiles (group by month)
      const monthMap: Record<string, number> = {}
      for (const p of (profilesRes.data ?? [])) {
        const month = new Date(p.created_at).toLocaleDateString('en', { month: 'short' })
        monthMap[month] = (monthMap[month] || 0) + 1
      }
      const chartData = Object.entries(monthMap).map(([month, signups]) => ({ month, signups }))

      setStats({ totalUsers, aiChats, reports: aiChats, providers: totalProviders, mechanics, towing })
      setRecentChats(chatsRes.data ?? [])
      setSignupChart(chartData)
      setProviderCities(topCities)
    } catch (err) {
      console.error('[AdminOverview]', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleRefresh = () => { setRefreshing(true); loadData() }

  const kpiCards: KPICard[] = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-navy', bgColor: 'bg-navy/10' },
    { label: 'AI Analyses', value: stats.aiChats, icon: Zap, color: 'text-violet-600', bgColor: 'bg-violet-50' },
    { label: 'Total Providers', value: stats.providers, icon: MapPin, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: 'Mechanics', value: stats.mechanics, icon: Wrench, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { label: 'Towing Providers', value: stats.towing, icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Reports Generated', value: stats.reports, icon: FileText, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  ]

  return (
    <div className="p-6 space-y-7 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Overview</h1>
          <p className="text-sm text-muted mt-0.5">Live stats from your Carxai platform</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-overlay text-sm font-bold text-muted hover:border-navy/20 hover:text-navy transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-navy' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
          : kpiCards.map((card, i) => <KPICardUI key={card.label} card={card} delay={i * 0.06} />)
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Signups chart */}
        <div className="bg-white rounded-2xl border border-overlay p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-display font-black text-on-surface">User Signups</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">by month</p>
            </div>
            <Activity className="w-4 h-4 text-navy/40" />
          </div>
          {loading ? (
            <div className="h-44 bg-surface-low rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={signupChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0070E0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0070E0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="signups" stroke="#0070E0" strokeWidth={2} fill="url(#navyGrad)" dot={{ fill: '#0070E0', strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Provider Cities */}
        <div className="bg-white rounded-2xl border border-overlay p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-display font-black text-on-surface">Providers by City</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Top 8 cities</p>
            </div>
            <MapPin className="w-4 h-4 text-navy/40" />
          </div>
          {loading ? (
            <div className="h-44 bg-surface-low rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={providerCities} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="city" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0070E0" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent AI Activity */}
      <div className="bg-white rounded-2xl border border-overlay p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-display font-black text-on-surface">Recent AI Diagnoses</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Last 8 sessions</p>
          </div>
          <Clock className="w-4 h-4 text-navy/40" />
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-surface-low rounded-xl animate-pulse" />)}</div>
        ) : recentChats.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">No AI sessions yet</div>
        ) : (
          <div className="space-y-2">
            {recentChats.map((chat, i) => {
              const urgency = chat.urgency_level
              const urgencyColor =
                urgency === 'stop_driving' ? 'text-red-600 bg-red-50 border-red-100'
                : urgency === 'high' ? 'text-orange-600 bg-orange-50 border-orange-100'
                : urgency === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-100'
                : 'text-emerald-600 bg-emerald-50 border-emerald-100'

              return (
                <motion.div key={chat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-4 py-3 bg-surface-low rounded-xl border border-overlay">
                  <Zap className="w-4 h-4 text-navy/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{chat.issue_name || 'Unknown issue'}</p>
                    <p className="text-[10px] text-muted">{new Date(chat.created_at).toLocaleDateString()}</p>
                  </div>
                  {urgency && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${urgencyColor}`}>
                      {urgency.replace('_', ' ')}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
