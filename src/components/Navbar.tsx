import { Link } from 'react-router-dom'
import { Zap, Menu, User, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface NavbarProps {
  onMenuClick?: () => void
  showNavLinks?: boolean
  transparent?: boolean
}

export default function Navbar({ onMenuClick, showNavLinks = false, transparent = false }: NavbarProps) {
  const { user, signOut } = useAuth()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userInitial = user?.email?.[0].toUpperCase() ?? 'U'

  return (
    <nav className={`fixed top-[calc(1.5rem_+_env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-6xl flex items-center justify-between px-6 py-3 ${transparent ? 'bg-white/40' : 'bg-white/80'} backdrop-blur-xl border border-slate-200/60 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300`}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy shadow-lg shadow-navy/20 group-hover:scale-105 transition-transform">
          <Zap className="w-4.5 h-4.5 text-white" fill="currentColor" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-slate-900">
          car<span className="text-navy">x</span>ai
        </span>
      </Link>

      {/* Center Nav Links (Desktop Landing only) */}
      {showNavLinks && (
        <div className="hidden md:flex items-center gap-8">
          {[
            { name: 'Features', id: 'features' },
            { name: 'How it Works', id: 'how-it-works' },
            { name: 'Reviews', id: 'reviews' },
            { name: 'Pricing', id: 'pricing' },
          ].map((link) => (
            <a 
              key={link.id}
              href={`/#${link.id}`} 
              onClick={(e) => { 
                if (window.location.pathname === '/') {
                  e.preventDefault(); 
                  document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }); 
                }
              }} 
              className="text-xs font-bold text-slate-500 hover:text-navy transition-colors uppercase tracking-widest"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={accountMenuRef}>
            <button 
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-2.5 p-1 pr-3.5 rounded-full border border-slate-200 bg-white hover:border-navy/30 hover:bg-slate-50 hover:shadow-md transition-all group shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center text-white font-display font-bold text-[10px] shadow-sm overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : userInitial}
              </div>
              <span className="hidden sm:block text-xs font-bold text-slate-700 group-hover:text-navy transition-colors">My Profile</span>
              <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 group-hover:text-navy transition-transform duration-300 ${accountMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {accountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-56 bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 overflow-hidden p-2"
                >
                  <div className="px-3 py-3 mb-1 border-b border-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Account</p>
                    <div className="flex items-center gap-2.5 px-1">
                       <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-navy font-bold text-xs overflow-hidden">
                         {user?.user_metadata?.avatar_url ? (
                           <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                         ) : userInitial}
                       </div>
                       <div className="min-w-0">
                         <p className="text-xs font-bold text-slate-900 truncate">{user.email?.split('@')[0]}</p>
                         <p className="text-[10px] text-slate-400 truncate tracking-tight">{user.email}</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-navy transition-all group" onClick={() => setAccountMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-navy" />
                      <span className="text-xs font-bold">Dashboard</span>
                    </Link>
                    <Link to="/my-account" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-navy transition-all group" onClick={() => setAccountMenuOpen(false)}>
                      <User className="w-4 h-4 text-slate-400 group-hover:text-navy" />
                      <span className="text-xs font-bold">My Account</span>
                    </Link>
                    <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all text-left">
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs font-bold">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth?mode=login" className="hidden sm:block text-xs font-bold text-slate-600 hover:text-navy px-3 transition-colors">Sign In</Link>
            <Link to="/auth" className="px-4 py-2 rounded-full bg-navy text-white text-xs font-black shadow-lg shadow-navy/20 hover:brightness-110 transition-all">Start Free</Link>
          </div>
        )}
        
        {/* Mobile menu trigger / Dashboard sidebar trigger */}
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
