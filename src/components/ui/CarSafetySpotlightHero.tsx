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
  Star
} from "lucide-react"

/**
 * Premium Product Showcase Component
 * Features a central phone mockup or glass dashboard with attached floating cards.
 */
const ProductShowcase = ({ isRTL }: { isRTL: boolean }) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/30 rounded-full blur-[100px] -z-10" />
      
      {/* Central Glass Dashboard / Phone Mockup */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-[300px] md:w-[340px] aspect-[9/18.5] bg-slate-950 rounded-[50px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-slate-900 overflow-hidden"
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-3xl z-30" />
        
        {/* App Content */}
        <div className="absolute inset-0 bg-white flex flex-col pt-12">
          {/* Header */}
          <div className="px-6 pb-4 border-b border-slate-100">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('landing.hero.badge')}</span>
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
             </div>
             <h3 className="text-xl font-black text-slate-900 leading-tight">Diagnosis Complete</h3>
          </div>

          {/* Result Card */}
          <div className="flex-1 p-6 space-y-6 bg-slate-50/50">
            <div className="space-y-2">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 w-fit">
                 <AlertTriangle className="w-3 h-3 text-red-600" />
                 <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Engine Warning</span>
               </div>
               <p className="text-sm font-bold text-slate-600">Detected on your vehicle</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Level</p>
                  <p className="text-sm font-black text-red-600">High</p>
               </div>
               <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Safe to Drive</p>
                  <p className="text-sm font-black text-red-600">No</p>
               </div>
            </div>

            {/* Repair Estimate */}
            <div className="p-5 bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                   <DollarSign className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Repair Estimate</p>
                   <p className="text-lg font-black text-white">$185–$320</p>
                 </div>
               </div>
               <Button className="w-full bg-white text-slate-900 hover:bg-white/90 rounded-2xl font-black text-[11px] uppercase tracking-widest h-11">
                 View Full Report
               </Button>
            </div>
            
            {/* Safety Steps */}
            <div className="space-y-3">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Steps</p>
               <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-amber-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Do not exceed 60km/h and visit a service center as soon as possible.</p>
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Cards - Attached Close to the central visual */}
      
      {/* Card 1: Risk Level */}
      <motion.div 
        initial={{ opacity: 0, x: isRTL ? 40 : -40, y: -60 }}
        animate={{ opacity: 1, x: isRTL ? 60 : -60, y: -80 }}
        transition={{ delay: 0.5, duration: 1, type: "spring" }}
        className="absolute top-1/4 left-1/2 z-20"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex items-center gap-4 min-w-[160px]">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Risk Level</p>
            <p className="text-sm font-black text-red-600">High Danger</p>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Estimate */}
      <motion.div 
        initial={{ opacity: 0, x: isRTL ? -40 : 40, y: 20 }}
        animate={{ opacity: 1, x: isRTL ? -80 : 80, y: 40 }}
        transition={{ delay: 0.7, duration: 1, type: "spring" }}
        className="absolute bottom-1/3 left-1/2 z-20"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex items-center gap-4 min-w-[180px]">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Repair Cost</p>
            <p className="text-sm font-black text-slate-900">$185–$320</p>
          </div>
        </div>
      </motion.div>

      {/* Card 3: Report Ready */}
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 120 }}
        transition={{ delay: 0.9, duration: 1, type: "spring" }}
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 whitespace-nowrap">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black uppercase tracking-widest">Report Ready for Download</span>
        </div>
      </motion.div>

      {/* Decorative Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-blue-100/50 rounded-full -z-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-blue-50/50 rounded-full -z-20" />
    </div>
  )
}

/**
 * Mobile-Specific Product Preview Card
 */
const MobileProductPreview = ({ isRTL }: { isRTL: boolean }) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="mt-8 w-full max-w-[360px] mx-auto px-4 lg:hidden"
    >
      <div className="relative group">
        {/* Background Glow */}
        <div className="absolute -inset-4 bg-blue-100/40 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
        
        {/* Card Content */}
        <div className="relative bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-[0_20px_60px_rgba(0,112,224,0.12)] overflow-hidden">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-blue-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                {t('landing.hero.cards.result_title')}
              </span>
            </div>
            <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                 {t('landing.hero.cards.health_score')}
               </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Fault & Risk */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Activity className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <span className="text-[13px] font-bold text-slate-700">{t('landing.hero.cards.probable_fault')}</span>
              </div>
              <div className="px-2.5 py-1 bg-red-50 rounded-lg text-[9px] font-black text-red-600 uppercase tracking-tight">
                {t('landing.how_it_works.step2.dangerous')}
              </div>
            </div>

            {/* Risk Level Detail */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
              </div>
              <span className="text-[13px] font-bold text-red-600">{t('landing.hero.cards.risk_level')}</span>
            </div>
            
            {/* Safety Status */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <span className="text-[13px] font-bold text-slate-700">{t('landing.hero.cards.is_safe')}</span>
            </div>
            
            {/* Price Check Row */}
            <div className="pt-3 border-t border-blue-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <DollarSign className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-900 leading-none mb-1">
                      {t('landing.hero.cards.repair_estimate')}
                    </p>
                    <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500" />
                      {t('landing.hero.cards.price_alert')}
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-blue-50 rounded-lg text-[8px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                  {t('landing.hero.cards.price_check')}
                </div>
              </div>
            </div>

            {/* Maintenance Row */}
            <div className="pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Zap className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <span className="text-[12px] font-bold text-slate-500">{t('landing.hero.cards.next_maintenance')}</span>
                </div>
                <div className="px-2 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                  {t('landing.hero.cards.maintenance_alert')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle decoration */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-40" />
        </div>
      </div>
    </motion.div>
  );
}

export const CarSafetySpotlightHero = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.dir() === 'rtl'

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 lg:pt-48 lg:pb-36 overflow-hidden bg-white">
      {/* Background Decoration */}
      <div className="absolute top-0 inset-x-0 h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-blue-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] bg-indigo-50/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-24 items-center">
          
          {/* Content Block */}
          <motion.div 
            className="flex flex-col items-center lg:items-start text-center lg:text-start space-y-6 md:space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50">
                <div className="w-5 h-5 rounded-full bg-[#0070E0] flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#0070E0] font-black">
                  {t('landing.hero.badge')}
                </span>
              </div>
              
              <h1 className={cn(
                "text-[34px] sm:text-4xl md:text-6xl lg:text-[80px] font-black tracking-tight text-slate-900 leading-[1.2] lg:leading-[1.02] max-w-[20ch] mx-auto lg:mx-0",
                isRTL && "leading-[1.4] sm:leading-[1.3] md:leading-[1.2]"
              )}>
                {t('landing.hero.title')}
              </h1>
              
              <p className={cn(
                "text-[15px] md:text-xl text-slate-500 max-w-xl font-medium leading-relaxed opacity-90 mx-auto lg:mx-0",
                isRTL && "leading-[1.7]"
              )}>
                {t('landing.hero.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full sm:w-auto">
              <Button 
                onClick={() => navigate('/login?mode=register')}
                className="w-full sm:w-auto h-auto py-4 md:py-5 px-10 rounded-2xl bg-[#0070E0] text-white font-black uppercase tracking-widest text-[14px] shadow-[0_20px_40px_-10px_rgba(0,112,224,0.4)] hover:bg-[#005BB5] hover:-translate-y-1 transition-all duration-500"
              >
                {t('landing.hero.cta_start')}
                <ChevronRight className={cn("w-5 h-5 transition-transform", isRTL ? "rotate-180 mr-1" : "ml-1")} />
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto h-auto py-4 md:py-5 px-8 text-slate-400 font-black uppercase tracking-widest text-[11px] md:text-[14px] hover:text-[#0070E0] transition-all duration-300"
              >
                {t('landing.hero.cta_demo')}
              </Button>
            </div>

            {/* Mobile Product Preview */}
            <MobileProductPreview isRTL={isRTL} />

            {/* Trust Row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-slate-100 w-full lg:w-full">
              <div className="flex items-center -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-md overflow-hidden ring-1 ring-slate-100">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-center sm:text-start">
                <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ms-2 text-xs font-black text-slate-900">4.9/5</span>
                </div>
                <p className="text-[12px] font-bold text-slate-400 tracking-tight">{t('landing.hero.trust_row')}</p>
              </div>
            </div>
          </motion.div>

          {/* Visual Block - Hidden on mobile, shown on large screens */}
          <motion.div 
            className="relative hidden lg:flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <ProductShowcase isRTL={isRTL} />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
