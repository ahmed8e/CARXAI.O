import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, Crown, ArrowRight } from 'lucide-react'
import { MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { plans } from '../../lib/plans'

interface UpgradeGateProps {
  isOpen: boolean
  onClose: () => void
  targetPlan?: 'pro' | 'advanced'
}

export default function UpgradeGate({ isOpen, onClose, targetPlan = 'pro' }: UpgradeGateProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const planData = plans.find(p => p.id === targetPlan) || plans[1] // Default to Pro

  const handleWhatsAppActivate = () => {
    if (!user) {
      navigate('/auth')
      return
    }

    const WHATSAPP_PHONE = '33756816551'
    const message = `Hello, I’d like to activate the ${planData.name} plan for my account.\nEmail: ${user.email}\nUser ID: ${user.id}`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  // Content Mapping
  const content = targetPlan === 'advanced' ? {
    title: "Unlock Expert Answer",
    body: "Upgrade to Advance to access Expert Answer and a more advanced diagnostic experience.",
    support: "Advance gives you access to the highest-level diagnostic flow, deeper analysis, and a more refined support experience.",
    cta: "Upgrade to Advance",
    features: planData.features.slice(0, 4) // Show top 4 features
  } : {
    title: "Unlock Premium Access",
    body: "Enjoy unlimited car diagnostics and professional reports with our Pro tier.",
    support: "Premium plans give you access to more advanced local help and diagnostics.",
    cta: "Activate Pro Access",
    features: planData.features.slice(0, 3)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
          {/* Elegant Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
          />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative w-full max-w-[420px] z-10"
      >
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-[0_30px_70px_rgba(0,18,51,0.2)] p-0.5">
          {/* Ambient Glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-gradient-to-b ${targetPlan === 'advanced' ? 'from-indigo-500/10' : 'from-[#0070E0]/10'} to-transparent blur-3xl pointer-events-none`} />

          <div className="relative z-10 p-8 pt-9">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className={`w-14 h-14 rounded-[20px] ${targetPlan === 'advanced' ? 'bg-indigo-600' : 'bg-[#0070E0]'} shadow-xl ${targetPlan === 'advanced' ? 'shadow-indigo-600/30' : 'shadow-[#0070E0]/30'} flex items-center justify-center mb-6 border border-white/20 transform rotate-3`}>
                <Crown className="w-7 h-7 text-white" />
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100/50 mb-5">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Upgrade Required</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-display font-black text-navy tracking-tight mb-3 leading-tight">
                {content.title}
              </h2>
              
              <p className="text-[14px] font-medium text-slate-500 leading-relaxed max-w-[280px]">
                {content.body}
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 mb-9 px-2">
              {content.features.map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="flex items-center gap-3.5 group"
                >
                  <div className={`w-5.5 h-5.5 rounded-lg ${targetPlan === 'advanced' ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'} flex items-center justify-center shrink-0`}>
                    {targetPlan === 'advanced' ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                  </div>
                  <span className="text-[14px] font-bold text-navy/80">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-[11px] font-bold text-slate-400 leading-relaxed text-center mb-9 px-4 uppercase tracking-[0.1em]">
              {content.support}
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ y: -2, boxShadow: targetPlan === 'advanced' ? "0 15px 30px rgba(79,70,229,0.3)" : "0 15px 30px rgba(0,112,224,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsAppActivate}
                className={`w-full h-14 rounded-[20px] bg-gradient-to-br ${targetPlan === 'advanced' ? 'from-indigo-600 via-indigo-700 to-indigo-900' : 'from-[#0070E0] via-[#005BB5] to-[#004A99]'} text-white font-black text-[12px] uppercase tracking-[0.15em] shadow-lg ${targetPlan === 'advanced' ? 'shadow-indigo-600/15' : 'shadow-blue-600/15'} transition-all flex items-center justify-center gap-2.5 group`}
              >
                <MessageSquare className="w-4.5 h-4.5 text-white/80" />
                <span>{content.cta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <button
                onClick={onClose}
                className="w-full py-3 text-[11px] font-black text-[#0E1B39]/50 uppercase tracking-[0.25em] hover:text-[#0E1B39] hover:bg-slate-50 rounded-xl transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  )
}
