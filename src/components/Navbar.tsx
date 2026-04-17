import { Link } from 'react-router-dom'
import { Zap, Menu, User, LayoutDashboard, LogOut, ChevronDown, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface NavbarProps {
  onMenuClick?: () => void
  onStoryClick?: () => void
  showNavLinks?: boolean
  transparent?: boolean
}

export default function Navbar({ onMenuClick, onStoryClick, showNavLinks = false, transparent = false }: NavbarProps) {
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
    <nav className={`fixed top-[calc(1rem_+_env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-6xl flex items-center justify-between px-6 py-2.5 ${transparent ? 'bg-surface/20 dark:bg-black/40' : 'bg-surface/90 dark:bg-surface-low/90'} backdrop-blur-2xl border border-overlay rounded-full shadow-lg transition-all duration-300`}>
      <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy shadow-lg shadow-navy/20 group-hover:scale-105 transition-transform">
          <Zap className="w-4.5 h-4.5 text-white" fill="currentColor" />
        </div>
        <span className="font-display font-black text-xl tracking-tighter text-on-surface flex items-center">
          car<span className="text-navy">x</span>ai
        </span>
      </Link>

      {/* Story Link (Subtle Trust Signal) - Only on Desktop Landing */}
      {!user && showNavLinks && (
        <button 
          onClick={onStoryClick}
          className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full hover:bg-navy/5 transition-all group"
        >
          <Heart size={11} className="text-navy/40 group-hover:text-navy transition-all" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-navy transition-colors mt-0.5">
            How CarxAI Began
          </span>
        </button>
      )}

      {/* Center Nav Links (Desktop Landing only) */}
      {showNavLinks && (
        <div className="hidden md:flex items-center gap-8">
          {[
            { name: 'Features', id: 'features' },
            { name: 'How it Works', id: 'how-it-works' },
            { name: 'Guides', id: 'guides', path: '/guides' },
            { name: 'Reviews', id: 'reviews' },
            { name: 'Pricing', id: 'pricing' },
          ].map((link) => (
            <Link 
              key={link.id}
              to={link.path || `/#${link.id}`} 
              onClick={(e) => { 
                if (!link.path && window.location.pathname === '/') {
                  e.preventDefault(); 
                  document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }); 
                }
              }} 
              className="text-xs font-bold text-muted hover:text-navy transition-colors uppercase tracking-widest"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-3">

        {user ? (
          <div className="relative" ref={accountMenuRef}>
            <button 
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-2.5 p-1 pr-3.5 rounded-full border border-overlay bg-surface dark:bg-surface-high/40 hover:border-navy/30 hover:bg-surface-high dark:hover:bg-surface-high/60 hover:shadow-md transition-all group shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center text-white font-display font-bold text-[10px] shadow-sm overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : userInitial}
              </div>
              <span className="hidden sm:block text-xs font-bold text-on-surface/80 group-hover:text-navy transition-colors">My Profile</span>
              <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-muted group-hover:text-navy transition-transform duration-300 ${accountMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {accountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-[-8px] top-full mt-4 w-60 bg-surface/98 dark:bg-surface-low backdrop-blur-3xl rounded-[32px] border border-overlay shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[70] overflow-hidden p-2"
                >
                  <div className="px-3 py-3 mb-1 border-b border-overlay">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 px-1">Account</p>
                    <div className="flex items-center gap-2.5 px-1">
                       <div className="w-8 h-8 rounded-full bg-surface-low dark:bg-surface-low/80 border border-overlay flex items-center justify-center text-navy font-bold text-xs overflow-hidden">
                         {user?.user_metadata?.avatar_url ? (
                           <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                         ) : userInitial}
                       </div>
                       <div className="min-w-0">
                         <p className="text-xs font-bold text-on-surface truncate">{user.email?.split('@')[0]}</p>
                         <p className="text-[10px] text-muted truncate tracking-tight">{user.email}</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-on-surface/70 hover:bg-surface-high dark:hover:bg-surface-high/60 hover:text-navy transition-all group" onClick={() => setAccountMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-muted group-hover:text-navy" />
                      <span className="text-xs font-bold">Dashboard</span>
                    </Link>
                    <Link to="/my-account" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-on-surface/70 hover:bg-surface-high dark:hover:bg-surface-high/60 hover:text-navy transition-all group" onClick={() => setAccountMenuOpen(false)}>
                      <User className="w-4 h-4 text-muted group-hover:text-navy" />
                      <span className="text-xs font-bold">My Account</span>
                    </Link>
                    <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left">
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs font-bold">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="hidden sm:block text-sm font-bold text-on-surface/70 hover:text-navy px-3 transition-colors">Sign In</Link>
            <Link to="/auth" className="px-6 py-2.5 rounded-full bg-[#0F172A] text-white text-[13px] font-black shadow-xl hover:bg-black hover:-translate-y-0.5 transition-all flex items-center justify-center">Start Free</Link>
          </div>
        )}
        
        {/* Mobile menu trigger / Dashboard sidebar trigger */}
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-surface-high dark:hover:bg-surface-high/60 transition-colors text-muted md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
