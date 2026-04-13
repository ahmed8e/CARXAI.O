import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck, CreditCard } from 'lucide-react'
import Pricing from '../components/Pricing'
import { useSubscription } from '../hooks/useSubscription'

export default function ChoosePlan() {
  const location = useLocation()
  const { subscription, loading } = useSubscription()
  const navigate = useNavigate()
  const intent = location.state?.intent || 'onboarding'

  useEffect(() => {
    // If the user has an active Pro/Advanced plan and is not explicitly trying to upgrade,
    // they should not be on this page. Send them to the dashboard.
    if (!loading && (subscription?.status === 'active' || subscription?.status === 'trialing') && intent !== 'upgrade') {
      console.log('[ChoosePlan] User already has active plan, redirecting to dashboard.')
      navigate('/dashboard', { replace: true })
    }
  }, [subscription, loading, intent, navigate])

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Minimal Header */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 border-b border-slate-50 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0070E0] shadow-lg shadow-[#0070E0]/20 group-hover:scale-105 transition-transform">
              <Zap className="w-4.5 h-4.5 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-black text-xl tracking-tighter text-slate-900">
              car<span className="text-[#0070E0]">x</span>ai
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
               <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure Checkout</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Marketing Header */}
      <div className="pt-32 pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 mb-6 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">
            <CreditCard className="w-3 h-3" /> Step 2: Choose Your Plan
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Choose the plan that fits <br className="hidden md:block" /> your driving needs
          </h1>
          
          <p className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl mx-auto">
            Get instant AI car help, official diagnostic reports, and roadside assistance. 
            <span className="text-slate-900"> Start with a 3-day free trial on Pro.</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              No hidden fees
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Encrypted billing
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reuse Pricing Component */}
      <Pricing mode={intent as any} currentSubscription={subscription} />

      {/* Exit/Dashboard Link for Skip (Optional but sometimes useful for UX) */}
      <div className="pb-24 pt-12 text-center border-t border-slate-50">
        <p className="text-slate-400 text-xs font-medium">
          Already have a plan? <Link to="/dashboard" className="text-[#0070E0] font-bold hover:underline">Go to Dashboard</Link>
        </p>
      </div>
    </div>
  )
}
