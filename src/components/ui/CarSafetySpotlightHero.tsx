"use client"

import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  DollarSign, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  Zap,
  Star,
  Camera,
  ScanSearch,
  Wrench
} from "lucide-react"

/**
 * Premium iPhone Mockup Component
 * Renders a realistic iPhone frame with a dynamic island and Car Safety scanning flow.
 */
const IPhoneMockup = ({ isRTL, isMobile = false }: { isRTL: boolean, isMobile?: boolean }) => {
  const { t } = useTranslation();

  return (
    <div className="relative">
      {/* Background Glow */}
      {!isMobile && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
      )}

      {/* iPhone Hardware Frame */}
      <motion.div 
        initial={!isMobile ? { opacity: 0, y: 40, scale: 0.95 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: isMobile ? 0.3 : 0 }}
        className={cn(
          "relative bg-black rounded-[56px] shadow-2xl ring-1 ring-slate-800 p-[12px]",
          isMobile ? "w-[280px] h-[580px] mx-auto" : "w-[320px] h-[650px] shadow-[0_50px_100px_-20px_rgba(0,112,224,0.35)]"
        )}
      >
        {/* Hardware Buttons (Volume & Power) */}
        <div className="absolute top-[120px] -left-[2px] w-[3px] h-[30px] bg-slate-800 rounded-l-md" />
        <div className="absolute top-[170px] -left-[2px] w-[3px] h-[50px] bg-slate-800 rounded-l-md" />
        <div className="absolute top-[230px] -left-[2px] w-[3px] h-[50px] bg-slate-800 rounded-l-md" />
        <div className="absolute top-[180px] -right-[2px] w-[3px] h-[70px] bg-slate-800 rounded-r-md" />

        {/* The Screen */}
        <div className="relative w-full h-full bg-white rounded-[44px] overflow-hidden flex flex-col">
          
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-[20px] z-50 flex items-center justify-between px-3">
             <div className="w-8 h-2 bg-slate-800 rounded-full" />
             <div className="w-2.5 h-2.5 bg-indigo-900/50 rounded-full flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
             </div>
          </div>
          
          {/* App Header */}
          <div className="pt-12 pb-4 px-5 bg-blue-600 flex items-center justify-between z-40 relative shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[14px] font-black text-white tracking-tight">Car Safety</span>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-50 p-4 space-y-3 overflow-y-auto no-scrollbar pb-10">
            {/* Health Score Module */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('landing.hero.cards.car_health_score').split(':')[0]}</p>
                  <p className="text-[14px] font-black text-slate-800">75<span className="text-[10px] text-slate-400 font-bold">/100</span></p>
                </div>
              </div>
            </div>

            {/* Urgent Maintenance Module */}
            <div className="bg-red-50/50 rounded-2xl p-4 shadow-sm border border-red-100 flex items-start gap-3">
               <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                 <AlertTriangle className="w-4 h-4 text-red-600" />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-red-600/80 uppercase tracking-widest mb-0.5">{t('landing.hero.cards.urgent_maintenance').split(':')[0]}</p>
                 <p className="text-[13px] font-bold text-slate-800">{t('landing.hero.cards.urgent_maintenance').split(':')[1]}</p>
               </div>
            </div>

            {/* Next Maintenance Module */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                 <Wrench className="w-4 h-4 text-indigo-600" />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('landing.hero.cards.next_oil_change').split(':')[0]}</p>
                 <p className="text-[13px] font-bold text-slate-800">{t('landing.hero.cards.next_oil_change').split(':')[1]}</p>
               </div>
            </div>

            {/* Price Check Module */}
            <div className="bg-slate-900 rounded-2xl p-4 shadow-lg flex items-center justify-between">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('landing.hero.cards.price_check_val').split(':')[0]}</p>
                 <p className="text-[16px] font-black text-white">{t('landing.hero.cards.price_check_val').split(':')[1]}</p>
               </div>
               <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                 <DollarSign className="w-4 h-4 text-emerald-400" />
               </div>
            </div>

            {/* AI Diagnosis Module */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-3">
               <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                 <Zap className="w-4 h-4 text-amber-500" />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('landing.hero.cards.ai_diagnosis').split(':')[0]}</p>
                 <p className="text-[13px] font-bold text-slate-800">{t('landing.hero.cards.ai_diagnosis').split(':')[1]}</p>
               </div>
            </div>
            
            {/* Home Indicator */}
            <div className="w-1/3 h-1 bg-slate-300 rounded-full mx-auto mt-6" />
          </div>
        </div>
      </motion.div>

      {/* Floating Glass Cards (Desktop Only) */}
      {!isMobile && (
        <>
          {/* Card 1: Maintenance Reminder */}
          <motion.div 
            initial={{ opacity: 0, x: isRTL ? -40 : 40, y: -60 }}
            animate={{ opacity: 1, x: isRTL ? -90 : 90, y: -80 }}
            transition={{ delay: 1, duration: 1, type: "spring", stiffness: 100 }}
            className="absolute top-[20%] left-1/2 z-30"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-white rounded-[20px] p-3 shadow-[0_20px_40px_rgba(0,112,224,0.15)] flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="pr-2">
                <p className="text-[12px] font-black text-slate-900 leading-none">{t('landing.hero.cards.floating_maintenance')}</p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Health Score */}
          <motion.div 
            initial={{ opacity: 0, x: isRTL ? 40 : -40, y: -10 }}
            animate={{ opacity: 1, x: isRTL ? 110 : -110, y: 10 }}
            transition={{ delay: 1.2, duration: 1, type: "spring", stiffness: 100 }}
            className="absolute top-[45%] left-1/2 z-30"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-white rounded-[20px] p-3 shadow-[0_20px_40px_rgba(0,112,224,0.15)] flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="pr-2">
                <p className="text-[12px] font-black text-slate-900 leading-none">{t('landing.hero.cards.floating_health')}</p>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Price Check */}
          <motion.div 
            initial={{ opacity: 0, x: isRTL ? -20 : 20, y: 100 }}
            animate={{ opacity: 1, x: isRTL ? -100 : 100, y: 120 }}
            transition={{ delay: 1.4, duration: 1, type: "spring", stiffness: 100 }}
            className="absolute bottom-[25%] left-1/2 z-30"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-[20px] p-3 shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shadow-inner">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="pr-2">
                <p className="text-[12px] font-black text-white leading-none">{t('landing.hero.cards.floating_price')}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

export const CarSafetySpotlightHero = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.dir() === 'rtl'

  return (
    <section className="relative min-h-[100dvh] flex items-center pt-24 pb-16 lg:pt-36 lg:pb-36 overflow-hidden bg-white">
      {/* Background Decoration */}
      <div className="absolute top-0 inset-x-0 h-full pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[5%] w-[45%] h-[45%] bg-blue-50/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-indigo-50/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
               {/* Content Block */}
          <motion.div 
            className={cn(
              "flex flex-col items-center lg:items-start text-center lg:text-start space-y-7 md:space-y-9 order-1",
              isRTL ? "lg:order-2" : "lg:order-1"
            )}
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-5 md:space-y-6 w-full flex flex-col items-center lg:items-start">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100/80 shadow-sm backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-blue-700">
                  {t('landing.hero.badge')}
                </span>
              </div>
              
              {/* Premium Headline */}
              <h1 className={cn(
                "text-[32px] sm:text-4xl md:text-5xl lg:text-[64px] font-black tracking-tight text-slate-950 max-w-[20ch]",
                isRTL ? "leading-[1.35] sm:leading-[1.25] md:leading-[1.15]" : "leading-[1.1]"
              )}>
                {t('landing.hero.title')}
              </h1>
              
              {/* Refined Subtitle */}
              <p className={cn(
                "text-[15px] md:text-[17px] text-slate-600 max-w-[540px] font-semibold opacity-90",
                isRTL ? "leading-[1.8]" : "leading-relaxed"
              )}>
                {t('landing.hero.subtitle')}
              </p>
            </div>
            
            {/* High-Converting CTA Group */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
              <Button 
                onClick={() => navigate('/login?mode=register')}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-blue-600 text-white font-black text-[15px] shadow-[0_20px_40px_-12px_rgba(37,99,235,0.5)] hover:bg-blue-700 hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-blue-700/50"
              >
                {t('landing.hero.cta_start')}
                <ChevronRight className={cn("w-5 h-5 transition-transform", isRTL ? "rotate-180 mr-2" : "ml-2")} />
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto h-14 px-6 rounded-2xl text-slate-500 font-bold text-[14px] hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300"
              >
                {t('landing.hero.cta_demo')}
              </Button>
            </div>
            
            {/* Trust Line */}
            <div className="pt-3 w-full flex items-center justify-center lg:justify-start gap-2.5 text-slate-500/80">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-[13px] font-bold tracking-wide">{t('landing.hero.trust_row')}</span>
            </div>
            {/* Mobile-only iPhone Mockup (directly below CTA) */}
            <div className="w-full pt-8 pb-4 lg:hidden">
               <IPhoneMockup isRTL={isRTL} isMobile={true} />
            </div>

          </motion.div>

          {/* Desktop Visual Block - Large iPhone Mockup on the Left */}
          <motion.div 
            className={cn(
              "relative hidden lg:flex justify-center items-center order-2",
              isRTL ? "lg:order-1" : "lg:order-2"
            )}
            initial={{ opacity: 0, scale: 0.95, x: isRTL ? -40 : 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <IPhoneMockup isRTL={isRTL} isMobile={false} />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
