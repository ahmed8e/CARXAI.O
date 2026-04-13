import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, Crown, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface UpgradeGateProps {
  isOpen: boolean
  onClose: () => void
}

export default function UpgradeGate({ isOpen, onClose }: UpgradeGateProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleWhatsAppActivate = () => {
    if (!user) {
      navigate('/auth')
      return
    }

    const WHATSAPP_PHONE = '212600000000' // Placeholder
    const message = `Hello, I’d like to activate a paid CarxAI plan for my account.\nSelected Plan: Pro\nEmail: ${user.email}\nUser ID: ${user.id}`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  const benefits = [
    "Unlimited AI car diagnosis",
    "Unlimited diagnostic reports",
    "Advanced dashboard analysis",
    "Professional mechanic sharing"
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          {/* Heavy Backdrop Blur Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
          />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-[480px] z-10"
      >
        <div className="relative overflow-hidden rounded-[40px] bg-white border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.25)] p-0.5">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-[#0070E0]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 p-10 pt-12">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-[24px] bg-[#0070E0] shadow-2xl shadow-[#0070E0]/40 flex items-center justify-center mb-8 border border-white/30 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Crown className="w-8 h-8 text-white" />
              </div>
              
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100/50 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Access Restricted</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-display font-black text-[#0E1B39] tracking-tight mb-4 leading-tight">
                Unlock Premium <br />AI Assistance
              </h2>
              
              <p className="text-[16px] font-medium text-slate-500 leading-relaxed max-w-sm">
                Your free usage limit has been reached. Upgrade now for unlimited diagnostic support and professional tools.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4 mb-12 px-2">
              {benefits.map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-6.5 h-6.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-[#0070E0]/5 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[15px] font-bold text-[#0E1B39]/80 transition-colors group-hover:text-[#0070E0]">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <motion.button
                whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(5,150,105,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsAppActivate}
                className="w-full h-16 rounded-[24px] bg-emerald-600 text-white font-black text-[13px] uppercase tracking-[0.15em] shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 group"
              >
                <MessageSquare className="w-5 h-5 text-emerald-200" />
                <span>Activate Professional Tier</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </motion.button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] hover:text-[#0E1B39] transition-colors"
              >
                Return to Dashboard
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-300" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure Activation</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-300" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instant Support</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[11px] font-black text-white/40 uppercase tracking-[0.4em] italic">
          CARXAI INTELLIGENCE v4.0
        </p>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  )
}
