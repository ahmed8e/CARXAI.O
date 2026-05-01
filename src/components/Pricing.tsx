import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import { Check, Zap, Sparkles, MessageSquare, ShieldCheck, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader } from './ui/card'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { SaaSAnalytics } from '../lib/analytics'


type BillingCycleType = 'monthly' | 'yearly'

interface PricingProps {
  mode?: 'onboarding' | 'upgrade'
  currentSubscription?: any
}

import { plans } from '../lib/plans'


// ── Billing toggle ────────────────────────────────────────────────────────────
function BillingToggle({ value, onChange }: { value: BillingCycleType; onChange: (v: BillingCycleType) => void }) {
  return (
    <div className="flex justify-center">
      <div className="relative flex items-center w-fit rounded-full bg-white border border-slate-200 shadow-sm p-1.5 gap-1">
        {(['monthly', 'yearly'] as BillingCycleType[]).map((cycle) => (
          <button
            key={cycle}
            onClick={() => onChange(cycle)}
            className={`relative z-10 h-10 rounded-full px-6 text-xs font-black uppercase tracking-widest transition-colors duration-200 ${
              value === cycle ? 'text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {value === cycle && (
              <motion.span
                layoutId="billing-pill"
                className="absolute inset-0 rounded-full bg-[#0070E0] shadow-lg shadow-[#0070E0]/25"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {cycle === 'yearly' ? 'Yearly' : 'Monthly'}
              {cycle === 'yearly' && (
                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                  −20%
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}


// ── Main component ────────────────────────────────────────────────────────────
export default function Pricing({ mode = 'onboarding', currentSubscription }: PricingProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycleType>('yearly')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = (plan: typeof plans[0]) => {
    SaaSAnalytics.upgradeClick(plan.name)
    if (!user) {

      navigate('/login?redirect=choose-plan')
      return
    }

    const isUpgrade = mode === 'upgrade' || (currentSubscription && currentSubscription.planType !== 'Free')
    const phone = '33756816551'

    let text = ''
    if (isUpgrade && currentSubscription) {
      text = `Hello, I would like to upgrade my Car Safety account.\nCurrent Plan: ${currentSubscription.planType || 'Free'}\nRequested Plan: ${plan.name}\nBilling Cycle: ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}\nEmail: ${user.email}\nUser ID: ${user.id}`
    } else {
      text = `Hello, I would like to activate a paid Car Safety plan for my account.\nSelected Plan: ${plan.name}\nBilling Cycle: ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}\nEmail: ${user.email}\nUser ID: ${user.id}`
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  // Card animation variants
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    }),
  }

  return (
    <section id="pricing" className="relative py-24 md:py-36 px-4 bg-white/70 backdrop-blur-sm overflow-hidden border-t border-slate-100">

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ── Section header ── */}
        <div className="text-center mb-14 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#0070E0]/15 bg-[#0070E0]/6"
          >
            <Zap className="w-3.5 h-3.5 text-[#0070E0]" fill="currentColor" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#0070E0] font-black">Choose Your Plan</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.07 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-5 leading-[1.1]"
          >
            Smarter car help,{' '}
            <span className="inline-block border border-dashed border-[#0070E0]/60 bg-[#0070E0]/5 px-3 py-1 rounded-xl text-[#0070E0]">
              your budget
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.14 }}
            className="text-slate-500 text-base md:text-lg font-medium max-w-lg mx-auto mb-10 leading-relaxed"
          >
            From a quick free check to a full AI mechanic experience — pick the plan that fits how you drive.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <BillingToggle value={billingCycle} onChange={setBillingCycle} />
          </motion.div>
        </div>

        {/* ── Pricing cards grid ── */}
        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan, i) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
            const isPopular = plan.popular

            return (
              <motion.div
                key={plan.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                <Card
                  className={`relative flex flex-col h-full transition-all duration-300 overflow-visible ${
                    isPopular
                      ? 'ring-2 ring-[#0070E0] shadow-[0_24px_72px_rgba(0,112,224,0.16)] bg-gradient-to-b from-[#EBF5FF] to-white border-[#0070E0]/30'
                      : 'border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)] hover:border-slate-300 bg-white'
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0070E0] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#0070E0]/30">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      {plan.badgeLabel}
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-8 px-7">
                    {/* Plan name + tagline */}
                    <div className="mb-5">
                      <h3 className={`text-2xl font-bold mb-1 ${isPopular ? 'text-[#0070E0]' : 'text-slate-900'}`}>
                        {plan.name}
                      </h3>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{plan.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-5xl font-bold text-slate-900 tracking-tight tabular-nums">
                        $<NumberFlow value={price} className="font-bold" />
                      </span>
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">/ mo</span>
                        {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                          <span className="mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded leading-none">
                            Billed annually
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trial badge */}
                    {plan.trial && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-px flex-grow bg-slate-100" />
                        <span className="text-[10px] font-black text-[#0070E0] uppercase tracking-[0.18em] whitespace-nowrap">
                          {plan.trial}
                        </span>
                        <div className="h-px flex-grow bg-slate-100" />
                      </div>
                    )}

                    <p className="mt-3 text-sm text-slate-500 leading-relaxed">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="px-7 pb-8 flex flex-col flex-grow">
                    {/* CTA button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleGetStarted(plan)}
                      className={`w-full mb-7 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 transition-all duration-300 ${
                        isPopular
                          ? 'bg-[#0070E0] text-white shadow-[0_12px_36px_rgba(0,112,224,0.35)] hover:bg-[#005bb5] hover:shadow-[0_16px_44px_rgba(0,112,224,0.45)]'
                          : 'bg-slate-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-slate-700 hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)]'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {plan.cta}
                    </motion.button>

                    {/* Key features */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <span className={`grid place-content-center w-7 h-7 rounded-xl shrink-0 border ${
                            isPopular || feature.highlight
                              ? 'bg-[#0070E0]/8 border-[#0070E0]/20 text-[#0070E0]'
                              : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                            {feature.icon}
                          </span>
                          <span className={`text-sm font-medium leading-snug ${
                            feature.highlight ? 'text-slate-800' : 'text-slate-600'
                          }`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Divider + includes list */}
                    <div className="mt-auto pt-5 border-t border-slate-100 space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {plan.includes[0]}
                      </h4>
                      <ul className="space-y-2.5">
                        {plan.includes.slice(1).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 shrink-0 rounded-full grid place-content-center border ${
                              isPopular
                                ? 'bg-[#0070E0]/8 border-[#0070E0]/25'
                                : 'bg-emerald-50 border-emerald-100'
                            }`}>
                              <Check className={`w-3 h-3 ${isPopular ? 'text-[#0070E0]' : 'text-emerald-500'}`} strokeWidth={3} />
                            </span>
                            <span className="text-sm text-slate-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* ── Footer trust strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center gap-8 md:gap-10"
        >
          {/* Primary Row: Separated for hierarchy */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] text-center">
              Start free · Upgrade anytime via WhatsApp
            </p>
            <div className="w-12 h-px bg-slate-100" />
          </div>

          {/* Trust Grid: 2 columns on mobile, flex on desktop */}
          <div className="grid grid-cols-2 md:flex md:items-center justify-center gap-x-8 gap-y-6 md:gap-12 w-full max-w-2xl px-4">
            {[
              { title: 'Cancel anytime', icon: ShieldCheck },
              { title: 'No hidden fees', icon: Lock },
              { title: 'Clear limits', icon: Check },
              { title: 'Instant access', icon: Sparkles },
            ].map((trust, idx) => (
              <div key={idx} className="flex items-center gap-3 text-slate-500 justify-center md:justify-start">
                <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <trust.icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest leading-tight">
                  {trust.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
