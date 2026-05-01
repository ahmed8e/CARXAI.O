import { motion } from 'framer-motion'
import { Crown, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Paywall() {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    // Lead user to the dedicated PayPal-powered pricing page
    navigate('/choose-plan')
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-surface/60 dark:bg-surface-low/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[460px] bg-white border border-overlay shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden"
      >
        <div className="relative h-32 bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-white/10 rotate-12 blur-xl" />
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10 shadow-2xl">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="p-8 pb-10 text-center">
          <h2 className="text-2xl font-display font-black text-on-surface mb-3 tracking-tight">
            Your free trial has ended.
          </h2>
          <p className="text-[15px] font-medium text-muted leading-relaxed mb-6">
            We hope you enjoyed the past 3 days of Car Safety! Subscribe now to restore full access to your digital AI mechanic.
          </p>

          <div className="space-y-3 mb-8 text-left max-w-[280px] mx-auto">
            {[
              "Unlimited AI Diagnostics",
              "Access to nearby mechanics",
              "Instant towing requests",
              "Secure document scanning"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-navy shrink-0" />
                <span className="text-sm font-bold text-on-surface/80">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-gradient-to-r from-navy to-[#0F172A] text-white font-bold hover:shadow-[0_8px_30px_rgba(0,112,224,0.3)] transition-all hover:-translate-y-[2px] group"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/70" />
              Continue with Pro
            </span>
            <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
          
          <p className="text-[11px] font-medium text-muted mt-5 mb-1 uppercase tracking-widest">
            Cancel anytime • Secure PayPal Billing
          </p>
        </div>
      </motion.div>
    </div>
  )
}
