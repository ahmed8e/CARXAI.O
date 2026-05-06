import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import {
  Car, Plus, Download, Calculator,
  Sun, Droplets, History, Scale, ChevronRight,
  AlertTriangle, Activity, Info,
  Settings, ArrowLeft, Calendar
} from 'lucide-react'

import {
  DEFAULT_SCHEDULE, calculateMaintenanceStatus, calculateHealthScore,
  getSeasonalChecklists,
  type MaintenanceItem, type MaintenancePrefs, type ServiceRecord,
  type MaintenanceStatus, type SeasonalChecklistData, type ChecklistItem
} from '../data/maintenanceData'


import MaintenanceReminderCard from '../components/maintenance/MaintenanceReminderCard'
import ServiceHistoryTimeline from '../components/maintenance/ServiceHistoryTimeline'
import SeasonalChecklist from '../components/maintenance/SeasonalChecklist'
import WorthFixingAdvisor from '../components/maintenance/WorthFixingAdvisor'
import FluidCheckGuide from '../components/maintenance/FluidCheckGuide'
import AddServiceRecordModal from '../components/maintenance/AddServiceRecordModal'

interface Vehicle {
  id: string; make: string; model: string; year: number; mileage: number | null; is_default?: boolean
}

type View = 'hub' | 'history' | 'seasonal' | 'fluids' | 'advisor' | 'full-plan'

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
  const [view, setView] = useState<View>('hub')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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
    setTimeout(() => {
      setSaving(false)
      setShowSettings(false)
    }, 600)
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
  const health = calculateHealthScore(statuses, serviceHistory)

  const urgentItems = [...overdue, ...dueNow]
  const upcomingItems = dueSoon.slice(0, 2)

  const forecast90 = statuses.reduce((acc, s) => {
    const mi = s.nextDueMileage - mileage
    const days = s.daysUntilDue
    if (s.status !== 'good' || days <= 90 || mi <= prefs.avgMilesPerMonth * 3)
      return { low: acc.low + s.item.costLow, high: acc.high + s.item.costHigh }
    return acc
  }, { low: 0, high: 0 })

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" /></div>

  if (!vehicles.length) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-16">
        <div className="w-16 h-16 bg-surface-low rounded-2xl flex items-center justify-center mx-auto mb-4"><Car className="w-8 h-8 text-muted" /></div>
        <h2 className="text-2xl font-black text-on-surface mb-2">No Vehicles Found</h2>
        <p className="text-muted mb-6">Add a vehicle to start tracking maintenance.</p>
        <Link to="/dashboard/vehicles" className="btn-primary">Go to My Garage</Link>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto pb-32 lg:pb-10 min-h-screen">

      <AnimatePresence mode="wait">
        {view === 'hub' ? (
          <motion.div 
            key="hub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* ── Hub Header ── */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-navy animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/70">Maintenance Hub</span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedId || ''}
                    onChange={e => setSelectedId(e.target.value)}
                    className="bg-transparent border-none p-0 text-xl font-display font-black text-on-surface italic tracking-tight outline-none focus:ring-0 cursor-pointer"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-high/30 border border-overlay flex items-center justify-center text-muted hover:text-navy transition-colors shadow-sm"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* ── Settings Drawer (Simple Expand) ── */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-surface dark:bg-surface-high/30 rounded-[24px] border border-overlay px-5"
                >
                  <div className="py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1.5">Current Mileage</label>
                        <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))}
                          className="w-full bg-surface-low border border-overlay rounded-xl px-3 py-2 font-bold text-on-surface text-sm outline-none" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1.5">Avg mi/month</label>
                        <input type="number" value={prefs.avgMilesPerMonth} onChange={e => setPrefs(p => ({ ...p, avgMilesPerMonth: Number(e.target.value) }))}
                          className="w-full bg-surface-low border border-overlay rounded-xl px-3 py-2 font-bold text-on-surface text-sm outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1.5">Driving Style</label>
                        <select value={prefs.drivingStyle} onChange={e => setPrefs(p => ({ ...p, drivingStyle: e.target.value as any }))}
                          className="w-full bg-surface-low border border-overlay rounded-xl px-3 py-2 text-sm font-bold outline-none">
                          <option value="city">City</option>
                          <option value="highway">Highway</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted block mb-1.5">Climate Region</label>
                        <select value={prefs.region} onChange={e => setPrefs(p => ({ ...p, region: e.target.value as any }))}
                          className="w-full bg-surface-low border border-overlay rounded-xl px-3 py-2 text-sm font-bold outline-none">
                          <option value="hot">Hot Climate</option>
                          <option value="cold">Cold / Winter</option>
                          <option value="temperate">Temperate</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={savePrefs} disabled={saving} className="w-full py-3 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
                      {saving ? 'Saving...' : 'Update Vehicle Details'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Compact Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Car Health', value: `${health.total}%`, sub: health.label, color: health.total >= 65 ? 'text-emerald-500' : 'text-amber-500', icon: Activity },
                { label: 'Overdue', value: overdue.length, sub: 'services', color: overdue.length > 0 ? 'text-red-500' : 'text-emerald-500', icon: AlertTriangle },
                { label: 'Due Soon', value: dueSoon.length + dueNow.length, sub: 'reminders', color: 'text-amber-500', icon: Calendar },
                { label: '90-Day Est.', value: `$${forecast90.low}`, sub: 'budget', color: 'text-navy', icon: Calculator },
              ].map(s => (
                <div key={s.label} className="bg-surface dark:bg-surface-high/30 rounded-2xl border border-overlay p-3 flex items-center gap-3 shadow-sm">
                  <div className={`w-8 h-8 rounded-lg bg-surface-low flex items-center justify-center ${s.color.replace('text-', 'text-opacity-20 bg-')}`}>
                     <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-wider text-muted">{s.label}</p>
                    <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Primary Action ── */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-navy text-white rounded-2xl shadow-lg shadow-navy/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-widest">Log New Service Record</span>
            </button>

            {/* ── Urgent & Upcoming ── */}
            <div className="space-y-4">
              {urgentItems.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <h2 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">Urgent Action Required</h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {urgentItems.slice(0, 2).map(s => (
                      <MaintenanceReminderCard key={s.item.id} status={s} currentMileage={mileage} onLogService={handleLogService} />
                    ))}
                  </div>
                </section>
              )}

              {upcomingItems.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <h2 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">Upcoming Maintenance</h2>
                    </div>
                    <button onClick={() => setView('full-plan')} className="text-[9px] font-black text-navy uppercase tracking-widest hover:underline">Full Plan →</button>
                  </div>
                  <div className="space-y-3">
                    {upcomingItems.map(s => (
                      <MaintenanceReminderCard key={s.item.id} status={s} currentMileage={mileage} onLogService={handleLogService} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Feature Navigation Grid ── */}
            <section>
               <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 px-1 text-center">Maintenance Tools</h2>
               <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'history', label: 'Service History', icon: History, sub: 'Full record timeline', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { id: 'seasonal', label: 'Seasonal Checks', icon: Sun, sub: 'Weather-ready guides', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { id: 'fluids', label: 'Fluid Guide', icon: Droplets, sub: 'Visual self-check', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'advisor', label: 'Worth Fixing?', icon: Scale, sub: 'Repair vs Value', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  ].map(f => (
                    <button 
                      key={f.id} 
                      onClick={() => setView(f.id as View)}
                      className="bg-surface dark:bg-surface-high/30 border border-overlay p-4 rounded-3xl flex flex-col items-center text-center gap-2 hover:border-navy/20 transition-all shadow-sm active:scale-95"
                    >
                      <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center mb-1`}>
                        <f.icon className={`w-5 h-5 ${f.color}`} />
                      </div>
                      <p className="text-xs font-black text-on-surface">{f.label}</p>
                      <p className="text-[9px] text-muted font-medium">{f.sub}</p>
                    </button>
                  ))}
               </div>
            </section>

            {/* Full Plan Link */}
            <button 
              onClick={() => setView('full-plan')}
              className="w-full flex items-center justify-between px-6 py-4 bg-surface dark:bg-surface-high/30 border border-overlay rounded-2xl group"
            >
              <div className="flex items-center gap-3">
                <Calculator className="w-5 h-5 text-navy" />
                <div className="text-left">
                  <p className="text-xs font-black text-on-surface uppercase tracking-wider">Full Maintenance Plan</p>
                  <p className="text-[10px] text-muted font-medium">View all components and thresholds</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
            </button>

          </motion.div>
        ) : (
          <motion.div 
            key="subview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-20"
          >
            {/* ── Subview Header ── */}
            <div className="flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md py-4 z-20">
              <button 
                onClick={() => setView('hub')}
                className="w-10 h-10 rounded-xl bg-surface border border-overlay flex items-center justify-center text-on-surface hover:text-navy transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-display font-black text-on-surface italic tracking-tight">
                  {view === 'history' && 'Service History'}
                  {view === 'seasonal' && 'Seasonal Checklists'}
                  {view === 'fluids' && 'Fluid Check Guide'}
                  {view === 'advisor' && 'Worth Fixing Advisor'}
                  {view === 'full-plan' && 'Maintenance Plan'}
                </h1>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {vehicle?.year} {vehicle?.make} {vehicle?.model}
                </p>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="space-y-6">
              {view === 'history' && (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 py-3 border border-overlay rounded-xl text-[10px] font-black uppercase tracking-widest text-muted bg-surface">
                      <Download className="w-3.5 h-3.5" /> Export PDF
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                      <Plus className="w-3.5 h-3.5" /> Add Record
                    </button>
                  </div>
                  <ServiceHistoryTimeline records={serviceHistory} onExport={handleExport} />
                </div>
              )}

              {view === 'seasonal' && (
                <div className="space-y-6">
                  <div className="bg-surface border border-overlay p-4 rounded-2xl flex items-center gap-3">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <div>
                       <p className="text-xs font-black text-on-surface uppercase tracking-wider">Region: {prefs.region}</p>
                       <p className="text-[10px] text-muted">Showing guides for your local climate.</p>
                    </div>
                  </div>
                  {checklists.map(cl => (
                    <SeasonalChecklist key={cl.id} checklist={cl} onUpdate={handleChecklistUpdate} />
                  ))}
                </div>
              )}

              {view === 'fluids' && <FluidCheckGuide />}

              {view === 'advisor' && <WorthFixingAdvisor />}

              {view === 'full-plan' && (
                <div className="space-y-8">
                   <section>
                      <h2 className="text-sm font-black text-on-surface uppercase tracking-widest mb-4 px-1">Current Maintenance Status</h2>
                      <div className="space-y-3">
                        {statuses.map(s => (
                          <MaintenanceReminderCard key={s.item.id} status={s} currentMileage={mileage} onLogService={handleLogService} />
                        ))}
                      </div>
                   </section>
                   <div className="bg-surface-low p-6 rounded-[32px] border border-overlay">
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-navy" />
                        <h3 className="text-sm font-black text-on-surface">Data Sources</h3>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        This plan is generated from industry standards and your vehicle profile. 
                        Actual service needs may vary based on specific manufacturer recommendations.
                      </p>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Record Modal */}
      <AddServiceRecordModal
        isOpen={showAddModal}
        vehicleId={selectedId || ''}
        currentMileage={mileage}
        onClose={() => setShowAddModal(false)}
        onSaved={handleAddRecord}
      />

      {/* ── Persistent Footer Disclaimer (only on hub) ── */}
      {view === 'hub' && (
        <div className="mt-12 pt-8 border-t border-overlay text-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/5 rounded-full mb-2">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Smart Estimation</span>
           </div>
           <p className="text-[10px] text-muted max-w-sm mx-auto leading-relaxed">
             This system uses standard automotive intervals. Always verify with your owner's manual for model-specific requirements.
           </p>
        </div>
      )}
    </div>
  )
}
