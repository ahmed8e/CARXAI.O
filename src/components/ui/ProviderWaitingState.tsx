import { motion } from 'framer-motion'
import { Sparkles, ShieldCheck, Clock, MapPin } from 'lucide-react'

export default function ProviderWaitingState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-navy/10 rounded-[40px] p-8 sm:p-10 shadow-xl shadow-navy/5"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-navy/[0.03] rounded-full blur-[80px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-navy/[0.02] rounded-full blur-[60px] -ml-24 -mb-24" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Animated Icon Section */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-navy/5 rounded-[32px] rotate-6 animate-pulse" />
          <div className="relative w-20 h-20 bg-white border border-navy/10 rounded-[32px] shadow-sm flex items-center justify-center -rotate-3">
            <Sparkles className="w-8 h-8 text-navy animate-pulse" />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-navy/40">Network Refinement</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-navy tracking-tight leading-tight italic">
              Local <span className="text-on-surface tracking-tighter not-italic font-black">Match Refining</span>
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] text-slate-500 font-medium leading-relaxed max-w-xl">
            We are currently sourcing and verifying the most reliable local providers for your specific location. 
            This refinement process typically takes up to 24 hours to ensure you receive the highest quality service options.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 border border-navy/5">
              <Clock className="w-4 h-4 text-navy/40" />
              <p className="text-[12px] font-bold text-navy/70 uppercase tracking-widest leading-none">
                Est. Time: <span className="text-navy">24 Hours</span>
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 border border-navy/5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-[12px] font-bold text-navy/70 uppercase tracking-widest leading-none">
                Quality <span className="text-navy">Verified</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="hidden lg:flex flex-col items-center gap-2 p-6 rounded-[32px] bg-navy/5 border border-navy/10">
          <MapPin className="w-5 h-5 text-navy/30" />
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-navy/30">Location Active</p>
            <p className="text-[11px] font-bold text-navy/60">Searching Neighborhood</p>
          </div>
        </div>
      </div>

      {/* Progress Track (Aesthetic) */}
      <div className="mt-10 h-1 w-full bg-navy/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-navy/20 to-transparent"
        />
      </div>
    </motion.div>
  )
}
