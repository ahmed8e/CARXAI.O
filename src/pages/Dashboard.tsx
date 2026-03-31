import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Users, ChevronRight, AlertCircle, Clock, ShieldAlert, Wrench, ShieldCheck, Radar, Navigation, ArrowRight, Lock } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.email?.split('@')[0] ?? 'Driver'
  const plan = user?.user_metadata?.subscription_tier || 'Basic'
  const isBasic = plan === 'Basic'

  const modules = [
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
      to: isBasic ? '/my-account?upgrade=pro' : '/dashboard/mechanic',
      icon: Users,
      label: 'Human Mechanic',
      desc: 'Find nearby mechanics and garages fast.',
      color: '#0891b2',
      bg: 'rgba(8, 145, 178, 0.06)',
      badge: 'Nearby',
      locked: isBasic,
    },
    {
      to: isBasic ? '/my-account?upgrade=pro' : '/dashboard/towing',
      icon: Wrench,
      label: 'Towing / Dépannage',
      desc: 'Get emergency towing help in minutes.',
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.06)',
      badge: 'Emergency',
      locked: isBasic,
    },
    {
      to: '/dashboard/map',
      icon: Navigation,
      label: 'Nearby Help Map',
      desc: 'Browse nearby providers on the map.',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.06)',
      badge: 'Map View',
      locked: false,
    },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen bg-mesh">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">System Ready</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy/5 border border-navy/10 text-navy font-black text-[10px] uppercase tracking-widest">
            {plan} Plan
          </div>
        </div>
        <h1 className="text-3xl font-display font-medium text-slate-400 mb-1">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}
        </h1>
        <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 italic tracking-tight">What do you need help with?</h2>
      </div>

      {/* Emergency Banner */}
      <div className="flex items-center gap-4 p-5 rounded-3xl mb-8 border border-orange-100 bg-orange-50/50">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Need emergency help right now?</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Start with AI diagnosis or jump straight to towing.</p>
        </div>
        <motion.div 
          className="flex-shrink-0"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button 
            onClick={() => navigate(isBasic ? '/my-account?upgrade=pro' : '/dashboard/towing')}
            className={`text-xs font-bold px-5 py-2.5 rounded-xl text-white shadow-lg flex items-center gap-2 ${isBasic ? 'bg-slate-400 shadow-slate-400/20 cursor-pointer' : 'bg-orange-600 shadow-orange-600/20'}`}
          >
            {isBasic ? <><Lock className="w-3.5 h-3.5" /> Unlock Towing</> : <>Get Towing <ChevronRight className="w-3.5 h-3.5" /></>}
          </button>
        </motion.div>
      </div>

      {/* Main Module Grid */}
      <div className="grid md:grid-cols-2 gap-4 lg:gap-6 mb-12">
        {modules.map((mod) => (
          <motion.div key={mod.to} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Link to={mod.to} className={`card-hover group block h-full !p-8 !rounded-[32px] relative overflow-hidden ${mod.locked ? 'ring-1 ring-slate-200 bg-slate-50/50' : ''}`}>
              {mod.locked && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white mb-3 shadow-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-navy bg-white px-4 py-2 rounded-full shadow-sm">Upgrade Required</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-transparent" style={{ background: mod.bg }}>
                  <mod.icon className="w-6 h-6" style={{ color: mod.color }} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100" style={{ color: mod.color }}>{mod.badge}</span>
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2 group-hover:text-navy transition-colors italic tracking-tight flex items-center gap-2">
                {mod.label}
                {mod.locked && <Lock className="w-4 h-4 text-slate-300" />}
              </h3>
              <p className="text-base text-slate-500 font-medium leading-relaxed mb-8">{mod.desc}</p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: mod.locked ? '#94a3b8' : mod.color }}>
                {mod.locked ? 'Locked' : 'Initiate Process'} {!mod.locked && <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Radar, label: 'Instant AI Check', value: 'Ready', color: '#0070E0' },
          { icon: Clock, label: '<10s Avg Response', value: 'Active', color: '#0891b2' },
          { icon: ShieldCheck, label: '24/7 Access', value: 'Online', color: '#059669' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 text-center group hover:border-navy/20 hover:shadow-lg hover:shadow-navy/5 transition-all">
            <stat.icon className="w-6 h-6 mx-auto mb-3 text-slate-300 group-hover:text-navy transition-colors" style={{ color: stat.color }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
