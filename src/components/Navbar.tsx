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
    <nav className={`fixed top-0 left-0 right-0 z-[60] h-16 md:h-20 flex items-center transition-all duration-700 ${transparent ? 'bg-transparent' : 'bg-white/70 backdrop-blur-2xl border-b border-slate-100/50'}`}>
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Left: Hamburger (Mobile Only) */}
        <div className="flex md:hidden items-center order-1">
          <button 
            onClick={onMenuClick}
            className="p-2 -ms-2 rounded-full hover:bg-slate-50 transition-colors text-slate-500"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Center (Mobile) / Left (Desktop): Logo */}
        <div className="flex items-center justify-center md:justify-start flex-1 md:flex-none order-2 lg:order-1">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center group transition-all active:scale-95 shrink-0">
            <BrandLockup size="md" className="scale-90 md:scale-105" />
          </Link>
        </div>

        {/* Center: Minimalist Navigation */}
        {showNavLinks && (
          <div className="hidden md:flex items-center gap-1 order-2 lg:order-2">
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
                  className={`relative px-3 py-2 text-[12px] font-black tracking-tight transition-all duration-300 rounded-xl uppercase ${isActive ? 'text-[#0070E0] bg-blue-50' : 'text-slate-500 hover:text-[#0070E0] hover:bg-slate-50'}`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right Actions: Auth & Language (Order 3) */}
        <div className="flex items-center gap-4 md:gap-8 order-3 lg:order-3">
          
          <div className="">
            <LanguageSelector 
              className="flex-shrink-0" 
              dropdownPosition="bottom" 
              variant="minimal" 
            />
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <button className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-[#0070E0] transition-all">
                <Bell className="w-5 h-5" />
              </button>

              <div className="relative" ref={accountMenuRef}>
                <button 
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-full border border-slate-100 hover:border-[#0070E0]/20 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0070E0] flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-blue-500/20 overflow-hidden group-hover:scale-105 transition-transform">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : userInitial}
                  </div>
                  <ChevronDown className={`hidden sm:block w-3 h-3 text-slate-400 group-hover:text-[#0070E0] transition-transform duration-500 me-2 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute end-0 top-full mt-4 w-72 bg-white/95 backdrop-blur-2xl rounded-[32px] border border-slate-100/80 shadow-[0_30px_70px_rgba(0,0,0,0.15)] z-[70] overflow-hidden p-2"
                    >
                      <div className="px-5 py-5 mb-1 border-b border-slate-50/80">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('auth.account')}</p>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#0070E0] font-black text-lg overflow-hidden border border-slate-100">
                             {user?.user_metadata?.avatar_url ? (
                               <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                             ) : userInitial}
                           </div>
                            <div className="min-w-0 text-start">
                              <p className="text-sm font-black text-slate-900 truncate">{user.email?.split('@')[0]}</p>
                              <p className="text-[11px] text-slate-400 truncate font-medium tracking-tight mt-0.5">{user.email}</p>
                            </div>
                        </div>
                      </div>
                      
                      <div className="p-1.5 space-y-1">
                        <Link to="/dashboard" className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-600 hover:bg-[#F0F7FF] hover:text-[#0070E0] transition-all group" onClick={() => setAccountMenuOpen(false)}>
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-[#0070E0]/10 shadow-sm group-hover:shadow-blue-500/5">
                            <LayoutDashboard className="w-4.5 h-4.5 text-slate-400 group-hover:text-[#0070E0]" />
                          </div>
                          <span className="text-sm font-bold tracking-tight">{t('nav.dashboard')}</span>
                        </Link>
                        <Link to="/my-account" className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-600 hover:bg-[#F0F7FF] hover:text-[#0070E0] transition-all group" onClick={() => setAccountMenuOpen(false)}>
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-[#0070E0]/10 shadow-sm group-hover:shadow-blue-500/5">
                            <User className="w-4.5 h-4.5 text-slate-400 group-hover:text-[#0070E0]" />
                          </div>
                          <span className="text-sm font-bold tracking-tight">{t('common.my_account')}</span>
                        </Link>
                        <div className="h-px bg-slate-50 my-2 mx-4" />
                        <button onClick={() => signOut()} className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all text-start group">
                          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-red-100 shadow-sm">
                            <LogOut className="w-4.5 h-4.5 rtl:-scale-x-100" />
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
            <div className="flex items-center gap-2 lg:gap-4">
              <Link to="/login?mode=login" className="hidden lg:block px-3 py-2 text-[13px] font-bold text-slate-500 hover:text-[#0070E0] transition-colors uppercase tracking-widest">{t('auth.login.button')}</Link>
              {/* Desktop Only CTA */}
              <Link to="/login" className="hidden md:flex px-6 py-3.5 rounded-xl bg-[#0070E0] text-white text-[12px] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-500/25 hover:bg-[#005BB5] hover:-translate-y-0.5 transition-all items-center justify-center whitespace-nowrap active:scale-[0.98] border border-white/20">
                {t('landing.hero.cta_start')}
              </Link>
              {/* Mobile Compact Login Button (Optional but cleaner) */}
              <Link to="/login" className="md:hidden p-2 rounded-full bg-slate-50 text-[#0070E0] hover:bg-blue-50 transition-colors">
                <User className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
