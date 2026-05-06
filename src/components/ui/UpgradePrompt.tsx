import { motion, AnimatePresence } from 'framer-motion'
import { Crown, X, ArrowRight, ShieldCheck } from 'lucide-react'
import AiSparkleIcon from './AiSparkleIcon'
import { useNavigate } from 'react-router-dom'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
}

export default function UpgradePrompt({ isOpen, onClose }: UpgradePromptProps) {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    navigate('/dashboard/choose-plan')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/20 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-surface rounded-[40px] shadow-[0_20px_50px_rgba(0,112,224,0.15)] overflow-hidden border border-white/40"
          >
            {/* Top Close Button */}
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-50 transition-colors text-muted hover:text-on-surface z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Decorative Header Overlay */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-navy/5 to-transparent pointer-events-none" />

            <div className="p-8 pt-10">
              {/* Icon Section */}
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-navy/10 rounded-[32px] blur-2xl opacity-50" />
                <div className="relative w-full h-full bg-white dark:bg-surface-high rounded-[28px] border border-navy/10 flex items-center justify-center shadow-xl shadow-navy/5 overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-navy/[0.03] to-transparent" />
                   <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                     <Crown className="w-6 h-6 text-navy" />
                   </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="text-center space-y-4 mb-10">
                <h3 className="text-[26px] font-display font-black text-navy tracking-tight leading-tight italic uppercase">
                  Unlock <br />
                  <span className="text-on-surface tracking-tighter not-italic font-black">local assistance</span>
                </h3>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed px-2">
                  Upgrade your plan to access Mechanic and Towing options, with smarter nearby support and a better assistance experience.
                </p>
                <p className="text-[11px] font-black uppercase tracking-widest text-navy/40 italic">
                  Premium plans give you access to more advanced local help features.
                </p>
              </div>

              {/* Actions Section */}
              <div className="space-y-3">
                <button
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-between p-5 rounded-[24px] bg-navy text-white shadow-lg shadow-navy/20 hover:brightness-110 active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <AiSparkleIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[15px] tracking-tight">Upgrade Plan</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted/60 hover:text-on-surface transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              {/* Benefit Trust Link */}
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                 <p className="text-[10px] font-bold text-muted leading-relaxed uppercase tracking-wide opacity-70">
                   Benefit: Precision nearby <br />
                   mechanic & towing results
                 </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
