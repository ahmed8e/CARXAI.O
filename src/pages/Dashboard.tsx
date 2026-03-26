import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Users, ChevronRight, AlertCircle, Clock, ShieldAlert, Wrench, ShieldCheck, Radar, Navigation, ArrowRight } from 'lucide-react'

const modules = [
  {
    to: '/dashboard/ai-mechanic',
    icon: ShieldAlert,
    label: 'AI Mechanic',
    desc: 'Get instant AI diagnosis and urgency level.',
    color: '#CDFF00',
    bg: 'rgba(205,255,0,0.06)',
    badge: 'AI Powered',
  },
  {
    to: '/dashboard/mechanic',
    icon: Users,
    label: 'Human Mechanic',
    desc: 'Find nearby mechanics and garages fast.',
    color: '#57D6E8',
    bg: 'rgba(87,214,232,0.06)',
    badge: 'Nearby',
  },
  {
    to: '/dashboard/towing',
    icon: Wrench,
    label: 'Towing / Dépannage',
    desc: 'Get emergency towing help in minutes.',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.06)',
    badge: 'Emergency',
  },
  {
    to: '/dashboard/map',
    icon: Navigation,
    label: 'Nearby Help Map',
    desc: 'Browse nearby providers on the map.',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.06)',
    badge: 'Map View',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.email?.split('@')[0] ?? 'Driver'

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen bg-mesh">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Security Active</span>
        </div>
        <h1 className="text-3xl font-display font-medium text-white/50 mb-1">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}
        </h1>
        <h2 className="text-4xl md:text-5xl font-display font-black text-white italic tracking-tight">What do you need help with?</h2>
      </div>

      {/* Emergency Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-8 border border-orange-500/20" style={{ background: 'rgba(251,146,60,0.06)' }}>
        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-soft">Need emergency help right now?</p>
          <p className="text-xs text-muted">Start with AI diagnosis or jump straight to towing.</p>
        </div>
        <motion.div 
          className="flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/dashboard/towing" className="text-xs font-bold px-3 py-1.5 rounded-full text-navy shadow-[0_0_10px_rgba(205,255,0,0.2)]" style={{ background: '#CDFF00' }}>
            Get Towing <ChevronRight className="w-3.5 h-3.5 inline" />
          </Link>
        </motion.div>
      </div>

      {/* Main Module Grid */}
      <div className="grid md:grid-cols-2 gap-4 lg:gap-6 mb-12">
        {modules.map((mod) => (
          <motion.div key={mod.to} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Link to={mod.to} className="card-hover group block h-full !p-8 !rounded-[32px] border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <div className="flex items-start justify-between mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-lg" style={{ background: mod.bg, borderColor: mod.bg }}>
                <mod.icon className="w-6 h-6" style={{ color: mod.color }} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity bg-white/5 px-3 py-1 rounded-full border border-white/5" style={{ color: mod.color }}>{mod.badge}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-display font-black text-white mb-2 group-hover:text-[#CDFF00] transition-colors italic tracking-tight">{mod.label}</h3>
            <p className="text-base text-white/50 font-medium leading-relaxed mb-8">{mod.desc}</p>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest" style={{ color: mod.color }}>
              Initiate Diagnosis <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Radar, label: 'Instant AI Check', value: 'Ready', color: '#CDFF00' },
          { icon: Clock, label: '<10s Avg Response', value: 'Active', color: '#57D6E8' },
          { icon: ShieldCheck, label: '24/7 Access', value: 'Online', color: '#34d399' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center group hover:bg-white/[0.04] transition-all">
            <stat.icon className="w-5 h-5 mx-auto mb-2 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: stat.color }} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
