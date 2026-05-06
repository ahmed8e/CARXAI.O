import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import {
  Wrench, Car, Plus, Download, Calculator,
  Sun, Droplets, History, Scale, ChevronRight,
  AlertTriangle, CheckCircle2, Activity
} from 'lucide-react'

import {
  DEFAULT_SCHEDULE, calculateMaintenanceStatus, calculateHealthScore,
  getSeasonalChecklists,
  type MaintenanceItem, type MaintenancePrefs, type ServiceRecord,
  type MaintenanceStatus, type SeasonalChecklistData, type ChecklistItem
} from '../data/maintenanceData'

import HealthScoreCard from '../components/maintenance/HealthScoreCard'
import MaintenanceReminderCard from '../components/maintenance/MaintenanceReminderCard'
import ServiceHistoryTimeline from '../components/maintenance/ServiceHistoryTimeline'
import SeasonalChecklist from '../components/maintenance/SeasonalChecklist'
import WorthFixingAdvisor from '../components/maintenance/WorthFixingAdvisor'
import FluidCheckGuide from '../components/maintenance/FluidCheckGuide'
import AddServiceRecordModal from '../components/maintenance/AddServiceRecordModal'

interface Vehicle {
  id: string; make: string; model: string; year: number; mileage: number | null; is_default?: boolean
}

type Tab = 'overview' | 'history' | 'seasonal' | 'fluids' | 'advisor'

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'overview',  label: 'Overview',    icon: Activity },
  { id: 'history',   label: 'History',     icon: History },
  { id: 'seasonal',  label: 'Seasonal',    icon: Sun },
  { id: 'fluids',    label: 'Fluids',      icon: Droplets },
  { id: 'advisor',   label: 'Worth Fix?',  icon: Scale },
]

function buildSchedule(vehicle: Vehicle): MaintenanceItem[] {
  const m = vehicle.mileage || 50000
  return DEFAULT_SCHEDULE.map(s => ({
    ...s,
    lastServiceMileage: Math.max(0, m - Math.round(s.intervalMiles * 0.7)),
    lastServiceDate: new Date(Date.now() - (s.intervalMonths * 0.6) * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

export default function Maintenance() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mileage, setMileage] = useState(50000)
  const [prefs, setPrefs] = useState<MaintenancePrefs>({
    avgMilesPerMonth: 1000, drivingStyle: 'mixed', usageLevel: 'normal', region: 'temperate'
  })
  const [schedule, setSchedule] = useState<MaintenanceItem[]>([])
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([])
  const [checklists, setChecklists] = useState<SeasonalChecklistData[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const vehicle = vehicles.find(v => v.id === selectedId)

  useEffect(() => { if (user) fetchVehicles() }, [user])

  useEffect(() => {
    if (selectedId) loadVehicleData(selectedId)
  }, [selectedId])

  useEffect(() => {
    setChecklists(getSeasonalChecklists(prefs.region))
  }, [prefs.region])

  const fetchVehicles = async () => {
    try {
      const { data } = await (supabase as any).from('vehicles').select('*').eq('user_id', user?.id)
      if (data?.length) {
        setVehicles(data)
        const def = data.find((v: any) => v.is_default) || data[0]
        setSelectedId(def.id)
        setMileage(def.mileage || 50000)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadVehicleData = (vid: string) => {
    const v = vehicles.find(x => x.id === vid)
    if (v) setMileage(v.mileage || 50000)

    const savedPrefs = localStorage.getItem(`maint_prefs_v2_${vid}`)
    if (savedPrefs) setPrefs(JSON.parse(savedPrefs))

    const savedSched = localStorage.getItem(`maint_schedule_${vid}`)
    if (savedSched) setSchedule(JSON.parse(savedSched))
    else if (v) { const s = buildSchedule(v); setSchedule(s) }

    const savedHistory = localStorage.getItem(`maint_history_${vid}`)
    if (savedHistory) setServiceHistory(JSON.parse(savedHistory))
    else setServiceHistory([])
  }

  const savePrefs = () => {
    if (!selectedId) return
    setSaving(true)
    localStorage.setItem(`maint_prefs_v2_${selectedId}`, JSON.stringify(prefs))
    localStorage.setItem(`maint_schedule_${selectedId}`, JSON.stringify(schedule));
    (supabase as any).from('vehicles').update({ mileage }).eq('id', selectedId)
    setVehicles(prev => prev.map(v => v.id === selectedId ? { ...v, mileage } : v))
    setTimeout(() => setSaving(false), 600)
  }

  const handleLogService = (itemId: string, loggedMileage: number) => {
    const updated = schedule.map(s =>
      s.id === itemId ? { ...s, lastServiceMileage: loggedMileage, lastServiceDate: new Date().toISOString() } : s
    )
    setSchedule(updated)
    if (selectedId) localStorage.setItem(`maint_schedule_${selectedId}`, JSON.stringify(updated))
  }

  const handleAddRecord = (record: Omit<ServiceRecord, 'id'>) => {
    const newRecord: ServiceRecord = { ...record, id: crypto.randomUUID() }
    const updated = [newRecord, ...serviceHistory]
    setServiceHistory(updated)
    if (selectedId) localStorage.setItem(`maint_history_${selectedId}`, JSON.stringify(updated))
  }

  const handleChecklistUpdate = (checklistId: string, items: ChecklistItem[]) => {
    setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, items } : c))
  }

  const handleExport = () => {
    if (!vehicle) return
    const lines = [
      `Car Safety — Maintenance Report`,
      `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      `Current Mileage: ${mileage.toLocaleString()}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `=== SERVICE HISTORY ===`,
      ...serviceHistory.map(r =>
        `${r.date} | ${r.serviceType} | ${r.mileage.toLocaleString()} mi | $${r.cost} | ${r.shopName || 'N/A'}`
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `car-safety-report-${vehicle.make}-${vehicle.model}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  // Computed
  const statuses: MaintenanceStatus[] = schedule.map(item => calculateMaintenanceStatus(item, mileage, prefs))
  const overdue = statuses.filter(s => s.status === 'overdue')
  const dueNow = statuses.filter(s => s.status === 'due')
  const dueSoon = statuses.filter(s => s.status === 'coming_soon')
  const good = statuses.filter(s => s.status === 'good')
  const health = calculateHealthScore(statuses, serviceHistory)

  const forecast90 = statuses.reduce((acc, s) => {
    const mi = s.nextDueMileage - mileage
    const days = s.daysUntilDue
    if (s.status !== 'good' || days <= 90 || mi <= prefs.avgMilesPerMonth * 3)
      return { low: acc.low + s.item.costLow, high: acc.high + s.item.costHigh }
    return acc
  }, { low: 0, high: 0 })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!vehicles.length) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-16">
        <div className="w-16 h-16 bg-surface-low rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-muted" />
        </div>
        <h2 className="text-2xl font-black text-on-surface mb-2">No Vehicles Found</h2>
        <p className="text-muted mb-6">Add a vehicle to start tracking maintenance.</p>
        <Link to="/dashboard/vehicles" className="btn-primary">Go to My Garage</Link>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 pb-32 lg:pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-navy animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/70">Maintenance Hub</span>
          </div>
          <h1 className="text-3xl font-display font-black text-on-surface italic tracking-tight">
            Smart Maintenance
          </h1>
          <p className="text-sm text-muted font-medium mt-1">
            Your car ownership assistant — prevent breakdowns, avoid scams.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Vehicle selector */}
          <select
            value={selectedId || ''}
            onChange={e => setSelectedId(e.target.value)}
            className="bg-surface border border-overlay rounded-xl px-4 py-2 text-sm font-bold text-on-surface outline-none focus:border-navy"
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
            ))}
          </select>
          <button
            onClick={() => { setTab('history'); setShowAddModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Record
          </button>
        </div>
      </div>

      {/* ── Top summary row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Health Score', value: `${health.total}/100`, sub: health.label, color: health.total >= 65 ? 'text-emerald-500' : 'text-amber-500' },
          { label: 'Overdue', value: overdue.length, sub: 'services', color: overdue.length > 0 ? 'text-red-500' : 'text-emerald-500' },
          { label: 'Due Soon', value: dueSoon.length + dueNow.length, sub: 'reminders', color: 'text-amber-500' },
          { label: '90-Day Cost', value: `$${forecast90.low}–$${forecast90.high}`, sub: 'estimated', color: 'text-navy' },
        ].map(s => (
          <div key={s.label} className="bg-surface dark:bg-surface-high/30 rounded-[20px] border border-overlay p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Settings bar ── */}
      <div className="bg-surface dark:bg-surface-high/30 rounded-[24px] border border-overlay p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Current Mileage</label>
            <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))}
              className="w-full bg-surface-low border border-overlay rounded-xl px-3 py-2 font-bold text-on-surface outline-none focus:border-navy text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Avg mi/month</label>
            <input type="number" value={prefs.avgMilesPerMonth} onChange={e => setPrefs(p => ({ ...p, avgMilesPerMonth: Number(e.target.value) }))}
              className="w-24 bg-surface-low border border-overlay rounded-xl px-3 py-2 font-bold text-on-surface outline-none focus:border-navy text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Driving</label>
            <select value={prefs.drivingStyle} onChange={e => setPrefs(p => ({ ...p, drivingStyle: e.target.value as any }))}
              className="bg-surface-low border border-overlay rounded-xl px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-navy">
              <option value="city">City</option>
              <option value="highway">Highway</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Region</label>
            <select value={prefs.region} onChange={e => setPrefs(p => ({ ...p, region: e.target.value as any }))}
              className="bg-surface-low border border-overlay rounded-xl px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-navy">
              <option value="hot">Hot Climate</option>
              <option value="cold">Cold / Winter</option>
              <option value="temperate">Temperate</option>
            </select>
          </div>
          <button onClick={savePrefs} disabled={saving}
            className="px-5 py-2 bg-navy text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
            {saving ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-surface dark:bg-surface-high/30 rounded-2xl border border-overlay p-1.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex-1 justify-center ${
              tab === t.id ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-muted hover:text-on-surface'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Health Score */}
          <div className="space-y-6">
            <HealthScoreCard score={health.total} label={health.label} categories={health.categories} />

            {/* 90-Day forecast card */}
            <div className="bg-gradient-to-br from-navy to-[#005bb5] p-6 rounded-[24px] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <Calculator className="w-4 h-4 text-white/80" />
                <span className="text-xs font-black text-white/90 uppercase tracking-widest">90-Day Forecast</span>
              </div>
              <p className="text-3xl font-black relative z-10">
                ${forecast90.low} <span className="text-xl text-white/50 font-medium">—</span> ${forecast90.high}
              </p>
              <p className="text-xs text-white/60 mt-1 relative z-10">Estimated upcoming service costs</p>
            </div>

            {/* Quick links */}
            <div className="space-y-2">
              {[
                { label: 'View History', icon: History, action: () => setTab('history') },
                { label: 'Seasonal Checks', icon: Sun, action: () => setTab('seasonal') },
                { label: 'Fluid Guide', icon: Droplets, action: () => setTab('fluids') },
                { label: 'Worth Fixing?', icon: Scale, action: () => setTab('advisor') },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-surface dark:bg-surface-high/30 border border-overlay rounded-2xl hover:border-navy/20 hover:shadow-sm transition-all group text-left">
                  <div className="w-7 h-7 rounded-xl bg-surface-low dark:bg-surface-highest/40 flex items-center justify-center">
                    <item.icon className="w-3.5 h-3.5 text-navy" />
                  </div>
                  <span className="flex-1 text-xs font-bold text-on-surface">{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-navy transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Maintenance items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Urgent */}
            {(overdue.length > 0 || dueNow.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Action Required</h2>
                </div>
                <div className="space-y-3">
                  {[...overdue, ...dueNow].map(s => (
                    <MaintenanceReminderCard key={s.item.id} status={s} currentMileage={mileage} onLogService={handleLogService} />
                  ))}
                </div>
              </div>
            )}

            {/* Due Soon */}
            {dueSoon.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Coming Up</h2>
                </div>
                <div className="space-y-3">
                  {dueSoon.map(s => (
                    <MaintenanceReminderCard key={s.item.id} status={s} currentMileage={mileage} onLogService={handleLogService} />
                  ))}
                </div>
              </div>
            )}

            {/* Good */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">All Good</h2>
              </div>
              <div className="space-y-3">
                {good.map(s => (
                  <MaintenanceReminderCard key={s.item.id} status={s} currentMileage={mileage} onLogService={handleLogService} />
                ))}
              </div>
            </div>

            {/* Recent history preview */}
            {serviceHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-muted" />
                    <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Recent Services</h2>
                  </div>
                  <button onClick={() => setTab('history')} className="text-[10px] font-black text-navy uppercase tracking-widest hover:underline">
                    View All →
                  </button>
                </div>
                <div className="space-y-2">
                  {serviceHistory.slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center gap-3 bg-surface dark:bg-surface-high/30 rounded-2xl border border-overlay p-3">
                      <div className="w-7 h-7 rounded-xl bg-navy/10 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-3.5 h-3.5 text-navy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-on-surface truncate">{r.serviceType}</p>
                        <p className="text-[10px] text-muted">{new Date(r.date).toLocaleDateString()} · {r.mileage.toLocaleString()} mi</p>
                      </div>
                      {r.cost > 0 && <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">${r.cost}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-on-surface">Maintenance History</h2>
            <div className="flex gap-2">
              <button onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-overlay rounded-xl text-xs font-black text-muted hover:bg-surface-low transition-colors">
                <Download className="w-3.5 h-3.5" /> Export Report
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Service
              </button>
            </div>
          </div>
          <ServiceHistoryTimeline records={serviceHistory} onExport={handleExport} />
        </div>
      )}

      {/* SEASONAL TAB */}
      {tab === 'seasonal' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-on-surface">Seasonal Checklists</h2>
          <p className="text-sm text-muted -mt-2">Based on your selected region: <strong>{prefs.region === 'hot' ? 'Hot Climate' : prefs.region === 'cold' ? 'Cold / Winter' : 'Temperate'}</strong></p>
          {checklists.map(cl => (
            <SeasonalChecklist key={cl.id} checklist={cl} onUpdate={handleChecklistUpdate} />
          ))}
        </div>
      )}

      {/* FLUIDS TAB */}
      {tab === 'fluids' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-on-surface">Fluid Check Guide</h2>
          <FluidCheckGuide />
        </div>
      )}

      {/* ADVISOR TAB */}
      {tab === 'advisor' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-on-surface">Is This Worth Fixing?</h2>
          <WorthFixingAdvisor />
        </div>
      )}

      {/* Add Record Modal */}
      <AddServiceRecordModal
        isOpen={showAddModal}
        vehicleId={selectedId || ''}
        currentMileage={mileage}
        onClose={() => setShowAddModal(false)}
        onSaved={handleAddRecord}
      />
    </div>
  )
}
