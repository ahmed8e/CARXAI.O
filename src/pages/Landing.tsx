import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollProgress } from '../components/ui/scroll-progress-1'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CarxGradientBg from '../components/ui/CarxGradientBg'

// Lazy loaded components for bundle optimization
const Pricing = lazy(() => import('../components/Pricing'))
const ReviewsSlider = lazy(() => import('../components/ReviewsSlider'))
const BrandSlider = lazy(() => import('../components/BrandSlider'))
const StoryModal = lazy(() => import('../components/StoryModal'))
const SymptomCarousel = lazy(() => import('../components/ui/SymptomCarousel'))
const TrustSection = lazy(() => import('../components/TrustSection'))

import { 
  Bot, CheckCircle2, Zap, Clock, Activity, 
  Mic, ImagePlus, ShieldAlert,
  X, ChevronRight, DollarSign, LayoutDashboard, User, LogOut, 
  ChevronDown, HelpCircle, Camera, AlertTriangle, Star
} from 'lucide-react'

import { CarSafetySpotlightHero } from '../components/ui/CarSafetySpotlightHero'

// ─────────────────────────────────────────────────────────────────────────────


const features = (t: any) => [
  { icon: Activity, title: t('landing.features.mechanic'), desc: t('landing.features.mechanic_desc') },
  { icon: Zap, title: t('landing.features.overpaying'), desc: t('landing.features.overpaying_desc') },
  { icon: ShieldAlert, title: t('landing.how_it_works.step2.title'), desc: t('landing.how_it_works.step2.desc') },
  { icon: ImagePlus, title: t('landing.how_it_works.step1.title'), desc: t('landing.how_it_works.step1.desc') },
  { icon: DollarSign, title: t('overpaying.title'), desc: t('overpaying.subtitle') },
  { icon: LayoutDashboard, title: t('reports.title'), desc: t('reports.subtitle') },
  { icon: CheckCircle2, title: t('landing.how_it_works.step3.title'), desc: t('landing.how_it_works.step3.desc') },
  { icon: Bot, title: t('landing.features.mechanic'), desc: t('landing.features.mechanic_desc') },
]

const reviews = (t: any) => [
  { name: t('landing.reviews_section.items.jason.name'), car: t('landing.reviews_section.items.jason.car'), rating: 5, text: t('landing.reviews_section.items.jason.text'), date: t('landing.reviews_section.date_1m'), image: '/JBJ RIV 1.jpg' },
  { name: t('landing.reviews_section.items.jessica.name'), car: t('landing.reviews_section.items.jessica.car'), rating: 5, text: t('landing.reviews_section.items.jessica.text'), date: t('landing.reviews_section.date_3w'), image: '/JBJ RIV 2.jpg' },
  { name: t('landing.reviews_section.items.sarah.name'), car: t('landing.reviews_section.items.sarah.car'), rating: 5, text: t('landing.reviews_section.items.sarah.text'), date: t('landing.reviews_section.date_2w'), image: '/JBJ RIV 3.jpg' },
  { name: t('landing.reviews_section.items.michael.name'), car: t('landing.reviews_section.items.michael.car'), rating: 5, text: t('landing.reviews_section.items.michael.text'), date: t('landing.reviews_section.date_1m'), image: '/JBJ RIV 4.jpg' },
  { name: t('landing.reviews_section.items.ryan.name'), car: t('landing.reviews_section.items.ryan.car'), rating: 5, text: t('landing.reviews_section.items.ryan.text'), date: t('landing.reviews_section.date_2m'), image: '/JBJ RIV 6.jpg' },
]

const faqData = (t: any) => [
  {
    question: t('landing.faq_section.items.accuracy.question'),
    answer: t('landing.faq_section.items.accuracy.answer')
  },
  {
    question: t('landing.faq_section.items.free.question'),
    answer: t('landing.faq_section.items.free.answer')
  },
  {
    question: t('landing.faq_section.items.time.question'),
    answer: t('landing.faq_section.items.time.answer')
  },
  {
    question: t('landing.faq_section.items.cars.question'),
    answer: t('landing.faq_section.items.cars.answer')
  },
  {
    question: t('landing.faq_section.items.next_steps.question'),
    answer: t('landing.faq_section.items.next_steps.answer')
  },
  {
    question: t('landing.faq_section.items.safety.question'),
    answer: t('landing.faq_section.items.safety.answer')
  },
  {
    question: t('landing.faq_section.items.wrong.question'),
    answer: t('landing.faq_section.items.wrong.answer')
  },
  {
    question: t('landing.faq_section.items.mobile.question'),
    answer: t('landing.faq_section.items.mobile.answer')
  }
]

const FAQItem = ({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) => (
  <div className="border-b border-slate-100 last:border-0 px-6">
    <button
      onClick={onClick}
      className="w-full py-6 flex items-center justify-between gap-4 text-start group"
    >
      <span className={`text-base md:text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-[#0070E0]' : 'text-slate-900 group-hover:text-[#0070E0]'}`}>
        {question}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${isOpen ? 'bg-[#0070E0] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}
      >
        <ChevronDown size={18} />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="pb-6 text-sm md:text-base text-slate-500 font-medium leading-relaxed pr-8">
            {answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

export default function Landing() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  const userInitial = user?.email?.[0].toUpperCase() ?? 'U'
  const [storyOpen, setStoryOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(-1)

  return (
    <div className="relative min-h-screen bg-white text-on-surface selection:bg-navy/10 transition-colors duration-300">
      {/* Global atmospheric gradient background */}
      <CarxGradientBg />

      <div className="relative z-10">
        <ScrollProgress variant="brand" position="top" showPercentage={false} />
        
        <Navbar 
          showNavLinks 
          onMenuClick={() => setMobileMenuOpen(true)} 
          onStoryClick={() => setStoryOpen(true)} 
        />

        <main id="main-content">

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-surface/98 dark:bg-surface-low backdrop-blur-2xl flex flex-col items-center justify-center gap-8 p-8"
            >
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-surface-low dark:bg-surface-high/40 flex items-center justify-center text-muted"
              >
                <X className="w-6 h-6" />
              </button>

              {[
                { name: t('landing.nav.features'), id: 'features' },
                { name: t('landing.nav.how_it_works'), id: 'how-it-works' },
                { name: t('landing.nav.pricing'), id: 'pricing' },
                { name: t('landing.nav.reviews'), id: 'reviews' },
                { name: t('landing.nav.faq'), id: 'faq' },
              ].map((link) => (
                <a 
                  key={link.id}
                  href={`/#${link.id}`} 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }); 
                    setMobileMenuOpen(false);
                  }} 
                  className="text-2xl font-bold text-on-surface"
                >
                  {link.name}
                </a>
              ))}
              
              {user ? (
                <div className="flex flex-col items-center gap-4 w-full px-10">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center text-white text-4xl font-display font-bold shadow-2xl shadow-navy/20 ring-4 ring-surface-low dark:ring-surface-low/80 border border-navy/10 mb-4 relative overflow-hidden">
                    <span className="relative z-10">{userInitial}</span>
                    <div className="absolute inset-0 bg-white/10" />
                  </div>
                  <div className="text-center mb-8">
                    <p className="text-on-surface font-bold text-xl mb-1">{user.email?.split('@')[0]}</p>
                    <p className="text-muted text-sm font-medium tracking-wide">{user.email}</p>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <Link to="/dashboard" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-navy text-white font-bold shadow-xl shadow-navy/20" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-5 h-5" />
                      {t('nav.dashboard')}
                    </Link>
                    <Link to="/my-account" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-overlay bg-surface dark:bg-surface-high/40 text-on-surface font-bold" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-5 h-5" />
                      {t('nav.settings')}
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-red-100 bg-red-50/30 text-red-500 font-bold">
                      <LogOut className="w-5 h-5" />
                      {t('common.logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full px-10">
                  <Link to="/login?mode=login" className="text-lg text-muted" onClick={() => setMobileMenuOpen(false)}>{t('auth.login.button')}</Link>
                  <Link to="/login" className="w-full py-4 rounded-2xl bg-navy text-white font-bold text-center shadow-lg shadow-navy/20" onClick={() => setMobileMenuOpen(false)}>{t('landing.hero.cta_start')}</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <CarSafetySpotlightHero />

        {/* Problem Section */}
        <section id="problem" className="relative py-16 md:py-20 px-6 bg-slate-50/60 backdrop-blur-sm overflow-hidden border-t border-slate-100">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">{t('landing.problem.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-12 tracking-tight leading-tight text-on-surface">{t('landing.problem.title')}</h2>
            <div className="grid md:grid-cols-3 gap-5 w-full">
              {[
                { title: t('landing.problem.items.lights.title'), desc: t('landing.problem.items.lights.desc'), icon: ShieldAlert },
                { title: t('landing.problem.items.costs.title'), desc: t('landing.problem.items.costs.desc'), icon: DollarSign },
                { title: t('landing.problem.items.help.title'), desc: t('landing.problem.items.help.desc'), icon: Clock }
              ].map((prob, i) => (
                <div key={i} className="group p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-[#0070E0]/20 hover:shadow-xl transition-all text-start flex flex-col items-start gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#0070E0]/5 flex items-center justify-center border border-[#0070E0]/10 group-hover:bg-[#0070E0] group-hover:text-white transition-all duration-300">
                    <prob.icon className="w-6 h-6 text-[#0070E0] group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold text-lg leading-tight mb-1">{prob.title}</div>
                    <div className="text-sm text-slate-500 font-medium">{prob.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-navy font-black mt-12 text-sm tracking-[0.2em] uppercase opacity-80">{t('landing.problem.clarity_note')}</p>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative py-16 md:py-24 px-6 bg-gradient-to-b from-slate-50/50 to-white overflow-hidden border-t border-slate-100">
          <div className="max-w-6xl mx-auto flex flex-col relative z-10">
            <div className="text-center flex flex-col items-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">{t('landing.how_it_works.badge')}</span>
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] text-slate-900 max-w-3xl">
                {t('landing.how_it_works.title_part1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#0070E0]">{t('landing.how_it_works.title_part2')}</span> {t('landing.how_it_works.title_part3')}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 w-full relative">
              {/* Card 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.1 }}
                className="group relative flex flex-col bg-white p-8 md:p-10 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-400"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0070E0] mb-6 flex items-center justify-center border border-blue-100/50 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{t('landing.how_it_works.step1.title')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-6">{t('landing.how_it_works.step1.desc')}</p>
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    <Mic className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[60%] bg-[#0070E0] rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2 }}
                className="group relative flex flex-col bg-white p-8 md:p-10 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-400"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mb-6 flex items-center justify-center border border-amber-100/50 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{t('landing.how_it_works.step2.title')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-6">{t('landing.how_it_works.step2.desc')}</p>
                
                <div className="mt-auto pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-emerald-500 opacity-20" />
                    <div className="flex-1 h-2 rounded-full bg-amber-400 opacity-20" />
                    <div className="flex-1 h-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                  </div>
                  <div className="flex justify-between mt-2.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <span>{t('landing.how_it_works.step2.safe')}</span>
                    <span>{t('landing.how_it_works.step2.warning')}</span>
                    <span className="text-red-500">{t('landing.how_it_works.step2.dangerous')}</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.3 }}
                className="group relative flex flex-col bg-white p-8 md:p-10 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-400"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-6 flex items-center justify-center border border-emerald-100/50 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{t('landing.how_it_works.step3.title')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-6">{t('landing.how_it_works.step3.desc')}</p>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    <div className="flex -space-x-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-[11px] font-black text-slate-700">4.8</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100/50">{t('landing.how_it_works.step3.top_rated')}</span>
                </div>
              </motion.div>
            </div>

            {/* Bottom CTA Block */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-2xl mx-auto text-center mt-20 pt-10 border-t border-slate-200/60"
            >
              <p className="text-xl md:text-2xl font-bold text-slate-800 mb-10 leading-snug">
                {t('landing.how_it_works.summary')}
              </p>
              
              <button 
                onClick={() => navigate('/login')} 
                className="group relative inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-[20px] font-black uppercase tracking-widest text-white text-[14px] transition-all duration-300 bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] shadow-[0_15px_35px_-10px_rgba(0,115,231,0.4)] border border-white/20 hover:-translate-y-1 hover:shadow-[0_20px_45px_-10px_rgba(0,115,231,0.5)] active:scale-[0.98]"
              >
                {t('landing.how_it_works.cta')}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{t('landing.how_it_works.footer.free')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>{t('landing.how_it_works.footer.time')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>{t('landing.how_it_works.footer.no_signup')}</span>
              </div>
            </motion.div>

          </div>
        </section>

        <Suspense fallback={<div className="h-96 w-full animate-pulse-slow bg-slate-50/50" />}>
          <TrustSection onStoryClick={() => setStoryOpen(true)} />
        </Suspense>

        {/* Brand Compatibility Slider */}
        <Suspense fallback={<div className="h-32 w-full animate-pulse-slow" />}>
          <BrandSlider />
        </Suspense>

        {/* Features */}
        <section id="features" className="relative py-16 md:py-20 px-0 overflow-hidden bg-white/70 backdrop-blur-sm border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">{t('landing.features_section.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface">{t('landing.features_section.title')}</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">{t('landing.features_section.subtitle')}</p>
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-muted">
              <div className="w-8 h-px bg-overlay" />
              {t('landing.features_section.swipe')}
              <div className="w-8 h-px bg-overlay" />
            </div>
          </div>

          <div className="relative">
            {/* Gradient Mask for Fade Effect */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <motion.div 
              className="flex gap-6 px-6 md:px-0"
              animate={{
                x: [0, -2400],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear",
                },
              }}
              style={{ width: "fit-content" }}
            >
              {[...features(t), ...features(t), ...features(t)].map((feature, i) => (
                <article 
                  key={i} 
                  className="flex-shrink-0 w-[280px] p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-[#0070E0]/20 hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-[#0070E0] group-hover:text-white transition-all shadow-sm">
                    <feature.icon className="w-7 h-7 text-[#0070E0] group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Symptom Library Carousel */}
        <section id="guides" className="relative py-24 md:py-24 px-6 bg-[#F8FAFC]/50 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-12 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 bg-blue-50 border border-blue-100">
               <Activity className="w-3.5 h-3.5 text-[#0070E0]" />
               <span className="text-[10px] uppercase tracking-[0.2em] text-[#0070E0] font-black">{t('landing.guides.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-[#0F172A] mb-6">
              {t('landing.guides.title_part1')} <span className="text-[#0070E0]">{t('landing.guides.title_part2')}</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              {t('landing.guides.desc')}
            </p>
          </div>
          <Suspense fallback={<div className="h-[600px] w-full animate-pulse-slow bg-slate-50/50 rounded-[4rem]" />}>
            <SymptomCarousel />
          </Suspense>
        </section>

        {/* Reviews */}
        <section id="reviews" className="relative py-24 md:py-24 px-0 bg-slate-50/60 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-12 md:mb-16 text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">{t('landing.reviews_section.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface italic">{t('landing.reviews_section.title')}</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">{t('landing.reviews_section.subtitle')}</p>
          </div>

          <Suspense fallback={<div className="h-96 w-full animate-pulse-slow" />}>
            <ReviewsSlider reviews={reviews(t)} />
          </Suspense>
        </section>

        <Suspense fallback={<div className="h-96 w-full animate-pulse-slow bg-slate-50/50" />}>
          <Pricing />
        </Suspense>

        {/* FAQ Section */}
        <section id="faq" className="relative py-24 md:py-24 px-6 bg-white/70 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
                <HelpCircle className="w-3.5 h-3.5 text-navy" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">{t('landing.faq_section.badge')}</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface mb-6">{t('landing.faq_section.title')}</h2>
              <p className="text-muted text-lg md:text-xl font-medium">{t('landing.faq_section.subtitle')}</p>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-2 md:p-4">
              {faqData(t).map((faq, index) => (
                <FAQItem 
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaqIndex === index}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 md:py-28 px-6 text-center flex flex-col items-center bg-slate-50/60 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">{t('landing.cta_final.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-display font-bold mb-8 leading-tight tracking-tight text-on-surface">{t('landing.cta_final.title')}</h2>
            <p className="text-muted text-xl md:text-2xl font-medium mb-14 max-w-2xl mx-auto">{t('landing.cta_final.subtitle')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-10 py-5 rounded-[20px] font-black uppercase tracking-wider text-white text-[15px] transition-all duration-300 bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] shadow-[0_15px_35px_-10px_rgba(0,115,231,0.4)] border border-white/20 hover:-translate-y-1 hover:shadow-[0_20px_45px_-10px_rgba(0,115,231,0.5)] active:scale-95"
              >
                {t('landing.cta_final.button')}
              </button>
               <button 
                onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-overlay bg-surface dark:bg-surface-high/40 text-on-surface font-bold hover:bg-surface-low transition-all"
              >
                {t('landing.cta_final.learn_more')}
              </button>
            </div>
          </div>
        </section>
        </main>
        {/* Footer */}
        <Footer onStoryClick={() => setStoryOpen(true)} />
      </div>

      {/* Premium Story Modal */}
      <Suspense fallback={null}>
        <StoryModal
          isOpen={storyOpen}
          onClose={() => setStoryOpen(false)}
          onCTAClick={() => navigate('/login?mode=register')}
        />
      </Suspense>
    </div>
  )
}
