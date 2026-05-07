import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import {
  Car, Plus, Download,
  Sun, Droplets, History, Scale,
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
  const { t } = useTranslation()
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
  const healthScore = calculateHealthScore(statuses, serviceHistory)

  const urgentItems = [...overdue, ...dueNow]
  const upcomingItems = dueSoon.slice(0, 2)

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  if (!vehicles.length) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-16 bg-[#f8fafc] min-h-screen">
        <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Car className="w-10 h-10 text-slate-300" /></div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t('app.dashboard.garage_empty')}</h2>
        <p className="text-slate-500 mb-8 font-medium">{t('maintenance.no_vehicles_desc')}</p>
        <Link to="/dashboard/vehicles" className="inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">{t('maintenance.go_to_garage')}</Link>
      </div>
    )
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 pb-24">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[30%] bg-emerald-400/5 blur-[100px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {view === 'hub' ? (
          <motion.div 
            key="hub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10"
          >
            {/* ── Crystal Header ── */}
            <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm px-4 h-16 flex items-center justify-between mb-6">
              <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              
              <div className="flex-1 flex justify-center">
                <select
                  value={selectedId || ''}
                  onChange={e => setSelectedId(e.target.value)}
                  className="bg-transparent border-none p-0 text-sm font-black text-slate-900 uppercase tracking-widest outline-none focus:ring-0 cursor-pointer text-center"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.year} {v.make}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 max-w-xl mx-auto space-y-6">
              
              {/* ── Settings Drawer ── */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white/60 backdrop-blur-xl border border-white rounded-[32px] shadow-xl shadow-slate-200/30 px-6"
                  >
                    <div className="py-6 space-y-5">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('maintenance.vehicle_settings')}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{t('maintenance.current_mileage')}</label>
                          <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 font-bold text-slate-900 text-sm outline-none focus:border-blue-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{t('maintenance.avg_miles_month')}</label>
                          <input type="number" value={prefs.avgMilesPerMonth} onChange={e => setPrefs(p => ({ ...p, avgMilesPerMonth: Number(e.target.value) }))}
                            className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 font-bold text-slate-900 text-sm outline-none focus:border-blue-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{t('maintenance.driving_style')}</label>
                          <select value={prefs.drivingStyle} onChange={e => setPrefs(p => ({ ...p, drivingStyle: e.target.value as any }))}
                            className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400">
                            <option value="city">{t('maintenance.driving_styles.city')}</option>
                            <option value="highway">{t('maintenance.driving_styles.highway')}</option>
                            <option value="mixed">{t('maintenance.driving_styles.mixed')}</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{t('maintenance.climate')}</label>
                          <select value={prefs.region} onChange={e => setPrefs(p => ({ ...p, region: e.target.value as any }))}
                            className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-400">
                            <option value="hot">{t('maintenance.climates.hot')}</option>
                            <option value="cold">{t('maintenance.climates.cold')}</option>
                            <option value="temperate">{t('maintenance.climates.temperate')}</option>
                          </select>
                        </div>
                      </div>
                      <button onClick={savePrefs} disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        {saving ? t('common.saving') : t('maintenance.update_details')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Compact Health Card ── */}
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-xl shadow-slate-200/30 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('app.dashboard.health_score')}</p>
                   <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{healthScore.total}</span>
                      <span className="text-sm font-bold text-slate-500 mb-1">/100</span>
                   </div>
                   <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${healthScore.total >= 70 ? 'text-emerald-500' : healthScore.total >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                     {healthScore.label}
                   </p>
                </div>
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-slate-100" strokeWidth="12" fill="none" />
                    <circle cx="50" cy="50" r="40" className={healthScore.total >= 70 ? 'stroke-emerald-500' : healthScore.total >= 40 ? 'stroke-amber-500' : 'stroke-rose-500'} strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * healthScore.total) / 100} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className={`w-6 h-6 ${healthScore.total >= 70 ? 'text-emerald-500' : healthScore.total >= 40 ? 'text-amber-500' : 'text-rose-500'}`} />
                  </div>
                </div>
              </div>

              {/* ── Log Service Button ── */}
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">{t('maintenance.add_record')}</span>
              </button>

              {/* ── Urgent & Upcoming (Compact) ── */}
              {urgentItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('maintenance.urgent_action')}</h2>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[28px] shadow-xl shadow-slate-200/30 overflow-hidden">
                    <MaintenanceReminderCard status={urgentItems[0]} currentMileage={mileage} onLogService={handleLogService} />
                  </div>
                </div>
              )}

              {upcomingItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('maintenance.upcoming')}</h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {upcomingItems.slice(0, 1).map(s => (
                       <div key={s.item.id} className="bg-white/60 backdrop-blur-xl border border-white rounded-[28px] shadow-xl shadow-slate-200/30 overflow-hidden">
                         <MaintenanceReminderCard status={s} currentMileage={mileage} onLogService={handleLogService} />
                       </div>
                    ))}
                  </div>
                  <button onClick={() => setView('full-plan')} className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 shadow-sm active:scale-95 transition-all">
                     {t('maintenance.view_full_plan')}
                  </button>
                </div>
              )}

              {/* ── Feature Navigation Grid ── */}
              <div>
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">{t('maintenance.tools')}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'history', label: t('maintenance.history'), icon: History, sub: t('maintenance.tool_subs.history'), color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                      { id: 'seasonal', label: t('maintenance.seasonal'), icon: Sun, sub: t('maintenance.tool_subs.seasonal'), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                      { id: 'fluids', label: t('maintenance.fluids'), icon: Droplets, sub: t('maintenance.tool_subs.fluids'), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                      { id: 'advisor', label: t('maintenance.advisor'), icon: Scale, sub: t('maintenance.tool_subs.advisor'), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    ].map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => setView(f.id as View)}
                        className="bg-white/60 backdrop-blur-xl border border-white p-5 rounded-[28px] flex flex-col items-center text-center gap-2 hover:shadow-xl shadow-md shadow-slate-200/20 active:scale-95 transition-all"
                      >
                        <div className={`w-10 h-10 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center mb-1 shadow-sm`}>
                          <f.icon className={`w-5 h-5 ${f.color}`} />
                        </div>
                        <p className="text-sm font-black text-slate-900">{f.label}</p>
                        <p className="text-[9px] text-slate-500 font-bold">{f.sub}</p>
                      </button>
                    ))}
                 </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="subview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10"
          >
            {/* ── Subview Header ── */}
            <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm px-4 py-4 flex items-center gap-4 mb-6">
              <button 
                onClick={() => setView('hub')}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {view === 'history' && t('maintenance.history_title')}
                  {view === 'seasonal' && t('maintenance.seasonal_title')}
                  {view === 'fluids' && t('maintenance.fluids_title')}
                  {view === 'advisor' && t('maintenance.advisor')}
                  {view === 'full-plan' && t('maintenance.plan_title')}
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {vehicle?.year} {vehicle?.make} {vehicle?.model}
                </p>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="px-4 max-w-xl mx-auto space-y-6">
              {view === 'history' && (
                <div className="space-y-6">
                  <div className="flex gap-3">
                    <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 shadow-sm rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 active:scale-95 transition-all">
                      <Download className="w-4 h-4" /> {t('maintenance.export_pdf')}
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white shadow-xl shadow-slate-900/20 rounded-[20px] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                      <Plus className="w-4 h-4" /> {t('maintenance.add_record')}
                    </button>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-2 shadow-xl shadow-slate-200/30">
                     <ServiceHistoryTimeline records={serviceHistory} onExport={handleExport} />
                  </div>
                </div>
              )}

              {view === 'seasonal' && (
                <div className="space-y-6">
                  <div className="bg-white/60 backdrop-blur-xl border border-white p-5 rounded-[28px] flex items-center gap-4 shadow-xl shadow-slate-200/30">
                    <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                       <Sun className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('maintenance.climate')}: {t(`maintenance.climates.${prefs.region}`)}</p>
                       <p className="text-sm font-bold text-slate-900">Customized climate checks</p>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-2 shadow-xl shadow-slate-200/30">
                    {checklists.map(cl => (
                      <SeasonalChecklist key={cl.id} checklist={cl} onUpdate={handleChecklistUpdate} />
                    ))}
                  </div>
                </div>
              )}

              {view === 'fluids' && (
                <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-2 shadow-xl shadow-slate-200/30">
                   <FluidCheckGuide />
                </div>
              )}

              {view === 'advisor' && (
                <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-2 shadow-xl shadow-slate-200/30">
                   <WorthFixingAdvisor />
                </div>
              )}

              {view === 'full-plan' && (
                <div className="space-y-8">
                   <section>
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">{t('maintenance.complete_schedule')}</h2>
                      <div className="space-y-4">
                        {statuses.map(s => (
                          <div key={s.item.id} className="bg-white/60 backdrop-blur-xl border border-white rounded-[28px] shadow-xl shadow-slate-200/30 overflow-hidden">
                             <MaintenanceReminderCard status={s} currentMileage={mileage} onLogService={handleLogService} />
                          </div>
                        ))}
                      </div>
                   </section>
                   <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                         <Info className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">{t('maintenance.data_sources')}</h3>
                        <p className="text-xs text-blue-800/70 font-medium leading-relaxed">
                          {t('maintenance.disclaimer_text')}
                        </p>
                      </div>
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

    </div>
  )
}
