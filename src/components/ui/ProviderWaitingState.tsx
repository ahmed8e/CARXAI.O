import { motion } from 'framer-motion'
import { ShieldCheck, Clock, Search, CheckCircle2, Zap } from 'lucide-react'

export default function ProviderWaitingState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white/60 backdrop-blur-2xl border border-navy/10 rounded-[48px] p-8 sm:p-12 shadow-2xl shadow-navy/5"
    >
      {/* Premium Decorative Accents */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-navy/10 to-transparent rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy/[0.04] rounded-full blur-[80px] -ml-24 -mb-24" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#0a2540 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-10 lg:gap-16">
        {/* Visual Anchor: Multi-layered Icon Container */}
        <div className="relative shrink-0 mt-2">
          <div className="absolute inset-0 bg-navy/5 rounded-[40px] rotate-12 scale-110 blur-xl animate-pulse" />
          <div className="relative">
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 z-20">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="w-24 h-24 bg-gradient-to-tr from-navy to-navy/80 rounded-[40px] shadow-2xl shadow-navy/20 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Search className="w-10 h-10 text-white animate-bounce" style={{ animationDuration: '3s' }} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-white/20 m-2 rounded-[32px]"
              />
            </div>
          </div>
        </div>

        {/* Primary Content Section */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-navy/5 rounded-full border border-navy/10">
              <div className="w-1.5 h-1.5 rounded-full bg-navy animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-navy/60">Local Network Setup</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-navy tracking-tight leading-[1.1]">
              Local Match <span className="text-on-surface">Refining</span>
            </h2>
          </div>

          <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mb-10">
            For your first local setup, CarxAI is refining nearby mechanic and towing options for your area. 
            This <span className="text-navy font-bold">one-time quality step</span> improves relevance, trust, and response quality and may take up to 24 hours. 
            Once completed, your local support experience stays ready in the background for faster, more reliable help.
          </p>

          {/* Support Chips: Premium Glassmorphism */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-navy/10 shadow-sm hover:border-navy/20 transition-all cursor-default group">
              <Clock className="w-4 h-4 text-navy/50 group-hover:text-navy transition-colors" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest mb-1">Estimated Time</span>
                <span className="text-sm font-bold text-navy">Up to 24 Hours</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-navy/10 shadow-sm hover:border-navy/20 transition-all cursor-default group">
              <Zap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black text-navy/40 uppercase tracking-widest mb-1">Frequency</span>
                <span className="text-sm font-bold text-navy">First-Time Setup</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-navy text-white shadow-xl shadow-navy/10 hover:shadow-navy/20 transition-all cursor-default group">
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Verification</span>
                <span className="text-sm font-bold">Mechanics & Towing Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Footer: Subtle Trust Bar */}
      <div className="mt-12 pt-8 border-t border-navy/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden`}>
                <div className="w-full h-full bg-navy/5 animate-pulse" />
              </div>
            ))}
          </div>
          <p className="text-[11px] font-bold text-navy/50">CarxAI Quality Network is scaling in your area</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Local Servers Synced</p>
        </div>
      </div>
    </motion.div>
  )
}
