import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, CheckCircle, Star, Quote } from 'lucide-react'
import { BrandLockup } from '../components/ui/Brand'
import { useAuth } from '../contexts/AuthContext'
import { PasswordRequirement } from '../components/ui/PasswordRequirement'
import { useTranslation } from 'react-i18next'

const reviews = [
  { name: 'Jason M.', car: 'Toyota RAV4', text: 'auth.reviews.r1_text', role: 'auth.reviews.r1_role' },
  { name: 'Sarah J.', car: 'VW Golf', text: 'auth.reviews.r2_text', role: 'auth.reviews.r2_role' },
  { name: 'Michael B.', car: 'Audi A3', text: 'auth.reviews.r3_text', role: 'auth.reviews.r3_role' },
]

export default function Auth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { user, signIn, signUp, signInWithOAuth } = useAuth()

  const from = (location.state as any)?.from?.pathname ?? '/dashboard'

  useEffect(() => {
    if (user) {
      if (sessionStorage.getItem('newly_signed_up') === 'true') {
        const subData = user.user_metadata?.subscription_status
        const isAlreadyPro = subData === 'active' || subData === 'pro'
        
        if (isAlreadyPro) {
          sessionStorage.removeItem('newly_signed_up')
          navigate('/dashboard', { replace: true })
        } else {
          sessionStorage.removeItem('newly_signed_up')
          navigate('/onboarding-location')
        }
      } else {
        navigate(from, { replace: true })
      }
    }
  }, [user, navigate, from])
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 
                      searchParams.get('mode') === 'login' ? 'login' :
                      localStorage.getItem('car_safety_returning') === 'true' ? 'login' : 'login'; 

  const [mode, setMode] = useState<'login' | 'register'>(initialMode as any)
  
  const GOOGLE_AUTH_ENABLED = false;
  const APPLE_AUTH_ENABLED = false;
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [activeReview, setActiveReview] = useState(0)

  useEffect(() => {
    setError('')
    setConfirmPassword('')
  }, [mode])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReview(prev => (prev + 1) % reviews.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const markReturningUser = () => {
    localStorage.setItem('car_safety_returning', 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (mode === 'register') {
      if (password.length < 8) {
        setError(t('auth.signup.password_too_short'))
        return
      }
      if (password !== confirmPassword) {
        setError(t('auth.signup.passwords_mismatch'))
        return
      }
    }

    setLoading(true)
    
    if (mode === 'login') {
      const { error: signInError } = await signIn(email, password, rememberMe)
      if (signInError) {
        setError(signInError.message)
      } else {
        markReturningUser()
        navigate(from, { replace: true })
      }
    } else {
      const { data, error: signUpError } = await signUp(email, password, fullName)
      if (signUpError) {
        setError(signUpError.message)
      } else {
        markReturningUser()
        if (data?.session) {
          sessionStorage.setItem('newly_signed_up', 'true')
          navigate('/onboarding-location')
        } else {
          setIsSuccess(true)
          setSuccessMessage(t('auth.signup.success_message'))
        }
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      
      {/* ── Left Column: Auth Form ──────────────────────────────────── */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col min-h-screen p-8 md:p-12 lg:p-16 xl:p-24 bg-white relative z-10">
        
        {/* Logo */}
        <div className="mb-12 lg:mb-20">
          <Link to="/" className="group w-fit">
            <BrandLockup size="xl" className="group-hover:scale-[1.02] transition-transform" />
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-display font-black text-on-surface mb-3 tracking-tight">
              {mode === 'login' ? t('auth.login.title') : t('auth.signup.title')}
            </h1>
            <p className="text-muted font-medium text-base">
              {mode === 'login' ? t('auth.login.subtitle') : t('auth.signup.subtitle')}
            </p>
          </div>

          <div className="space-y-8">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-2xl">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-white text-navy shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('auth.login.button')}
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'register' ? 'bg-white text-navy shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('auth.signup.button')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold"
                >
                  {error}
                </motion.div>
              )}

              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] font-bold flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  {successMessage}
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[13px] font-bold text-slate-700 ml-1">{t('auth.signup.full_name')}</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-on-surface text-sm font-medium focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all outline-none"
                      placeholder={t('common.search')}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required={mode === 'register'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 ml-1">{t('auth.login.email')}</label>
                <input
                  type="email"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-on-surface text-sm font-medium focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all outline-none text-start"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[13px] font-bold text-slate-700">{t('auth.login.password')}</label>
                  {mode === 'login' && (
                    <Link to="/forgot-password" title={t('auth.login.forgot_password')} className="text-[#0070E0] hover:underline transition-colors font-bold text-[13px]">
                      {t('auth.login.forgot_password', { defaultValue: 'Forgot?' })}
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-on-surface text-sm font-medium focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all outline-none pr-12 text-start"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {mode === 'register' && password.length > 0 && (
                  <PasswordRequirement password={password} />
                )}
              </div>

              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="confirm-password"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[13px] font-bold text-slate-700 ml-1">{t('auth.signup.password')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-on-surface text-sm font-medium focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all outline-none"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required={mode === 'register'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'login' && (
                <label className="flex items-center gap-3 cursor-pointer group py-1 w-fit">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-200 checked:bg-navy checked:border-navy transition-all cursor-pointer"
                    />
                    <CheckCircle className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-sm font-semibold text-slate-500 group-hover:text-on-surface transition-colors select-none">{t('auth.login.remember_me')}</span>
                </label>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 text-sm mt-4 rounded-2xl bg-navy text-white font-black shadow-lg shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.saving')}
                  </span>
                ) : mode === 'login' ? t('auth.login.button') : t('auth.signup.button')}
              </button>
            </form>

            {(GOOGLE_AUTH_ENABLED || APPLE_AUTH_ENABLED) && (
              <div className="space-y-4">
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <span className="relative px-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('auth.login.or_continue')}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {GOOGLE_AUTH_ENABLED && <button type="button" onClick={() => signInWithOAuth('google')} className="flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs gap-3"><svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Google</button>}
                  {APPLE_AUTH_ENABLED && <button type="button" onClick={() => signInWithOAuth('apple')} className="flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs gap-3"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.73 3.83-.66 1.34.07 2.45.64 3.16 1.64-2.68 1.6-2.22 5.38.48 6.47-.64 1.77-1.8 3.58-2.55 4.72zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.4-1.88 4.41-3.74 4.25z"/></svg>Apple</button>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 lg:mt-24 text-[11px] font-medium text-slate-400 flex flex-wrap gap-x-6 gap-y-2">
          <span>&copy; {new Date().getFullYear()} {t('landing.footer.copyright_name', { defaultValue: 'Car Safety' })}</span>
          <Link to="/privacy" className="hover:text-navy hover:underline transition-colors">{t('landing.footer.privacy')}</Link>
          <Link to="/terms" className="hover:text-navy hover:underline transition-colors">{t('landing.footer.terms')}</Link>
        </div>
      </div>

      {/* ── Right Column: Hero Social Proof ─────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-slate-900">
        
        {/* Background Overlay with premium image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{ 
            backgroundImage: "url('/premium_automotive_abstract_bg_1776349840644.png')",
            filter: 'brightness(0.35) saturate(1.2)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/40 via-transparent to-black/60 pointer-events-none" />
        
        {/* Animated Mesh Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Testimonial Presentation */}
        <div className="relative z-20 w-full max-w-lg px-12">
          
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <Star className="w-3 h-3 text-brand-blue" fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{t('landing.hero.trust_drivers')}</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-display font-black text-white leading-[1.1] tracking-tight italic">
              {t('landing.reviews_section.title_short', { defaultValue: "Don't just take our word for it." })}
            </h2>
          </div>

          <div className="relative h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReview}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/20 p-8 md:p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                  {/* Decorative quote icon */}
                  <Quote className="absolute top-6 right-8 text-white/10 w-16 h-16 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                  
                  <div className="flex flex-col h-full">
                    <div className="flex gap-1 mb-6">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-brand-blue" fill="currentColor" />)}
                    </div>
                    
                    <p className="text-lg md:text-[20px] font-medium text-white/90 leading-relaxed mb-8 italic">
                      "{t(reviews[activeReview].text)}"
                    </p>

                    <div className="mt-auto flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-blue to-navy/50 border border-white/20 flex items-center justify-center text-white font-black text-lg">
                        {reviews[activeReview].name[0]}
                      </div>
                      <div>
                        <p className="text-white font-black text-sm">{reviews[activeReview].name}</p>
                        <p className="text-white/40 text-[11px] font-black uppercase tracking-wider">{reviews[activeReview].car} &bull; {t(reviews[activeReview].role)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mt-16 pt-12 border-t border-white/10">
            <div>
              <p className="text-white font-black text-2xl mb-1">98%</p>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-tight">{t('landing.trust_section.stats.accuracy_label', { defaultValue: 'Diagnostic' })}<br/>{t('landing.trust_section.stats.accuracy_sub', { defaultValue: 'Accuracy' })}</p>
            </div>
            <div>
              <p className="text-white font-black text-2xl mb-1">24/7</p>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-tight">{t('landing.trust_section.stats.support_label', { defaultValue: 'Reliable' })}<br/>{t('landing.trust_section.stats.support_sub', { defaultValue: 'Support' })}</p>
            </div>
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-navy/20 rounded-full blur-[120px] pointer-events-none" />
      </div>
    </div>
  )
}

