import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Zap, Image, FileText, AlertCircle, TrendingUp, Activity } from 'lucide-react'

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

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [chats, setChats] = useState<any[]>([])
  const [topIssues, setTopIssues] = useState<{ name: string; count: number }[]>([])
  const [urgencyDist, setUrgencyDist] = useState<{ name: string; value: number; color: string }[]>([])

  useEffect(() => {
    supabase
      .from('ai_chats')
      .select('id, issue_name, urgency_level, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const all = data ?? []
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
        for (const c of all) { const k = c.urgency_level || 'unknown'; urgMap[k] = (urgMap[k] || 0) + 1 }
        const COLORS: Record<string, string> = {
          stop_driving: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981', unknown: '#94a3b8'
        }
        setUrgencyDist(
          Object.entries(urgMap).map(([name, value]) => ({ name, value, color: COLORS[name] ?? '#94a3b8' }))
        )

        setLoading(false)
      })
  }, [])

  const statCards = [
    { label: 'Total Analyses', value: chats.length, icon: Zap, color: 'text-navy', bg: 'bg-navy/10' },
    { label: 'Critical (Stop Driving)', value: chats.filter(c => c.urgency_level === 'stop_driving').length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'High Urgency', value: chats.filter(c => c.urgency_level === 'high').length, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Medium', value: chats.filter(c => c.urgency_level === 'medium').length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">Analytics</h1>
        <p className="text-sm text-muted mt-0.5">AI usage and product diagnostics breakdown</p>
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
                <div className="h-7 w-20 bg-surface-low rounded-lg animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-display font-black text-on-surface">{card.value}</p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
            </motion.div>
          )
        })}
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
            <div className="h-52 flex items-center justify-center text-muted text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topIssues} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0070E0" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Urgency Pie */}
        <div className="bg-white rounded-2xl border border-overlay p-6">
          <h2 className="text-sm font-display font-black text-on-surface mb-1">Urgency Distribution</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-5">Across all analyses</p>
          {loading ? (
            <div className="h-52 bg-surface-low rounded-xl animate-pulse" />
          ) : urgencyDist.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted text-sm">No data</div>
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
    </div>
  )
}
