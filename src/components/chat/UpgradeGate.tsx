import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, Crown, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function UpgradeGate() {
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
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mx-auto w-full max-w-[480px] my-12"
    >
      <div className="relative overflow-hidden rounded-[32px] bg-white border border-overlay shadow-[0_25px_60px_rgba(0,0,0,0.12)] p-1">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-[#0070E0]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 p-8 pt-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0070E0] shadow-xl shadow-[#0070E0]/30 flex items-center justify-center mb-6 border border-white/20 transform -rotate-3">
              <Crown className="w-7 h-7 text-white" />
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 mb-4">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Free Limit Reached</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-black text-[#0E1B39] tracking-tight mb-4">
              Upgrade your account
            </h2>
            
            <p className="text-[15px] font-medium text-slate-500 leading-relaxed px-4">
              Continue with a paid CarxAI plan to unlock more AI support, full reports, and premium assistance.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 gap-4 mb-10 px-4">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="flex items-center gap-3.5 group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-[#0E1B39]/80 group-hover:text-[#0070E0] transition-colors">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4 px-4 pb-4">
            <button
              onClick={handleWhatsAppActivate}
              className="w-full h-16 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-600/30 hover:shadow-[0_15px_35px_rgba(5,150,105,0.4)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-[0.98] group"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Continue on WhatsApp</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#0E1B39] transition-colors"
            >
              Maybe later
            </button>
          </div>

          {/* Trust Row */}
          <div className="mt-4 pt-6 border-t border-slate-50 flex items-center justify-center gap-6 px-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Secure Billing</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Cancel Anytime</span>
            </div>
          </div>
        </div>

        {/* Diagonal Polish Line */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent -rotate-45 translate-x-12 -translate-y-12" />
      </div>
      
      <p className="text-center mt-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        Premium AI Diagnostic Experience
      </p>
    </motion.div>
  )
}
