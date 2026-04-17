import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Mail, Phone, ArrowRight } from 'lucide-react'
import { Logo } from './ui/Brand'
import { supabase } from '../lib/supabase'

interface MechanicLeadModalProps {
  sharedLinkId: string
  isOpen: boolean
  onClose: () => void
}

export default function MechanicLeadModal({ sharedLinkId, isOpen, onClose }: MechanicLeadModalProps) {
  const [contactValue, setContactValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Close with Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const determineContactType = (val: string): 'email' | 'phone' | null => {
    const cleaned = val.trim()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return 'email'
    if (/^[\d\s\+\-\(\)]+$/.test(cleaned) && cleaned.replace(/\D/g, '').length >= 7) return 'phone'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactValue.trim()) return

    const type = determineContactType(contactValue)
    if (!type) {
      setError('Please enter a valid email or phone number.')
      return
    }

    setSubmitting(true)
    setError('')

    const payload = {
      report_id: null, // Lead capture is independent of history
      shared_link_id: sharedLinkId,
      contact_value: contactValue.trim(),
      contact_type: type,
      source: 'shared_report_modal'
    }

    console.group('[Carxai Lead Capture] Submission Details')
    console.log('Shared Link UUID:', sharedLinkId)
    console.log('Payload:', payload)
    console.groupEnd()

    try {
      console.log('[Carxai Lead Capture] Proceeding with API submission...')
      
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Submission failed')
      }

      console.log('[Carxai Lead Capture] Submission Successful')

      if (typeof window !== 'undefined' && 'dataLayer' in window) {
        (window as any).dataLayer.push({ event: 'mechanic_lead_submitted', leadType: type })
      }

      setSubmitted(true)
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err: any) {
      setError('Something went wrong. You can skip for now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Subtle blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={submitted ? undefined : onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-[440px] bg-white rounded-[40px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100"
          >
            {/* Glossy top highlight */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
            
            {/* Close Button */}
            {!submitted && (
              <button
                onClick={onClose}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-300 hover:text-slate-600 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="p-10 md:p-12 relative z-10">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-10"
                  >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-8">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">You're in!</h3>
                    <p className="text-slate-500 font-medium">We'll reach out when nearby opportunities match your area.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Badge */}
                     <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy/5 border border-navy/10 mb-8">
                        <div className="w-5 h-5 rounded-[25%] overflow-hidden shadow-sm">
                          <Logo size="100%" />
                        </div>
                       <span className="text-[10px] uppercase tracking-[0.2em] font-black text-navy">Mechanic Network</span>
                     </div>

                    <h2 className="text-[32px] leading-[1.1] font-display font-black text-[#0E1B39] tracking-tight mb-5">
                      Get more local repair opportunities
                    </h2>
                    
                    <p className="text-[15px] font-medium text-slate-500 leading-relaxed mb-10">
                      Leave your email or phone number to receive relevant nearby customer requests and similar repair cases.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <div className="relative group">
                          <input
                            type="text"
                            value={contactValue}
                            onChange={(e) => setContactValue(e.target.value)}
                            placeholder="Enter your email or phone number"
                            className="w-full pl-14 pr-5 py-5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0070E0]/10 focus:border-[#0070E0] focus:bg-white transition-all font-medium text-[15px]"
                          />
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-300 group-focus-within:text-[#0070E0] transition-colors">
                            <Mail className="w-4 h-4" />
                            <div className="w-px h-3 bg-slate-200" />
                            <Phone className="w-4 h-4" />
                          </div>
                        </div>
                        {error && <p className="text-red-500 text-xs font-bold mt-3 ml-2 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-500" /> {error}</p>}
                      </div>

                      <div className="pt-2 flex flex-col gap-4">
                        <button
                          type="submit"
                          disabled={submitting || !contactValue.trim()}
                          className="w-full py-5 rounded-2xl bg-[#0070E0] text-white font-bold tracking-wide shadow-xl shadow-[#0070E0]/20 hover:bg-[#005bb5] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 group"
                        >
                          {submitting ? 'Connecting...' : 'Get opportunities'}
                          {!submitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full py-2 text-slate-400 hover:text-slate-600 text-[13px] font-bold transition-colors"
                        >
                          Skip and view report
                        </button>
                      </div>

                      {/* Trust Line */}
                      <div className="pt-4 flex items-center justify-center gap-2 border-t border-slate-100">
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No spam. Only useful local opportunities.</p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
