import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, LogOut,
  Wrench, Car, Zap, ChevronRight, Settings, X,
  CircuitBoard, MapPin, Sparkles
} from 'lucide-react'
import Navbar from './Navbar'

// ── Navigation groups ────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Diagnosis',
    items: [
      { to: '/dashboard',              icon: LayoutDashboard, label: 'Overview',       end: true  },
      { to: '/dashboard/ai-mechanic',  icon: CircuitBoard,    label: 'AI Mechanic',    badge: 'AI' },
      { to: '/dashboard/vehicles',     icon: Car,             label: 'My Vehicles'                },
    ],
  },
  {
    label: 'Get Help',
    items: [
      { to: '/dashboard/mechanic', icon: Users,  label: 'Find a Mechanic' },
      { to: '/dashboard/towing',   icon: Wrench, label: 'Towing Service'  },
      { to: '/dashboard/map',      icon: MapPin, label: 'Nearby Map'      },
    ],
  },
]

interface AppLayoutProps { children: React.ReactNode }

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'U'
  const userName    = user?.email?.split('@')[0] ?? 'User'
  const plan        = (user?.user_metadata?.subscription_tier as string) || 'Basic'
  const isPro       = plan !== 'Basic'

  // ── Sidebar JSX ──────────────────────────────────────────────────
  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="flex flex-col h-full bg-surface-low dark:bg-surface-low">

        {/* ── Brand header ── */}
        <div className="px-5 pt-[calc(1.25rem_+_env(safe-area-inset-top))] pb-4 border-b border-overlay">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3.5 group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-9 h-9 rounded-[14px] bg-navy flex items-center justify-center
                              shadow-[0_4px_12px_rgba(0,112,224,0.35)] group-hover:scale-105 transition-transform flex-shrink-0">
                <Zap className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <div className="leading-none">
                <p className="font-display font-black text-[16px] tracking-[-0.04em] text-on-surface">
                  car<span className="text-navy">x</span>ai
                </p>
                <p className="text-[10px] font-medium text-muted/70 mt-[4px] tracking-normal">
                  AI Mechanic Suite
                </p>
              </div>
            </Link>

            {mobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 rounded-xl flex items-center justify-center
                           hover:bg-surface-high/20 transition-colors text-muted/60 hover:text-muted/80 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 pt-4 pb-2 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {/* Group label */}
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted/80 px-2.5 mb-1.5">
                {group.label}
              </p>

              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'end' in item ? item.end : false}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => [
                      'flex items-center gap-2.5 pr-3 pl-2 py-2.5 rounded-2xl font-semibold text-[13.5px]',
                      'transition-all duration-150 group relative overflow-hidden',
                      isActive
                        ? 'bg-surface dark:bg-navy/10 text-navy shadow-[0_1px_6px_rgba(0,112,224,0.10)] border border-navy/10 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-navy'
                        : 'text-muted hover:bg-surface-high/70 hover:text-on-surface',
                    ].join(' ')}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Icon container */}
                        <span className={[
                          'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150',
                          isActive
                            ? 'bg-navy text-white shadow-sm shadow-navy/30'
                            : 'bg-transparent text-muted group-hover:bg-surface-high group-hover:text-on-surface',
                        ].join(' ')}>
                          <item.icon className="w-[15px] h-[15px]" />
                        </span>

                        <span className="flex-1 leading-none">{item.label}</span>

                        {/* AI badge */}
                        {'badge' in item && item.badge && (
                          <span className={[
                            'text-[8.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-[5px]',
                            isActive
                              ? 'bg-navy/10 text-navy'
                              : 'bg-navy/8 text-navy/70',
                          ].join(' ')}>
                            {item.badge}
                          </span>
                        )}

                        {/* Active indicator chevron */}
                        {isActive && (
                          <ChevronRight className="w-3 h-3 text-navy/40 flex-shrink-0" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* AI status strip — between the two groups */}
              {gi === 0 && (
                <div className="mx-1 mt-4 mb-1 flex items-center gap-3 px-3.5 py-3
                                rounded-2xl bg-surface dark:bg-surface-high/40 border border-overlay
                                shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <span className="relative flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-on-surface leading-none tracking-tight">AI Engine Ready</p>
                    <p className="text-[9px] text-muted mt-0.5 tracking-wide">Available 24/7</p>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-navy/25 flex-shrink-0" />
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* ── Account ── */}
        <div className="px-3 pt-3 pb-[calc(1rem_+_env(safe-area-inset-bottom))] border-t border-overlay space-y-1.5">
          {/* Profile card */}
          <Link
            to="/my-account"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-surface dark:bg-surface-high/40 border border-overlay
                       hover:border-navy/20 hover:shadow-sm transition-all duration-150 group"
          >
            {/* Avatar */}
            <div className={[
              'w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm',
              'flex-shrink-0 shadow-sm ring-2 overflow-hidden',
              isPro ? 'bg-gradient-to-br from-navy to-blue-400 ring-navy/20' : 'bg-surface-high/40 text-muted/60 ring-overlay',
            ].join(' ')}>
              {user?.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                : userInitial}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-on-surface truncate leading-tight">{userName}</p>
              <span className={[
                'inline-flex items-center text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-[5px] mt-0.5',
                isPro ? 'bg-navy/10 text-navy' : 'bg-slate-100 text-muted/70',
              ].join(' ')}>
                {plan}
              </span>
            </div>

            <Settings className="w-3.5 h-3.5 text-muted/60 group-hover:text-navy/50 flex-shrink-0 transition-colors" />
          </Link>

          {/* Sign out — minimal */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                       text-[11.5px] font-bold text-muted/60 hover:text-red-400
                       hover:bg-red-50/50 transition-all duration-200 tracking-wide"
          >
            <LogOut className="w-3 h-3 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-mesh flex h-[100dvh] overflow-hidden">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[232px] flex-shrink-0
                        border-r border-overlay z-40 pt-[calc(4rem_+_env(safe-area-inset-top))] bg-surface-low dark:bg-surface-low">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-[70] flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-low dark:bg-surface-low/95 backdrop-blur-sm shadow-2xl border-r border-overlay"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="relative w-[232px] flex-shrink-0 z-10 shadow-2xl"
            >
              <SidebarContent mobile />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-[calc(3.75rem_+_env(safe-area-inset-top))]">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
