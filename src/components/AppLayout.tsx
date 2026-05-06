import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, LogOut,
  Wrench, Car, ChevronRight, Settings, X,
  Activity, ShieldCheck
} from 'lucide-react'
import ShieldWrenchIcon from './ui/ShieldWrenchIcon'
import Navbar from './Navbar'
import Paywall from './Paywall'
import DevelopmentModal from './DevelopmentModal'
import { useSubscription } from '../hooks/useSubscription'
import { BrandLockup } from './ui/Brand'
import { LanguageSelector } from './ui/LanguageSelector'

// ── Navigation groups ────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'nav.diagnosis',
    items: [
      { to: '/dashboard',              icon: LayoutDashboard, label: 'nav.dashboard',       end: true  },
      { to: '/dashboard/ai-mechanic',  icon: ShieldWrenchIcon,   label: 'nav.mechanic' },
      { to: '/dashboard/vehicles',     icon: Car,             label: 'nav.garage' },
      { to: '/dashboard/maintenance',  icon: Wrench,          label: 'nav.maintenance' },
      { to: '/dashboard/reports',      icon: Activity,        label: 'nav.reports'     },
    ],
  },
]

interface AppLayoutProps { children: React.ReactNode }

import { InteractiveMenu } from './ui/modern-mobile-menu'
import type { InteractiveMenuItem } from './ui/modern-mobile-menu'

const BOTTOM_NAV_ITEMS: InteractiveMenuItem[] = [
  { to: '/dashboard/vehicles',         icon: Car,             label: 'nav.mobile.garage' },
  { to: '/dashboard',                  icon: LayoutDashboard, label: 'nav.mobile.dashboard' },
  { to: '/dashboard/maintenance',      icon: Wrench,          label: 'nav.mobile.maintenance' },
  { to: '/dashboard/avoid-overpaying', icon: ShieldCheck,     label: 'nav.mobile.overpaying' },
  { to: '/my-account',                 icon: Settings,        label: 'nav.mobile.settings' },
]

export default function AppLayout({ children }: AppLayoutProps) {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAIMechanic = location.pathname === '/dashboard/ai-mechanic'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'U'
  const userName    = user?.email?.split('@')[0] ?? 'User'

  const { subscription, loading: subLoading, isFree } = useSubscription()
  
  // Trial expiration logic
  const isExpired = subscription?.status === 'expired' && !isFree

  // ── Sidebar JSX ──────────────────────────────────────────────────
  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="flex flex-col h-full bg-surface-low dark:bg-surface-low">

        {/* ── Brand header ── */}
        <div className="px-5 pt-[calc(1.25rem_+_env(safe-area-inset-top))] pb-4 border-b border-overlay">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center group overflow-hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <BrandLockup size="md" className="group-hover:scale-[1.02] transition-transform" />
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
                {t(group.label)}
              </p>

              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'end' in item ? item.end : false}
                    onClick={(e) => {
                      if (item.to === '/dashboard/map') {
                        e.preventDefault()
                        setIsDevModalOpen(true)
                      } else {
                        setSidebarOpen(false)
                      }
                    }}
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

                        <span className="flex-1 leading-none">{t(item.label)}</span>


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
                    <p className="text-[11px] font-bold text-on-surface leading-none tracking-tight">{t('app.dashboard.engine_ready')}</p>
                    <p className="text-[9px] text-muted mt-0.5 tracking-wide">{t('common.available_24_7')}</p>
                  </div>
                  <ShieldWrenchIcon className="w-3.5 h-3.5 text-navy/25 flex-shrink-0" />
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* ── Account ── */}
        <div className="px-3 pt-3 pb-[calc(1rem_+_env(safe-area-inset-bottom))] border-t border-overlay space-y-3">
          
          {/* Language Switcher */}
          <div className="px-1">
            <LanguageSelector className="w-full" />
          </div>

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
              'flex-shrink-0 shadow-sm ring-2 overflow-hidden ring-navy/20 bg-gradient-to-br from-navy to-blue-400',
            ].join(' ')}>
              {user?.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                : userInitial}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-on-surface truncate leading-tight">{userName}</p>
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
            {t('common.logout')}
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
          <div className="fixed inset-0 z-[100] flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="relative w-[232px] h-full flex-shrink-0 z-10 shadow-2xl overflow-hidden"
            >
              <SidebarContent mobile />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden relative ${isAIMechanic ? 'pt-0 pb-0' : 'pt-[calc(5.5rem_+_env(safe-area-inset-top))] pb-32 lg:pb-0'}`}>
        <main className={`flex-1 relative ${isAIMechanic ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {subLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-[100]">
              <div className="flex flex-col items-center gap-4">
                <LayoutDashboard className="w-10 h-10 text-navy animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40">Securing Access...</p>
              </div>
            </div>
          ) : isExpired ? (
            <Paywall />
          ) : (
            children
          )}
        </main>
      </div>

      <AnimatePresence>
        {!isAIMechanic && !sidebarOpen && (
          <motion.div 
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[90]"
          >
            <InteractiveMenu items={BOTTOM_NAV_ITEMS} />
          </motion.div>
        )}
      </AnimatePresence>
      <DevelopmentModal 
        isOpen={isDevModalOpen} 
        onClose={() => setIsDevModalOpen(false)} 
      />
    </div>
  )
}
