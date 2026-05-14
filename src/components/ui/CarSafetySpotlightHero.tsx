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
  Search
} from "lucide-react"

/**
 * Premium Product Showcase Component
 * Features a high-fidelity iPhone mockup with a live scanning animation
 * showing the product in action.
 */
const ProductShowcase = ({ isRTL }: { isRTL: boolean }) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full max-w-[650px] aspect-square flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-blue-50/50 rounded-full blur-[120px] -z-10" />
      
      {/* High-Fidelity iPhone Mockup */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-[290px] md:w-[320px] aspect-[9/19.5] bg-slate-900 rounded-[55px] shadow-[0_50px_100px_-20px_rgba(0,112,224,0.35)] border-[10px] border-slate-900 overflow-hidden ring-1 ring-slate-800"
      >
        {/* Notch Area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-50 flex items-center justify-center gap-1.5 px-4">
           <div className="w-10 h-1 bg-slate-800 rounded-full" />
           <div className="w-2 h-2 rounded-full bg-slate-800" />
        </div>
        
        {/* App Screen Content */}
        <div className="absolute inset-0 bg-white flex flex-col pt-12">
          {/* Live Camera View Area */}
          <div className="relative h-[48%] w-full overflow-hidden bg-slate-900">
            {/* The "Car Problem" Image (Realistic Dashboard Warning) */}
            <img 
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop" 
              alt="Dashboard Warning"
              className="w-full h-full object-cover opacity-80"
            />
            
            {/* Real-time Scanning Line */}
            <motion.div 
              initial={{ top: "10%" }}
              animate={{ top: "90%" }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] z-20"
            />
            
            {/* Focus Markers / Corner Tracking */}
            <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none z-10">
               {/* Corners */}
               <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
               <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
               <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
               <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
            </div>

            {/* Analysis Focus Points */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="absolute top-1/3 left-1/4 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1.2 }}
              className="absolute bottom-1/3 right-1/3 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20"
            />

            {/* Analyzing... Status Pill */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                    {t('landing.hero.cards.analyzing')}
                  </span>
               </div>
            </div>

            {/* Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          </div>

          {/* App Bottom UI / Result Area */}
          <div className="flex-1 flex flex-col p-6 space-y-4 bg-white z-20">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
               <div className="flex items-center gap-2">
                 <Search className="w-4 h-4 text-blue-600" />
                 <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                   {t('landing.hero.cards.result_title')}
                 </span>
               </div>
               <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-black text-red-600 uppercase">
                    {t('landing.how_it_works.step2.dangerous')}
                  </span>
               </div>
            </div>

            {/* Diagnostic Rows */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Issue Detected</p>
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">
                    {t('landing.hero.cards.probable_fault')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Risk Level</p>
                  <p className="text-[13px] font-bold text-red-600 leading-tight">
                    {t('landing.hero.cards.risk_level')}
                  </p>
                </div>
              </div>
            </div>

            {/* Repair Cost & Protection */}
            <div className="mt-auto pt-4">
               <div className="bg-slate-950 p-5 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden group">
                  {/* Subtle Background Icon */}
                  <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Estimate</p>
                        <p className="text-base font-black text-white">$185 – $320</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4 p-2 bg-white/5 rounded-xl border border-white/10">
                       <CheckCircle className="w-4 h-4 text-emerald-400" />
                       <span className="text-[10px] font-bold text-white/80">{t('landing.hero.cards.price_alert')}</span>
                    </div>

                    <Button className="w-full h-11 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                       Approve & Fix
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Glass Cards around the Phone */}
      
      {/* Card 1: Photo Analyzed */}
      <motion.div 
        initial={{ opacity: 0, x: isRTL ? -30 : 30, y: -60 }}
        animate={{ opacity: 1, x: isRTL ? -110 : 110, y: -90 }}
        transition={{ delay: 1, duration: 1, type: "spring", stiffness: 100 }}
        className="absolute top-1/4 left-1/2 z-30"
      >
        <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,112,224,0.15)] flex items-center gap-4 min-w-[200px]">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">AI Engine</p>
            <p className="text-[15px] font-black text-slate-900 leading-none">{t('landing.hero.cards.image_analyzed')}</p>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Risk Level */}
      <motion.div 
        initial={{ opacity: 0, x: isRTL ? 30 : -30, y: -10 }}
        animate={{ opacity: 1, x: isRTL ? 150 : -150, y: 10 }}
        transition={{ delay: 1.2, duration: 1, type: "spring", stiffness: 100 }}
        className="absolute top-1/2 left-1/2 z-30"
      >
        <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,112,224,0.15)] flex items-center gap-4 min-w-[200px]">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Safety Status</p>
            <p className="text-[15px] font-black text-red-600 leading-none">{t('landing.hero.cards.risk_level')}</p>
          </div>
        </div>
      </motion.div>

      {/* Card 3: Estimate Ready */}
      <motion.div 
        initial={{ opacity: 0, x: isRTL ? -20 : 20, y: 100 }}
        animate={{ opacity: 1, x: isRTL ? -130 : 130, y: 120 }}
        transition={{ delay: 1.4, duration: 1, type: "spring", stiffness: 100 }}
        className="absolute bottom-1/4 left-1/2 z-30"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex items-center gap-4 min-w-[220px]">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1.5">Cost Clarity</p>
            <p className="text-[15px] font-black text-white leading-none">{t('landing.hero.cards.estimate_ready')}</p>
          </div>
        </div>
      </motion.div>

      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-[60px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-[80px] -z-10 animate-pulse delay-700" />
    </div>
  )
}

/**
 * Mobile-Specific Product Preview
 * Shows a compact iPhone mockup under the CTA block.
 */
const MobileProductPreview = ({ isRTL }: { isRTL: boolean }) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="mt-14 w-full max-w-[340px] mx-auto px-4 lg:hidden"
    >
      <div className="relative group">
        {/* Background Glow */}
        <div className="absolute -inset-4 bg-blue-100/30 rounded-[50px] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
        
        {/* Phone Card Mockup */}
        <div className="relative bg-white border border-slate-100 rounded-[45px] p-2 shadow-[0_30px_70px_rgba(0,112,224,0.18)] overflow-hidden">
          <div className="relative rounded-[38px] bg-white overflow-hidden border border-slate-50">
            {/* Header / Camera View */}
            <div className="relative h-40 bg-slate-900">
               <img 
                 src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop" 
                 alt="Scan"
                 className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay" />
               <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[8px] font-black text-white uppercase tracking-tighter">Analyzing Photo</span>
               </div>
            </div>

            {/* Result Info */}
            <div className="p-5 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-800">{t('landing.hero.cards.probable_fault')}</span>
                  </div>
                  <ShieldAlert className="w-5 h-5 text-red-500" />
               </div>

               <div className="flex items-center justify-between p-4 bg-slate-950 rounded-[24px]">
                  <div>
                    <p className="text-[9px] font-bold text-white/40 uppercase mb-0.5">Repair Estimate</p>
                    <p className="text-sm font-black text-white">$185 – $320</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <ChevronRight className={cn("w-4 h-4 text-white", isRTL && "rotate-180")} />
                  </div>
               </div>
            </div>
          </div>
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
    <section className="relative min-h-screen flex items-center pt-24 pb-16 lg:pt-36 lg:pb-36 overflow-hidden bg-white">
      {/* Background Decoration */}
      <div className="absolute top-0 inset-x-0 h-full pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[5%] w-[45%] h-[45%] bg-blue-50/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-indigo-50/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Content Block - Right Side for Desktop RTL */}
          <motion.div 
            className={cn(
              "flex flex-col items-center lg:items-start text-center lg:text-start space-y-8 order-1",
              isRTL ? "lg:order-2" : "lg:order-1"
            )}
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-6 w-full">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-blue-600 font-black">
                  {t('landing.hero.badge')}
                </span>
              </div>
              
              <h1 className={cn(
                "text-[34px] sm:text-4xl md:text-6xl lg:text-[76px] font-black tracking-tight text-slate-900 leading-[1.15] lg:leading-[1.05] max-w-[18ch] mx-auto lg:mx-0",
                isRTL && "leading-[1.4] sm:leading-[1.3] md:leading-[1.2]"
              )}>
                {t('landing.hero.title')}
              </h1>
              
              <p className={cn(
                "text-[16px] md:text-xl text-slate-500 max-w-xl font-medium leading-relaxed opacity-90 mx-auto lg:mx-0",
                isRTL && "leading-[1.7]"
              )}>
                {t('landing.hero.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full sm:w-auto">
              <Button 
                onClick={() => navigate('/login?mode=register')}
                className="w-full sm:w-auto h-auto py-5 px-10 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[14px] shadow-[0_20px_40px_-10px_rgba(0,112,224,0.4)] hover:bg-blue-700 hover:-translate-y-1 transition-all duration-500"
              >
                {t('landing.hero.cta_start')}
                <ChevronRight className={cn("w-5 h-5 transition-transform", isRTL ? "rotate-180 mr-1" : "ml-1")} />
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto h-auto py-5 px-8 text-slate-400 font-black uppercase tracking-widest text-[11px] md:text-[14px] hover:text-blue-600 transition-all duration-300"
              >
                {t('landing.hero.cta_demo')}
              </Button>
            </div>

            {/* Mobile Product Preview - Moving under CTA for trust */}
            <MobileProductPreview isRTL={isRTL} />

            {/* Trust Row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-slate-100 w-full">
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
                  <span className="ms-2 text-xs font-black text-slate-900">4.9/5 Trust Score</span>
                </div>
                <p className="text-[12px] font-bold text-slate-400 tracking-tight">{t('landing.hero.trust_row')}</p>
              </div>
            </div>
          </motion.div>

          {/* Visual Block - Left Side for Desktop RTL */}
          <motion.div 
            className={cn(
              "relative hidden lg:flex justify-center items-center order-2",
              isRTL ? "lg:order-1" : "lg:order-2"
            )}
            initial={{ opacity: 0, scale: 0.95, x: isRTL ? -40 : 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <ProductShowcase isRTL={isRTL} />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
