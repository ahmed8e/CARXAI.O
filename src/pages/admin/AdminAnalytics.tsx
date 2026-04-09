import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { Zap, Truck, Wrench, AlertCircle, TrendingUp, Activity, MousePointerClick, RefreshCw, Info } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-overlay rounded-xl px-3 py-2 shadow-lg">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

// Build last-14-day date labels
function buildDayBuckets(days = 14): Record<string, string> {
  const buckets: Record<string, string> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
    const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    buckets[key] = label
  }
  return buckets
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chats, setChats] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [topIssues, setTopIssues] = useState<{ name: string; count: number }[]>([])
  const [urgencyDist, setUrgencyDist] = useState<{ name: string; value: number; color: string }[]>([])
  const [activityChart, setActivityChart] = useState<any[]>([])

  const load = async () => {
    setError(null)
    try {
      const [chatsRes, eventsRes] = await Promise.all([
        (supabase as any).from('ai_chats').select('id, issue_name, urgency_level, created_at').order('created_at', { ascending: false }),
        (supabase as any).from('app_events').select('event_type, created_at'),
      ])

      if (chatsRes.error) throw chatsRes.error

      const all = chatsRes.data ?? []
      setChats(all)

      // Top issues
      const issueMap: Record<string, number> = {}
      for (const c of all) {
        const key = c.issue_name || 'Unknown'
        issueMap[key] = (issueMap[key] || 0) + 1
      }
      setTopIssues(
        Object.entries(issueMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }))
      )

      // Urgency distribution
      const urgMap: Record<string, number> = {}
      for (const c of all) { const k = c.urgency_level || 'low'; urgMap[k] = (urgMap[k] || 0) + 1 }
      const COLORS: Record<string, string> = {
        stop_driving: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981', unknown: '#94a3b8'
      }
      setUrgencyDist(
        Object.entries(urgMap).map(([name, value]) => ({ name, value, color: COLORS[name] ?? '#94a3b8' }))
      )

      // Daily activity chart (last 14 days)
      const allEvts = eventsRes.data ?? []
      setEvents(allEvts)
      const dayBuckets = buildDayBuckets(14)
      const chartRows = Object.entries(dayBuckets).map(([dateKey, label]) => {
        const aiCount = all.filter((c: any) => c.created_at?.slice(0, 10) === dateKey).length
        const mecCount = allEvts.filter((e: any) => e.event_type === 'mechanic_click' && e.created_at?.slice(0, 10) === dateKey).length
        const towCount = allEvts.filter((e: any) => e.event_type === 'towing_click' && e.created_at?.slice(0, 10) === dateKey).length
        return { label, ai: aiCount, mechanic: mecCount, towing: towCount }
      })
      setActivityChart(chartRows)

    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  const handleRefresh = () => { setRefreshing(true); load() }

  const mechanicClicks = events.filter(e => e.event_type === 'mechanic_click').length
  const towingClicks = events.filter(e => e.event_type === 'towing_click').length

  const statCards = [
    { label: 'Total AI Analyses', value: chats.length, icon: Zap, color: 'text-navy', bg: 'bg-navy/10' },
    { label: 'Critical Issues', value: chats.filter(c => c.urgency_level === 'stop_driving').length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Mechanic Clicks', value: mechanicClicks, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Towing Clicks', value: towingClicks, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Analytics</h1>
          <p className="text-sm text-muted mt-0.5">Real app usage data — AI analyses, mechanic & towing activity</p>
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
          <p className="text-sm text-red-700">{error} — Run <code className="font-mono bg-red-100 px-1 rounded">admin-migrations.sql</code> to fix RLS.</p>
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
                <div className="h-7 w-20 bg-surface-low rounded-lg animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-display font-black text-on-surface">{card.value}</p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Daily activity chart */}
      <div className="bg-white rounded-2xl border border-overlay p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-display font-black text-on-surface">Daily Activity</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Last 14 days — AI, mechanic & towing</p>
          </div>
          <Activity className="w-4 h-4 text-navy/40" />
        </div>
        {loading ? (
          <div className="h-52 bg-surface-low rounded-xl animate-pulse" />
        ) : mechanicClicks === 0 && towingClicks === 0 && chats.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center gap-2">
            <MousePointerClick className="w-8 h-8 text-muted/20" />
            <p className="text-xs text-muted font-medium text-center">No activity tracked yet.<br />Events will appear here as users interact with the app.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Line type="monotone" dataKey="ai" name="AI Analyses" stroke="#0070E0" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mechanic" name="Mechanic Clicks" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="towing" name="Towing Clicks" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Issues bar chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-overlay p-6">
          <h2 className="text-sm font-display font-black text-on-surface mb-1">Top Diagnosed Issues</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-5">Most frequent AI results</p>
          {loading ? (
            <div className="h-52 bg-surface-low rounded-xl animate-pulse" />
          ) : topIssues.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <Zap className="w-8 h-8 text-muted/20" />
              <p className="text-xs text-muted font-medium text-center">No AI diagnoses yet.<br />Data will appear as users analyse their cars.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topIssues} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="#0070E0" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Urgency Pie */}
        <div className="bg-white rounded-2xl border border-overlay p-6">
          <h2 className="text-sm font-display font-black text-on-surface mb-1">Urgency Breakdown</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-5">Across all AI analyses</p>
          {loading ? (
            <div className="h-52 bg-surface-low rounded-xl animate-pulse" />
          ) : urgencyDist.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <TrendingUp className="w-8 h-8 text-muted/20" />
              <p className="text-xs text-muted font-medium">No data yet</p>
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={urgencyDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {urgencyDist.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {urgencyDist.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-muted capitalize flex-1">{d.name.replace('_', ' ')}</span>
                    <span className="text-xs font-bold text-on-surface">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracking info banner */}
      {!loading && mechanicClicks === 0 && towingClicks === 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 font-medium">
            Mechanic and towing click tracking is ready. Counts will populate as users interact with those pages.
            Make sure <code className="font-mono bg-blue-100 px-1 rounded">admin-migrations.sql</code> has been run to create the <code className="font-mono bg-blue-100 px-1 rounded">app_events</code> table.
          </p>
        </div>
      )}
    </div>
  )
}
