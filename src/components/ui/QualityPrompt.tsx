import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, X, ArrowRight } from 'lucide-react'
import ShieldWrenchIcon from './ShieldWrenchIcon'

interface QualityPromptProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
}

export default function QualityPrompt({ isOpen, onClose, onContinue }: QualityPromptProps) {
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    setLoading(true)
    // Save to localStorage so it doesn't show again for this user session
    localStorage.setItem('car safety_quality_prompt_seen', 'true')
    setTimeout(() => {
      setLoading(false)
      onContinue()
    }, 600)
  }

  // Side effects: hide bottom nav
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          {/* Luxury Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/30 backdrop-blur-xl"
          />

          {/* Luxury Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white/95 dark:bg-surface/95 rounded-[48px] shadow-[0_30px_70px_rgba(0,18,51,0.2)] overflow-hidden border border-white/40 group"
          >
            {/* Top Close Button */}
            <button 
              onClick={onClose}
              className="absolute right-8 top-8 p-1.5 rounded-full hover:bg-slate-50 transition-colors text-muted hover:text-navy z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Premium Decorative Light Leak */}
            <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-navy/[0.04] via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-navy/5 rounded-full blur-[80px] opacity-50" />

            <div className="p-10 pt-12 relative z-10">
              {/* Luxury Icon Section */}
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-navy/5 rounded-[36px] rotate-6 group-hover:rotate-12 transition-transform duration-700" />
                <div className="absolute inset-0 bg-white/80 dark:bg-surface-high/80 rounded-[36px] shadow-xl border border-navy/10 flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy/5 to-navy/10 flex items-center justify-center">
                    <ShieldWrenchIcon className="w-6 h-6 text-navy animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="text-center space-y-6 mb-12">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-navy/40">Refinement Step</span>
                  <h3 className="text-[28px] font-display font-black text-navy tracking-tight leading-tight italic">
                  Get better <br />
                  <span className="text-on-surface tracking-tighter not-italic font-black">nearby help</span>
                </h3>
                </div>

                <div className="space-y-4">
                  <p className="text-[14px] text-slate-500 font-medium leading-relaxed px-2">
                  When you choose Mechanic or Towing, please allow up to 24 hours so we can provide more relevant nearby options for your area.
                </p>
                <p className="text-[11px] font-black uppercase tracking-widest text-navy/40 italic">
                  This helps improve the quality of the local contacts you receive.
                </p>
                  
                  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-navy/[0.03] border border-navy/[0.05]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <p className="text-[12px] font-bold text-navy/60 leading-none">
                      Relevancy & Utility Assurance
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="space-y-4">
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-[24px] bg-navy text-white shadow-[0_15px_30px_rgba(0,18,51,0.2)] hover:shadow-[0_20px_40px_rgba(0,18,51,0.25)] hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="font-bold text-[16px] tracking-tight">Continue</span>
                      <ArrowRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all" />
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted/60 hover:text-navy transition-colors"
                >
                  Not Now
                </button>
              </div>

              {/* Luxury Progress indicator (Visual only) */}
              <div className="mt-10 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-navy/20" />
                <div className="w-8 h-1.5 rounded-full bg-navy/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-navy/20" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
