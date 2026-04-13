import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, ShieldCheck, Zap, Lock, Headphones, Globe, MessageSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { PlanType } from '../hooks/useSubscription'
type BillingCycleType = 'monthly' | 'yearly'

interface PricingProps {
  mode?: 'onboarding' | 'upgrade'
  currentSubscription?: any
}

const plans: {
  id: PlanType
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  trial?: string
  features: string[]
  cta: string
  popular: boolean
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Essential AI car help for occasional issues and everyday peace of mind.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Limited AI car diagnosis',
      'Limited diagnostic reports',
      'Limited image analysis',
      'No microphone access',
      '24/7 AI mechanic availability',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'The complete car assistance experience for drivers who want faster answers and better support.',
    monthlyPrice: 12,
    yearlyPrice: 9,
    trial: '3-Day Free Trial',
    features: [
      '3-day free trial included',
      'Instant AI car diagnosis',
      '15 detailed diagnostic reports each month',
      'Step-by-step resolution guidance',
      'Nearby provider discovery map',
      'Specialized vehicle health insights',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Maximum coverage and priority access for users who rely on car support more often.',
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      'Instant AI car diagnosis',
      'Unlimited diagnostic reports',
      'Priority step-by-step guidance',
      'Full provider network visibility',
      'Faster priority support',
      'Multi-vehicle management',
    ],
    cta: 'Get Started',
    popular: false,
  }
]

export default function Pricing({ mode = 'onboarding', currentSubscription }: PricingProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycleType>('yearly')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = (plan: typeof plans[0]) => {
    if (!user) {
      navigate('/auth?redirect=choose-plan')
      return
    }
    
    // Build WhatsApp Message
    const isUpgrade = mode === 'upgrade' || (currentSubscription && currentSubscription.planType !== 'Free')
    const phone = "33756816551" // Admin WhatsApp
    
    let text = ""
    if (isUpgrade && currentSubscription) {
      text = `Hello, I would like to upgrade my CarxAI account.
Current Plan: ${currentSubscription.planType || 'Free'}
Requested Plan: ${plan.name}
Billing Cycle: ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}
Email: ${user.email}
User ID: ${user.id}`
    } else {
      text = `Hello, I would like to activate a paid CarxAI plan for my account.
Selected Plan: ${plan.name}
Billing Cycle: ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}
Email: ${user.email}
User ID: ${user.id}`
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <section id="pricing" className="py-16 md:py-32 px-6 bg-slate-50/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-20 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-6 border border-[#0070E0]/10 bg-[#0070E0]/5"
          >
            <Zap className="w-3.5 h-3.5 text-[#0070E0]" fill="currentColor" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#0070E0] font-black">Choose Your Plan</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]"
          >
            Simple Pricing for <br className="hidden md:block" /> Smarter Car Help
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl font-medium max-w-xl mx-auto mb-12 leading-relaxed"
          >
            Experience the future of automotive assistance. Start free, upgrade anytime via WhatsApp manual activation.
          </motion.p>

          <div className="relative inline-flex items-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:border-slate-300">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`relative z-10 px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Yearly
            </button>
            
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute inset-y-1.5 rounded-xl bg-[#0070E0] shadow-lg shadow-[#0070E0]/20"
              style={{ 
                left: billingCycle === 'monthly' ? 6 : 'calc(50% + 3px)',
                width: 'calc(50% - 9px)'
              }}
            />
          </div>
          
          <div className="mt-4 flex items-center gap-2">
             <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Save 20% on Yearly
             </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch relative max-w-5xl mx-auto">
          {plans.filter(p => p.id !== 'starter').map((plan, i) => {
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative flex flex-col p-10 md:p-12 rounded-[40px] bg-white border transition-all duration-500 ${
                  plan.popular 
                    ? 'border-[#0070E0] shadow-[0_30px_70px_rgba(0,112,224,0.12)] ring-1 ring-[#0070E0]/5 group' 
                    : 'border-slate-100 shadow-[0_15px_60px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.08)] hover:border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2 rounded-full bg-[#0070E0] text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-[#0070E0]/30 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 animate-pulse" /> Most Popular
                  </div>
                )}

                <div className="mb-10 text-left">
                  <h3 className={`text-2xl font-display font-black text-slate-900 mb-3 ${plan.popular ? 'text-[#0070E0]' : ''}`}>{plan.name}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-10 flex items-baseline gap-2">
                  <span className="text-5xl font-display font-black text-slate-900 tracking-tighter">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <div className="flex flex-col">
                     <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-none mb-1">/ month</span>
                     {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                       <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded leading-none w-fit">
                         Billed annually
                       </span>
                     )}
                  </div>
                </div>

                {plan.id === 'pro' && (
                  <div className="mb-8 flex items-center gap-3">
                    <div className="h-px flex-grow bg-slate-100" />
                    <span className="text-[11px] font-black text-[#0070E0] uppercase tracking-[0.2em]">3-Day Free Trial Included</span>
                    <div className="h-px flex-grow bg-slate-100" />
                  </div>
                )}

                <div className="flex-grow space-y-5 mb-12 text-left">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 group/feat">
                      <div className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center shrink-0 border transition-all ${plan.popular ? 'bg-[#0070E0]/5 border-[#0070E0]/20 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-[#0070E0]' : 'text-slate-400'}`} strokeWidth={3} />
                      </div>
                      <span className="text-[15px] font-medium text-slate-600 transition-colors group-hover/feat:text-slate-900 leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* WhatsApp Activation CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGetStarted(plan)}
                  className={`w-full py-5 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 bg-[#0070e0] text-white shadow-[0_15px_40px_rgba(0,112,224,0.3)] hover:bg-[#005bb5]`}
                >
                  <MessageSquare className="w-5 h-5" />
                  {plan.cta}
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        {/* Trial Nudge */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Start free, upgrade anytime via WhatsApp.
          </p>
        </motion.div>

        {/* Global Footer Trust Row */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 md:mt-20 pt-8 md:pt-10 border-t border-slate-100 flex flex-col md:row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 group text-slate-400 hover:text-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm group-hover:border-slate-200 group-hover:shadow-md transition-all">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Cancel anytime</p>
                <p className="text-[9px] font-medium leading-none mt-0.5">Full control via support</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 group text-slate-400 hover:text-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm group-hover:border-slate-200 group-hover:shadow-md transition-all">
                <Lock className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Manual Activation</p>
                <p className="text-[9px] font-medium leading-none mt-0.5">Verified via WhatsApp</p>
              </div>
            </div>

            <div className="flex items-center gap-3 group text-slate-400 hover:text-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm group-hover:border-slate-200 group-hover:shadow-md transition-all">
                <Headphones className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">24/7 Priority</p>
                <p className="text-[9px] font-medium leading-none mt-0.5">Personal assistance</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 border-l border-slate-100 pl-8 hidden lg:flex">
             <Globe className="w-4 h-4" />
             <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
               Global Community Support
             </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
