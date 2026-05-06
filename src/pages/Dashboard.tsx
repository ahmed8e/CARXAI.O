import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import InstallPrompt from '../components/InstallPrompt'
import { 
  ChevronRight, AlertCircle, 
  ShieldAlert, Wrench, ShieldCheck, 
  Car, Zap, Plus, Battery, Activity
} from 'lucide-react'
import AiSparkleIcon from '../components/ui/AiSparkleIcon'
import DevelopmentModal from '../components/DevelopmentModal'
import UpgradePrompt from '../components/ui/UpgradePrompt'
import { 
  calculateMaintenanceStatus, 
  calculateHealthScore, 
  DEFAULT_SCHEDULE,
  type MaintenanceStatus,
  type MaintenancePrefs,
  type MaintenanceItem,
  type ServiceRecord
} from '../data/maintenanceData'
import MaintenanceReminderCard from '../components/maintenance/MaintenanceReminderCard'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [defaultVehicle, setDefaultVehicle] = useState<any>(null)
  const [loadingVehicle, setLoadingVehicle] = useState(true)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  
  // Maintenance State
  const [maintenanceStatuses, setMaintenanceStatuses] = useState<MaintenanceStatus[]>([])
  const [healthScore, setHealthScore] = useState<any>(null)
  
  const firstName = user?.email?.split('@')[0] ?? 'Driver'

  useEffect(() => {
    if (user) fetchDefaultVehicle()
  }, [user])

  const fetchDefaultVehicle = async () => {
    try {
      const { data } = await (supabase as any)
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_default', true)
        .maybeSingle()
      
      let vehicle = data
      if (!data) {
        const { data: firstVal } = await (supabase as any)
          .from('vehicles')
          .select('*')
          .eq('user_id', user?.id)
          .limit(1)
          .maybeSingle()
        if (firstVal) vehicle = firstVal
      }

      if (vehicle) {
        setDefaultVehicle(vehicle)
        loadMaintenanceData(vehicle)
      }
    } catch (err) {
      console.log('No default vehicle found')
    } finally {
      setLoadingVehicle(false)
    }
  }

  const loadMaintenanceData = (vehicle: any) => {
    const vid = vehicle.id
    const mileage = vehicle.mileage || 50000

    // Load Prefs
    const savedPrefs = localStorage.getItem(`maint_prefs_v2_${vid}`)
    const prefs: MaintenancePrefs = savedPrefs ? JSON.parse(savedPrefs) : {
      avgMilesPerMonth: 1000, drivingStyle: 'mixed', usageLevel: 'normal', region: 'temperate'
    }

    // Load Schedule
    const savedSched = localStorage.getItem(`maint_schedule_${vid}`)
    const schedule: MaintenanceItem[] = savedSched ? JSON.parse(savedSched) : DEFAULT_SCHEDULE.map(s => ({
      ...s,
      lastServiceMileage: Math.max(0, mileage - Math.round(s.intervalMiles * 0.7)),
      lastServiceDate: new Date(Date.now() - (s.intervalMonths * 0.6) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }))

    // Load History
    const savedHistory = localStorage.getItem(`maint_history_${vid}`)
    const history: ServiceRecord[] = savedHistory ? JSON.parse(savedHistory) : []

    // Calculate
    const statuses = schedule.map(item => calculateMaintenanceStatus(item, mileage, prefs))
    const health = calculateHealthScore(statuses, history)

    setMaintenanceStatuses(statuses)
    setHealthScore(health)
  }

  const modules = [
    {
      to: '/dashboard/avoid-overpaying',
      icon: ShieldCheck,
      label: 'Price Check',
      desc: 'Verify repair quotes',
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      to: '/dashboard/ai-mechanic',
      icon: AiSparkleIcon,
      label: 'AI Mechanic',
      desc: 'Instant diagnosis',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      to: '/dashboard/maintenance',
      icon: Wrench,
      label: 'Maintenance',
      desc: 'Track schedule',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      to: '/dashboard/reports',
      icon: Activity,
      label: 'Reports',
      desc: 'Diagnostic history',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      border: 'border-purple-100'
    },
  ]

  const urgentMaintenance = maintenanceStatuses.filter(s => s.status === 'overdue' || s.status === 'due')

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-24">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[30%] bg-blue-400/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[30%] bg-emerald-400/5 blur-[100px] rounded-full" />
      </div>



      <div className="max-w-xl mx-auto px-4 pt-6 relative z-10">
        
        {/* Greeting */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Welcome back, {firstName}</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            How can we help<br />with your car today?
          </h1>
        </div>

        {/* Active Vehicle Compact Card */}
        <div className="mb-6">
          {!defaultVehicle && !loadingVehicle ? (
            <Link to="/dashboard/vehicles" className="group flex items-center gap-4 bg-white/60 backdrop-blur-xl border border-white p-4 rounded-[24px] transition-all shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/50">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Garage Empty</p>
                <p className="text-sm font-black text-slate-900">Add your vehicle</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-all" />
            </Link>
          ) : defaultVehicle ? (
            <Link to="/dashboard/vehicles" className="flex items-center gap-4 bg-white/60 backdrop-blur-xl border border-white p-4 rounded-[28px] shadow-xl shadow-slate-200/30 active:scale-[0.98] transition-all">
              <div className="relative">
                <div className="w-14 h-14 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                  <Car className="w-6 h-6 text-slate-400" />
                </div>
                {healthScore && (
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white ${healthScore.total >= 70 ? 'bg-emerald-500' : healthScore.total >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                    {healthScore.total}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Vehicle</p>
                <h3 className="text-base font-black text-slate-900 truncate">
                  {defaultVehicle.year} {defaultVehicle.make} {defaultVehicle.model}
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </Link>
          ) : (
            <div className="h-20 w-full animate-pulse bg-slate-200/50 rounded-[28px]" />
          )}
        </div>

        {/* 2x2 Main Action Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {modules.map((mod) => (
            <motion.div key={mod.to} whileTap={{ scale: 0.96 }}>
              <Link 
                to={mod.to} 
                className="block h-full bg-white/60 backdrop-blur-xl border border-white rounded-[28px] p-5 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-slate-200/40 transition-all"
              >
                <div className={`w-10 h-10 rounded-2xl ${mod.bg} ${mod.border} border flex items-center justify-center mb-3 shadow-sm`}>
                  <mod.icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1 leading-tight">
                  {mod.label}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold leading-snug">{mod.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Urgent Action (Max 1) */}
        {urgentMaintenance.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-2">
               <div className="flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-rose-500" />
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Urgent Attention</h2>
               </div>
               {urgentMaintenance.length > 1 && (
                 <Link to="/dashboard/maintenance" className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                   +{urgentMaintenance.length - 1} More
                 </Link>
               )}
            </div>
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[28px] shadow-xl shadow-slate-200/30 overflow-hidden">
               <MaintenanceReminderCard 
                  status={urgentMaintenance[0]} 
                  currentMileage={defaultVehicle?.mileage || 50000} 
                  onLogService={() => navigate('/dashboard/maintenance')} 
               />
            </div>
          </div>
        )}

        {/* Horizontal Quick Issue Shortcuts */}
        <div className="mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Quick Diagnostics</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {[
              { label: 'Check Engine', icon: Activity, color: 'text-amber-500' },
              { label: 'Won\'t Start', icon: Zap, color: 'text-rose-500' },
              { label: 'Noise', icon: AlertCircle, color: 'text-slate-500' },
              { label: 'Battery', icon: Battery, color: 'text-blue-500' },
              { label: 'Brakes', icon: ShieldAlert, color: 'text-emerald-500' },
            ].map((issue, idx) => (
              <button 
                key={idx}
                onClick={() => navigate('/dashboard/ai-mechanic', { state: { initialIssue: issue.label } })}
                className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white px-4 py-3 rounded-[20px] shadow-md shadow-slate-200/20 active:scale-95 transition-all whitespace-nowrap"
              >
                <issue.icon className={`w-4 h-4 ${issue.color}`} />
                <span className="text-[11px] font-black text-slate-700">{issue.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
      
      <InstallPrompt />
      <DevelopmentModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} />
      <UpgradePrompt isOpen={showUpgradePrompt} onClose={() => setShowUpgradePrompt(false)} />
    </div>
  )
}
