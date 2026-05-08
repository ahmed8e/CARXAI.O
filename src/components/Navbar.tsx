import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, User, LayoutDashboard, LogOut, ChevronDown, Bell } from 'lucide-react'
import { BrandLockup } from './ui/Brand'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LanguageSelector } from './ui/LanguageSelector'

interface NavbarProps {
  onMenuClick?: () => void
  onStoryClick?: () => void
  showNavLinks?: boolean
  transparent?: boolean
}

export default function Navbar({ onMenuClick, showNavLinks = false, transparent = false }: NavbarProps) {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const location = useLocation()
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

  // Navigation items
  const navLinks = [
    { name: t('landing.nav.features'), id: 'features' },
    { name: t('landing.nav.how_it_works'), id: 'how-it-works' },
    { name: t('landing.nav.guides'), id: 'guides', path: '/guides' },
    { name: t('landing.nav.pricing'), id: 'pricing' },
    { name: t('landing.nav.faq'), id: 'faq' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[60] h-16 sm:h-20 flex items-center transition-all duration-500 ${transparent ? 'bg-transparent' : 'bg-white/70 backdrop-blur-xl border-b border-slate-100/50 shadow-sm'}`}>
      <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="p-2 -ms-2 rounded-full hover:bg-slate-50 transition-colors text-slate-500 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to={user ? "/dashboard" : "/"} className="flex items-center group transition-transform active:scale-95">
            <BrandLockup size="md" className="scale-90 sm:scale-100" />
          </Link>
        </div>

        {/* Center: Elegant Inline Navigation */}
        {showNavLinks && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.hash === `#${link.id}` || (link.path && location.pathname === link.path);
              return (
                <Link 
                  key={link.id}
                  to={link.path || `/#${link.id}`} 
                  onClick={(e) => { 
                    if (!link.path && window.location.pathname === '/') {
                      e.preventDefault(); 
                      document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }); 
                    }
                  }} 
                  className={`relative px-4 py-2 text-[13px] font-bold tracking-tight transition-all duration-300 rounded-full ${isActive ? 'text-navy' : 'text-slate-500 hover:text-navy hover:bg-slate-50/50'}`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-navy"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Compact Language Selector */}
          <LanguageSelector 
            className="flex-shrink-0" 
            dropdownPosition="bottom" 
            variant="minimal" 
          />

          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification Placeholder */}
              <button className="hidden sm:flex p-2 rounded-full text-slate-400 hover:text-navy hover:bg-slate-50 transition-all">
                <Bell className="w-5 h-5" />
              </button>

              <div className="relative" ref={accountMenuRef}>
                <button 
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 p-1 pe-1 sm:pe-2 rounded-full border border-slate-100 bg-slate-50/50 hover:border-navy/20 hover:bg-white hover:shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white font-bold text-[10px] shadow-sm overflow-hidden ring-2 ring-white">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : userInitial}
                  </div>
                  <ChevronDown className={`hidden sm:block w-3 h-3 text-slate-400 group-hover:text-navy transition-transform duration-500 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      className="absolute end-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-2xl rounded-[28px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-[70] overflow-hidden p-2"
                    >
                      <div className="px-4 py-4 mb-1 border-b border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('auth.account')}</p>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-navy font-bold text-sm overflow-hidden">
                             {user?.user_metadata?.avatar_url ? (
                               <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                             ) : userInitial}
                           </div>
                            <div className="min-w-0 text-start">
                              <p className="text-sm font-bold text-slate-900 truncate">{user.email?.split('@')[0]}</p>
                              <p className="text-[11px] text-slate-400 truncate tracking-tight">{user.email}</p>
                            </div>
                        </div>
                      </div>
                      
                      <div className="p-1 space-y-0.5">
                        <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-navy transition-all group" onClick={() => setAccountMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                            <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-navy" />
                          </div>
                          <span className="text-sm font-bold">{t('nav.dashboard')}</span>
                        </Link>
                        <Link to="/my-account" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-navy transition-all group" onClick={() => setAccountMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                            <User className="w-4 h-4 text-slate-400 group-hover:text-navy" />
                          </div>
                          <span className="text-sm font-bold">{t('common.my_account')}</span>
                        </Link>
                        <div className="h-px bg-slate-50 my-1" />
                        <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all text-start">
                          <div className="w-8 h-8 rounded-xl bg-red-50/50 flex items-center justify-center">
                            <LogOut className="w-4 h-4 rtl:-scale-x-100" />
                          </div>
                          <span className="text-sm font-bold">{t('common.logout')}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login?mode=login" className="hidden sm:block px-4 py-2 text-[13px] font-bold text-slate-500 hover:text-navy transition-colors">{t('auth.login.button')}</Link>
              <Link to="/login" className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-[12px] font-black shadow-lg shadow-slate-900/10 hover:bg-black hover:-translate-y-0.5 transition-all flex items-center justify-center whitespace-nowrap">{t('auth.signup.button')}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
