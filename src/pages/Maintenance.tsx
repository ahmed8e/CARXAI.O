import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Wrench, Activity, AlertCircle, ShieldCheck, 
  Calendar, CheckCircle2, AlertTriangle, Info,
  Settings2, ChevronRight, Calculator, FileText, ChevronDown
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  mileage: number | null
}

interface MaintenancePrefs {
  avgMilesPerMonth: number
  drivingStyle: 'city' | 'highway' | 'mixed'
  usageLevel: 'light' | 'normal' | 'heavy'
}

interface ServiceItem {
  id: string
  service_type: string
  last_service_date: string // ISO date
  last_service_mileage: number
  interval_miles: number
  interval_months: number
  estimated_cost_low: number
  estimated_cost_high: number
  anti_scam_note: string
}

interface ServiceStatus {
  item: ServiceItem
  miles_since: number
  months_since: number
  next_due_mileage: number
  next_due_date: Date
  status: 'overdue' | 'due_now' | 'due_soon' | 'ok'
  urgency: 'low' | 'medium' | 'high'
  can_wait: boolean
  risk_if_delayed: string
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'oil',
    service_type: 'Oil Change',
    last_service_date: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 5 months ago
    last_service_mileage: 0,
    interval_miles: 5000,
    interval_months: 6,
    estimated_cost_low: 50,
    estimated_cost_high: 120,
    anti_scam_note: 'Upsell warning: engine flush is not always needed unless recommended by manufacturer.'
  },
  {
    id: 'brakes',
    service_type: 'Brake Pad Replacement',
    last_service_date: new Date(Date.now() - 20 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_service_mileage: 0,
    interval_miles: 50000,
    interval_months: 36,
    estimated_cost_low: 150,
    estimated_cost_high: 300,
    anti_scam_note: 'Rotors often just need resurfacing, not replacing, if caught early.'
  },
  {
    id: 'tires',
    service_type: 'Tire Rotation',
    last_service_date: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_service_mileage: 0,
    interval_miles: 7500,
    interval_months: 6,
    estimated_cost_low: 20,
    estimated_cost_high: 50,
    anti_scam_note: 'Some tire shops do this for free if you bought tires there.'
  },
  {
    id: 'filter',
    service_type: 'Engine Air Filter',
    last_service_date: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_service_mileage: 0,
    interval_miles: 30000,
    interval_months: 24,
    estimated_cost_low: 20,
    estimated_cost_high: 60,
    anti_scam_note: 'You can often replace this yourself in 5 minutes with a $15 part.'
  }
]

export default function Maintenance() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  
  const [mileage, setMileage] = useState<number>(0)
  const [prefs, setPrefs] = useState<MaintenancePrefs>({
    avgMilesPerMonth: 1000,
    drivingStyle: 'mixed',
    usageLevel: 'normal'
  })
  
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  useEffect(() => {
    if (user) fetchVehicles()
  }, [user])

  useEffect(() => {
    if (selectedVehicleId) {
      loadVehicleData(selectedVehicleId)
    }
  }, [selectedVehicleId])

  const fetchVehicles = async () => {
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id)
        
      if (data && data.length > 0) {
        setVehicles(data)
        const defaultVeh = data.find((v: any) => v.is_default) || data[0]
        setSelectedVehicleId(defaultVeh.id)
        setMileage(defaultVeh.mileage || 80000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadVehicleData = (vid: string) => {
    const v = vehicles.find(x => x.id === vid)
    if (v) setMileage(v.mileage || 80000)

    const savedPrefs = localStorage.getItem(`maint_prefs_${vid}`)
    if (savedPrefs) setPrefs(JSON.parse(savedPrefs))
      
    const savedServices = localStorage.getItem(`maint_services_${vid}`)
    if (savedServices) {
      setServices(JSON.parse(savedServices))
    } else {
      // Init defaults based on current mileage
      const defaultMileage = v?.mileage || 80000
      const initServices = DEFAULT_SERVICES.map(s => ({
        ...s,
        last_service_mileage: Math.max(0, defaultMileage - s.interval_miles + 1000) // fake some history
      }))
      setServices(initServices)
      localStorage.setItem(`maint_services_${vid}`, JSON.stringify(initServices))
    }
  }

  const saveVehicleData = async () => {
    if (!selectedVehicleId) return
    setSaving(true)
    
    // Save to local storage
    localStorage.setItem(`maint_prefs_${selectedVehicleId}`, JSON.stringify(prefs))
    localStorage.setItem(`maint_services_${selectedVehicleId}`, JSON.stringify(services))
    
    // Update Supabase mileage
    await supabase
      .from('vehicles')
      .update({ mileage })
      .eq('id', selectedVehicleId)
      
    // Update local vehicle state
    setVehicles(prev => prev.map(v => v.id === selectedVehicleId ? { ...v, mileage } : v))
    
    setTimeout(() => setSaving(false), 500)
  }

  const handleUpdateService = (id: string, newMileage: number, newDate: string) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, last_service_mileage: newMileage, last_service_date: newDate } : s
    ))
  }

  // --- Calculations ---
  const calculateStatus = (item: ServiceItem): ServiceStatus => {
    const milesSince = Math.max(0, mileage - item.last_service_mileage)
    
    const lastDate = new Date(item.last_service_date)
    const today = new Date()
    const monthsSince = (today.getFullYear() - lastDate.getFullYear()) * 12 + (today.getMonth() - lastDate.getMonth())
    
    const nextDueMileage = item.last_service_mileage + item.interval_miles
    const nextDueDate = new Date(lastDate)
    nextDueDate.setMonth(nextDueDate.getMonth() + item.interval_months)
    
    let status: ServiceStatus['status'] = 'ok'
    let urgency: ServiceStatus['urgency'] = 'low'
    let risk = 'Normal wear'
    
    if (item.id === 'oil') risk = 'Engine wear, sludge buildup, decreased efficiency'
    if (item.id === 'brakes') risk = 'Reduced stopping power, rotor damage (expensive)'
    if (item.id === 'tires') risk = 'Uneven wear, reduced traction, shorter tire life'
    if (item.id === 'filter') risk = 'Reduced MPG, sluggish acceleration'

    // Multipliers based on usage/style
    let modifier = 1.0
    if (prefs.usageLevel === 'heavy') modifier *= 0.8
    if (prefs.drivingStyle === 'city') modifier *= 0.9

    const adjIntervalMiles = item.interval_miles * modifier
    const adjNextDueMileage = item.last_service_mileage + adjIntervalMiles

    if (mileage >= adjNextDueMileage || today >= nextDueDate) {
      status = 'overdue'
      urgency = 'high'
    } else if (mileage >= adjNextDueMileage - 500 || today >= new Date(nextDueDate.getTime() - 30*24*60*60*1000)) {
      status = 'due_now'
      urgency = 'high'
    } else if (mileage >= adjNextDueMileage - 1500 || today >= new Date(nextDueDate.getTime() - 60*24*60*60*1000)) {
      status = 'due_soon'
      urgency = 'medium'
    }

    return {
      item,
      miles_since: milesSince,
      months_since: monthsSince,
      next_due_mileage: adjNextDueMileage,
      next_due_date: nextDueDate,
      status,
      urgency,
      can_wait: status === 'ok' || status === 'due_soon',
      risk_if_delayed: risk
    }
  }

  const statuses = services.map(calculateStatus)
  const overdue = statuses.filter(s => s.status === 'overdue')
  const dueNow = statuses.filter(s => s.status === 'due_now')
  const dueSoon = statuses.filter(s => s.status === 'due_soon')
  const ok = statuses.filter(s => s.status === 'ok')

  const actionNeeded = [...overdue, ...dueNow]

  // 90-day forecast
  let forecastLow = 0
  let forecastHigh = 0
  statuses.forEach(s => {
    // If due now/overdue, or due within 3 months (or next 3000 miles assuming 1000/mo)
    const monthsUntil = (s.next_due_date.getTime() - Date.now()) / (30*24*60*60*1000)
    const milesUntil = s.next_due_mileage - mileage
    if (s.status !== 'ok' || monthsUntil <= 3 || milesUntil <= (prefs.avgMilesPerMonth * 3)) {
      forecastLow += s.item.estimated_cost_low
      forecastHigh += s.item.estimated_cost_high
    }
  })

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" /></div>
  }

  if (vehicles.length === 0) {
    return (
      <div className="p-4 max-w-3xl mx-auto text-center mt-12">
        <div className="w-16 h-16 bg-surface-high rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-muted" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">No Vehicles Found</h2>
        <p className="text-muted mb-6">Add a vehicle to your garage to start tracking maintenance.</p>
        <Link to="/dashboard/vehicles" className="px-6 py-3 bg-navy text-white rounded-xl font-bold">Go to Garage</Link>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-on-surface tracking-tight italic mb-2">
            Smart Maintenance
          </h1>
          <p className="text-muted font-medium">
            AI-driven tracking to prevent breakdowns and avoid scams.
          </p>
        </div>

        <select 
          className="bg-surface border border-overlay rounded-xl px-4 py-2 text-sm font-bold text-on-surface outline-none focus:border-navy"
          value={selectedVehicleId || ''}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings & Forecast */}
        <div className="space-y-6">
          
          {/* Settings Card */}
          <div className="bg-surface dark:bg-surface-high/40 p-6 rounded-[24px] border border-overlay shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-navy" />
              <h2 className="text-lg font-bold text-on-surface">Vehicle Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Current Mileage</label>
                <input 
                  type="number" 
                  value={mileage} 
                  onChange={(e) => setMileage(Number(e.target.value))}
                  className="w-full bg-surface-low border border-overlay rounded-xl px-4 py-2.5 font-bold text-on-surface focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Driving Style</label>
                  <select 
                    value={prefs.drivingStyle}
                    onChange={(e) => setPrefs({...prefs, drivingStyle: e.target.value as any})}
                    className="w-full bg-surface-low border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="city">City (Stop/Go)</option>
                    <option value="highway">Highway</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">Usage Level</label>
                  <select 
                    value={prefs.usageLevel}
                    onChange={(e) => setPrefs({...prefs, usageLevel: e.target.value as any})}
                    className="w-full bg-surface-low border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy"
                  >
                    <option value="light">Light</option>
                    <option value="normal">Normal</option>
                    <option value="heavy">Heavy Duty</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={saveVehicleData}
                disabled={saving}
                className="w-full py-3 bg-navy text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-navy/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
              >
                {saving ? 'Updating...' : 'Update Logic'}
              </button>
            </div>
          </div>

          {/* 90-Day Forecast */}
          <div className="bg-gradient-to-br from-navy to-[#005bb5] p-6 rounded-[24px] text-white shadow-xl shadow-navy/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Calculator className="w-5 h-5 text-white/80" />
              <h2 className="text-sm font-bold text-white/90">90-Day Cost Forecast</h2>
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black tracking-tight mb-1">
                ${forecastLow} <span className="text-xl text-white/60 font-medium">—</span> ${forecastHigh}
              </p>
              <p className="text-xs text-white/70 font-medium">Estimated maintenance costs coming up.</p>
            </div>
          </div>

          {/* Records Placeholder */}
          <div className="bg-surface dark:bg-surface-high/40 p-6 rounded-[24px] border border-overlay border-dashed flex flex-col items-center justify-center text-center min-h-[160px]">
            <FileText className="w-8 h-8 text-muted/50 mb-3" />
            <h3 className="text-sm font-bold text-on-surface mb-1">Service Records</h3>
            <p className="text-xs text-muted max-w-[200px]">Upload receipts and proofs (Coming soon).</p>
          </div>

        </div>

        {/* Right Column: Timeline & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {actionNeeded.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-on-surface tracking-tight">Action Required</h2>
              </div>
              
              <div className="grid gap-4">
                {actionNeeded.map(s => <ServiceCard key={s.item.id} status={s} onUpdate={handleUpdateService} currentMileage={mileage} />)}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Activity className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-on-surface tracking-tight">Upcoming Soon</h2>
            </div>
            
            {dueSoon.length > 0 ? (
              <div className="grid gap-4">
                {dueSoon.map(s => <ServiceCard key={s.item.id} status={s} onUpdate={handleUpdateService} currentMileage={mileage} />)}
              </div>
            ) : (
              <div className="bg-surface border border-overlay rounded-[24px] p-6 text-center">
                <p className="text-sm text-muted">Nothing due soon. You're in good shape.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-on-surface tracking-tight">Healthy / Can Wait</h2>
            </div>
            
            <div className="grid gap-4">
              {ok.map(s => <ServiceCard key={s.item.id} status={s} onUpdate={handleUpdateService} currentMileage={mileage} />)}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function ServiceCard({ status, onUpdate, currentMileage }: { status: ServiceStatus, onUpdate: any, currentMileage: number }) {
  const [expanded, setExpanded] = useState(false)
  
  const isDanger = status.status === 'overdue' || status.status === 'due_now'
  const isWarn = status.status === 'due_soon'

  return (
    <div className={`bg-surface rounded-[24px] border overflow-hidden transition-all duration-200 ${
      isDanger ? 'border-red-200 dark:border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.05)]' : 
      isWarn ? 'border-amber-200 dark:border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.05)]' : 
      'border-overlay'
    }`}>
      {/* Top Banner */}
      <div className={`px-5 py-2.5 flex items-center justify-between border-b ${
        isDanger ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' : 
        isWarn ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' : 
        'bg-surface-low border-overlay'
      }`}>
        <div className="flex items-center gap-2">
          {isDanger && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
          {isWarn && <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          {!isDanger && !isWarn && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          <span className={`text-[11px] font-black uppercase tracking-widest ${
            isDanger ? 'text-red-600 dark:text-red-400' : 
            isWarn ? 'text-amber-600 dark:text-amber-400' : 
            'text-emerald-600 dark:text-emerald-400'
          }`}>
            {status.status === 'overdue' ? 'Overdue' : 
             status.status === 'due_now' ? 'Due Now' : 
             status.status === 'due_soon' ? 'Due Soon' : 'Healthy'}
          </span>
        </div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
          Next: {status.next_due_mileage.toLocaleString()} mi
        </span>
      </div>

      {/* Main Content */}
      <div className="p-5">
        <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div>
            <h3 className="text-lg font-black text-on-surface tracking-tight mb-1">{status.item.service_type}</h3>
            <p className="text-sm font-medium text-muted">
              Est. ${status.item.estimated_cost_low} – ${status.item.estimated_cost_high}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-low flex items-center justify-center flex-shrink-0">
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-5 border-t border-overlay space-y-4">
                
                {/* Risk & Scam notes */}
                <div className="bg-surface-low rounded-xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-on-surface block mb-0.5">Anti-Scam Note</span>
                      <span className="text-sm text-muted">{status.item.anti_scam_note}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-on-surface block mb-0.5">Risk if delayed</span>
                      <span className="text-sm text-muted">{status.risk_if_delayed}</span>
                    </div>
                  </div>
                </div>

                {/* Mark as done */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">Mark as serviced at (miles)</label>
                    <input 
                      type="number" 
                      defaultValue={currentMileage}
                      id={`miles-${status.item.id}`}
                      className="w-full bg-surface-low border border-overlay rounded-lg px-3 py-2 text-sm font-bold text-on-surface outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`miles-${status.item.id}`) as HTMLInputElement
                      if (input && input.value) {
                        onUpdate(status.item.id, Number(input.value), new Date().toISOString())
                        setExpanded(false)
                      }
                    }}
                    className="px-4 py-2 bg-navy text-white rounded-lg text-xs font-bold uppercase tracking-widest"
                  >
                    Save
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
