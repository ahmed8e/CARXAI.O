import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Users, CreditCard, BarChart3, MapPin,
  PlusCircle, Upload, Settings, LogOut, ChevronLeft,
  ChevronRight, Shield, Menu, X, Wrench
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '../../components/ui/Logo'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/providers', label: 'Providers', icon: MapPin },
  { to: '/admin/providers/add', label: 'Add Provider', icon: PlusCircle },
  { to: '/admin/providers/import', label: 'Import Providers', icon: Upload },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function SidebarLink({ to, label, icon: Icon, end, collapsed }: { to: string; label: string; icon: any; end?: boolean; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
          isActive
            ? 'bg-navy text-white shadow-md shadow-navy/20'
            : 'text-muted hover:bg-navy/5 hover:text-on-surface'
        }`
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="w-4.5 h-4.5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-on-surface text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {label}
        </div>
      )}
    </NavLink>
  )
}

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-overlay ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-md shadow-navy/25">
          <Logo size="100%" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-[12px] font-black uppercase tracking-widest text-navy">Carxai</p>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Admin Console</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <SidebarLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-overlay pt-4">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-navy/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy/70 flex items-center justify-center text-white text-xs font-black shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-on-surface truncate">{user?.email}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-2.5 h-2.5 text-navy" />
                <p className="text-[10px] font-black uppercase tracking-widest text-navy">Admin</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-red-50 hover:text-red-500 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f5f7fa] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-overlay transition-all duration-300 relative shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-overlay rounded-full flex items-center justify-center text-muted hover:text-navy hover:border-navy/20 transition-all shadow-sm z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-overlay z-50 flex flex-col"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-full bg-surface-low flex items-center justify-center text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-overlay px-5 py-3.5 flex items-center justify-between shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl bg-surface-low flex items-center justify-center text-muted"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted font-medium">
            <Shield className="w-3.5 h-3.5 text-navy" />
            <span className="text-[11px] font-black uppercase tracking-widest text-navy/60">Admin Console</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
