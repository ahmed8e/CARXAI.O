import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Zap, LayoutDashboard, Users, LogOut, Menu, ShieldAlert, Navigation, Wrench
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/ai-mechanic', icon: ShieldAlert, label: 'AI Mechanic' },
  { to: '/dashboard/mechanic', icon: Users, label: 'Human Mechanic' },
  { to: '/dashboard/towing', icon: Wrench, label: 'Towing' },
  { to: '/dashboard/map', icon: Navigation, label: 'Nearby Map' },
]

interface AppLayoutProps {
  children: React.ReactNode
}
export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const firstName = user?.email?.split('@')[0] ?? 'Driver'
  const userInitial = firstName[0]?.toUpperCase() ?? 'U'

  function SidebarContent() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#041E2B', border: '1px solid rgba(205,255,0,0.4)', flexShrink: 0, boxShadow: '0 0 15px rgba(205,255,0,0.1)' }}>
            <Zap style={{ width: '18px', height: '18px' }} fill="#CDFF00" stroke="#CDFF00" />
          </div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#FFFFFF' }}>car</span>
            <span style={{ color: '#CDFF00' }}>x</span>
            <span style={{ color: '#FFFFFF' }}>.ai</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: isActive ? 'rgba(205,255,0,0.08)' : 'transparent',
                color: isActive ? '#CDFF00' : '#B8C6CC',
                border: isActive ? '1px solid rgba(205,255,0,0.15)' : '1px solid transparent',
              })}
            >
              <item.icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, flexShrink: 0, background: 'linear-gradient(135deg, #0E3882, #062B3D)', border: '1px solid rgba(255,255,255,0.1)', color: '#F4F7FF' }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{firstName}</p>
              <p style={{ fontSize: '11px', color: '#B8C6CC', margin: 0, opacity: 0.6 }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: '#B8C6CC', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.background = 'rgba(248,113,113,0.05)';
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#B8C6CC';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#062B3D', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside 
        style={{ 
          flexDirection: 'column', 
          width: '260px', 
          flexShrink: 0, 
          borderRight: '1px solid rgba(255,255,255,0.05)', 
          background: '#041E2B'
        }}
        className="hidden lg:flex"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="flex lg:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <aside 
            style={{ 
              position: 'relative', 
              width: '260px', 
              flexShrink: 0, 
              zIndex: 10, 
              borderRight: '1px solid rgba(255,255,255,0.05)', 
              background: '#041E2B'
            }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar (mobile only) */}
        <div 
          style={{ 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '16px 20px', 
            borderBottom: '1px solid rgba(255,255,255,0.05)', 
            background: '#062B3D',
            backdropFilter: 'blur(20px)' 
          }}
          className="flex lg:hidden"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#041E2B', border: '1px solid rgba(205,255,0,0.3)' }}>
              <Zap style={{ width: '14px', height: '14px' }} fill="#CDFF00" stroke="#CDFF00" />
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px' }}>
              <span style={{ color: '#FFFFFF' }}>car</span>
              <span style={{ color: '#CDFF00' }}>x</span>
              <span style={{ color: '#FFFFFF' }}>.ai</span>
            </span>
          </div>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8C6CC' }}>
            <Menu style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
