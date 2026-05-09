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
    <nav className={`fixed top-0 left-0 right-0 z-[60] h-14 md:h-16 flex items-center transition-all duration-500 ${transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-xl border-b border-slate-200/40 shadow-sm shadow-slate-100/5'}`}>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* Left Side: Hamburger + Logo Group */}
        <div className="flex items-center gap-1 md:gap-4">
          {/* Hamburger Menu (Mobile Only) */}
          <button 
            onClick={onMenuClick}
            className="md:hidden flex items-center justify-center w-10 h-10 -ms-1 rounded-full hover:bg-slate-100/50 transition-colors text-slate-500 active:scale-90"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo & Name */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center group transition-all active:scale-95 shrink-0">
            <BrandLockup size="sm" className="md:hidden" />
            <BrandLockup size="md" className="hidden md:flex" />
          </Link>
        </div>

        {/* Center: Minimalist Navigation (Desktop Only) */}
        {showNavLinks && (
          <div className="hidden lg:flex items-center gap-1">
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
                  className={`relative px-3 py-1.5 text-[11px] font-black tracking-tight transition-all duration-300 rounded-lg uppercase ${isActive ? 'text-[#0070E0] bg-blue-50' : 'text-slate-500 hover:text-[#0070E0] hover:bg-slate-50'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Side: Language + Profile Group */}
        <div className="flex items-center gap-1.5 md:gap-4">
          
          <div className="flex items-center">
            <LanguageSelector 
              className="flex-shrink-0 scale-90 md:scale-100" 
              dropdownPosition="bottom" 
              variant="minimal" 
            />
          </div>

          {user ? (
            <div className="flex items-center gap-2 md:gap-4">
              <button className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-[#0070E0] transition-all">
                <Bell className="w-5 h-5" />
              </button>

              <div className="relative" ref={accountMenuRef}>
                <button 
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 p-0.5 md:p-1 rounded-full border border-slate-100 hover:border-[#0070E0]/20 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#0070E0] flex items-center justify-center text-white font-black text-[9px] md:text-[10px] shadow-md shadow-blue-500/20 overflow-hidden group-hover:scale-105 transition-transform">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : userInitial}
                  </div>
                  <ChevronDown className={`hidden md:block w-3 h-3 text-slate-400 group-hover:text-[#0070E0] transition-transform duration-500 me-1.5 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute end-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-2xl rounded-[28px] border border-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.12)] z-[70] overflow-hidden p-1.5"
                    >
                      <div className="px-4 py-4 mb-1 border-b border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('auth.account')}</p>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#0070E0] font-black text-base overflow-hidden border border-slate-100">
                             {user?.user_metadata?.avatar_url ? (
                               <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                             ) : userInitial}
                           </div>
                            <div className="min-w-0 text-start">
                              <p className="text-xs font-black text-slate-900 truncate">{user.email?.split('@')[0]}</p>
                              <p className="text-[10px] text-slate-400 truncate font-medium tracking-tight mt-0.5">{user.email}</p>
                            </div>
                        </div>
                      </div>
                      
                      <div className="p-1 space-y-0.5">
                        <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-[#F0F7FF] hover:text-[#0070E0] transition-all group" onClick={() => setAccountMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-[#0070E0]/10 shadow-sm">
                            <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-[#0070E0]" />
                          </div>
                          <span className="text-sm font-bold tracking-tight">{t('nav.dashboard')}</span>
                        </Link>
                        <Link to="/my-account" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-[#F0F7FF] hover:text-[#0070E0] transition-all group" onClick={() => setAccountMenuOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-[#0070E0]/10 shadow-sm">
                            <User className="w-4 h-4 text-slate-400 group-hover:text-[#0070E0]" />
                          </div>
                          <span className="text-sm font-bold tracking-tight">{t('common.my_account')}</span>
                        </Link>
                        <div className="h-px bg-slate-50 my-1.5 mx-3" />
                        <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-start group">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-red-100 shadow-sm">
                            <LogOut className="w-4 h-4 rtl:-scale-x-100" />
                          </div>
                          <span className="text-sm font-bold tracking-tight">{t('common.logout')}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login?mode=login" className="hidden lg:block px-4 py-2 text-[12px] font-bold text-slate-500 hover:text-[#0070E0] transition-colors uppercase tracking-widest">{t('auth.login.button')}</Link>
              {/* Desktop Only CTA */}
              <Link to="/login" className="hidden md:flex px-5 py-2.5 rounded-xl bg-[#0070E0] text-white text-[11px] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-500/20 hover:bg-[#005BB5] hover:-translate-y-0.5 transition-all items-center justify-center whitespace-nowrap active:scale-[0.98] border border-white/10">
                {t('landing.hero.cta_start')}
              </Link>
              {/* Mobile Compact Login Button */}
              <Link to="/login" className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-[#0070E0] hover:bg-blue-50 transition-colors active:scale-90">
                <User className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
