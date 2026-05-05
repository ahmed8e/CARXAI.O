import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import InstallPrompt from '../components/InstallPrompt'
import { 
  Users, ChevronRight, AlertCircle, 
  ShieldAlert, Wrench, ShieldCheck, 
  Navigation, Car,
  Zap, Plus, Thermometer, Battery, Activity
} from 'lucide-react'
import DevelopmentModal from '../components/DevelopmentModal'
import UpgradePrompt from '../components/ui/UpgradePrompt'
import { useSubscription } from '../hooks/useSubscription'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [defaultVehicle, setDefaultVehicle] = useState<any>(null)
  const [loadingVehicle, setLoadingVehicle] = useState(true)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { isFree } = useSubscription()
  
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
      
      if (data) {
        setDefaultVehicle(data)
      } else {
        // Fetch first vehicle if no default is set
        const { data: firstVal } = await (supabase as any)
          .from('vehicles')
          .select('*')
          .eq('user_id', user?.id)
          .limit(1)
          .maybeSingle()
        if (firstVal) setDefaultVehicle(firstVal)
      }
    } catch (err) {
      console.log('No default vehicle found')
    } finally {
      setLoadingVehicle(false)
    }
  }

  const modules = [
    {
      to: '/dashboard/avoid-overpaying',
      icon: ShieldCheck,
      label: 'Avoid Overpaying',
      desc: 'Verify if your mechanic\'s quote is fair.',
      color: '#10b981', // emerald-500
      bg: 'rgba(16, 185, 129, 0.06)',
      badge: 'Protection',
      locked: false,
    },
    {
      to: '/dashboard/ai-mechanic',
      icon: ShieldAlert,
      label: 'AI Mechanic',
      desc: 'Get instant AI diagnosis and urgency level.',
      color: '#0070E0',
      bg: 'rgba(0, 112, 224, 0.06)',
      badge: 'AI Powered',
      locked: false,
    },
    {
      to: '/dashboard/reports',
      icon: Activity,
      label: 'Diagnostic Reports',
      desc: 'View your previous vehicle diagnostic history.',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.06)',
      badge: 'History',
      locked: false,
    },
    {
      to: '/dashboard/maintenance',
      icon: Wrench,
      label: 'Smart Maintenance',
      desc: 'Track and forecast your car\'s maintenance needs.',
      color: '#f59e0b', // amber-500
      bg: 'rgba(245, 158, 11, 0.06)',
      badge: 'Tracking',
      locked: false,
    },
  ]

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto bg-transparent">
      {/* 1. Status Strip */}
      <div className="flex items-center justify-between gap-3 mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">System Ready</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-navy/5 border border-navy/10 text-navy font-black text-[9px] uppercase tracking-widest">
            AI Pro Unlocked
          </div>
          {defaultVehicle && (
             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
               <Car className="w-3 h-3" /> {defaultVehicle.make}
             </div>
          )}
        </div>
      </div>

      {/* 2. Short Premium Hero */}
      <div className="mb-8 px-1">
        <p className="text-xs font-bold text-muted mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}</p>
        <h1 className="text-2xl md:text-3xl font-display font-black text-on-surface italic tracking-tight leading-tight">
          What do you need<br />help with today?
        </h1>
      </div>

      {/* 3. Main Action Grid (2x2) */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {modules.map((mod) => (
          <motion.div key={mod.to} whileTap={{ scale: 0.97 }}>
            <Link 
              to={mod.to} 
              onClick={(e) => {
                if (mod.to === '/dashboard/map') {
                  e.preventDefault()
                  setIsDevModalOpen(true)
                  return
                }
              }}
              className="relative overflow-hidden block h-full bg-surface dark:bg-surface border border-overlay rounded-3xl p-4 shadow-sm active:shadow-inner transition-all"
            >
              <div className="flex flex-col h-full">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm border border-transparent" style={{ background: mod.bg }}>
                  <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                </div>
                <h3 className="text-sm font-display font-black text-on-surface leading-tight mb-1">
                  {mod.label}
                </h3>
                <p className="text-[10px] text-muted font-medium leading-normal line-clamp-2">{mod.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 4. Compact Vehicle Card */}
      <div className="mb-10">
        {!defaultVehicle && !loadingVehicle ? (
          <Link to="/dashboard/vehicles" className="group flex items-center gap-4 bg-white border border-slate-100 p-5 rounded-[28px] transition-all hover:shadow-lg hover:shadow-slate-200/50 shadow-sm shadow-slate-200/20">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors group-hover:bg-blue-50 group-hover:border-blue-100">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-display font-black text-slate-900 uppercase tracking-widest mb-0.5">Add your vehicle</p>
              <p className="text-[10px] text-slate-400 font-medium">Unlock precise AI help for your specific car.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
          </Link>
        ) : defaultVehicle ? (
          <Link to="/dashboard/vehicles" className="flex items-center gap-4 bg-surface dark:bg-surface-low/80 border border-overlay p-4 rounded-3xl shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-surface-low dark:bg-surface-low flex items-center justify-center shadow-sm overflow-hidden">
               <Car className="w-6 h-6 text-navy/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-navy uppercase tracking-widest mb-0.5">Active Vehicle</p>
              <h3 className="text-sm font-display font-black text-on-surface truncate italic tracking-tight">
                {defaultVehicle.year} {defaultVehicle.make} {defaultVehicle.model}
              </h3>
            </div>
            <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="h-20 w-full animate-pulse bg-surface-low dark:bg-surface-low rounded-3xl" />
        )}
      </div>

      {/* 5. Quick Issue Shortcuts */}
      <div className="mb-12">
        <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-4 px-1">Quick Diagnosis</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {[
            { label: 'Check Engine', icon: Activity },
            { label: 'Car Won\'t Start', icon: Zap },
            { label: 'Strange Noise', icon: AlertCircle },
            { label: 'Battery Prob', icon: Battery },
            { label: 'Brake Warning', icon: ShieldAlert },
            { label: 'Overheating', icon: Thermometer },
          ].map((issue, idx) => (
            <button 
              key={idx}
              onClick={() => navigate('/dashboard/ai-mechanic', { state: { initialIssue: issue.label } })}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-surface dark:bg-surface-low/80 border border-overlay shadow-sm hover:border-navy/30 transition-all whitespace-nowrap active:scale-95"
            >
              <issue.icon className="w-3.5 h-3.5 text-navy" />
              <span className="text-[11px] font-bold text-on-surface">{issue.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* 7. Lower Utility Zone */}
      <div>
        <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-4 px-1">System Utilities</p>
        <div className="grid grid-cols-1 gap-2">
          {[
            { label: 'Diagnostic Reports', icon: ShieldCheck, to: '/dashboard/reports' },
            { label: 'Support & Docs', icon: Wrench, to: '/support' },
            { label: 'Account Maintenance', icon: Users, to: '/my-account' },
          ].map((item, idx) => (
            <Link 
              key={idx} 
              to={item.to}
              className="flex items-center gap-4 bg-surface/40 dark:bg-surface-high/40 border border-overlay p-4 rounded-2xl hover:bg-surface dark:hover:bg-slate-800 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-surface-high dark:bg-surface-high flex items-center justify-center text-muted group-hover:text-navy transition-colors">
                <item.icon className="w-4 h-4" />
              </div>
              <span className="flex-1 text-xs font-bold text-on-surface">{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-navy" />
            </Link>
          ))}
        </div>
      </div>
      <InstallPrompt />
      
      <DevelopmentModal 
        isOpen={isDevModalOpen} 
        onClose={() => setIsDevModalOpen(false)} 
      />

      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </div>
  )
}
