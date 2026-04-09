import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Mail, Phone, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface MechanicLeadModalProps {
  shareId: string
  reportId: string
  isOpen: boolean
  onClose: () => void
}

export default function MechanicLeadModal({ shareId, reportId, isOpen, onClose }: MechanicLeadModalProps) {
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

    try {
      const { error: insertError } = await supabase
        .from('mechanic_leads')
        .insert([{
          report_id: reportId,
          share_id: shareId,
          contact_value: contactValue.trim(),
          contact_type: type,
          source: 'shared_report_modal'
        }] as any)

      if (insertError) throw insertError

      if (typeof window !== 'undefined' && 'dataLayer' in window) {
        (window as any).dataLayer.push({ event: 'mechanic_lead_submitted', leadType: type })
      }

      setSubmitted(true)
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err: any) {
      console.error('Lead capture error:', err)
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
            className="relative w-full max-w-lg bg-[#F4F7FF] rounded-[32px] overflow-hidden shadow-2xl border border-white/50"
          >
            {/* Glossy top highlight */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            
            {/* Close Button */}
            {!submitted && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-600 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="p-8 md:p-10 relative z-10">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-8"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Thanks!</h3>
                    <p className="text-slate-600 font-medium">We'll notify you about relevant nearby opportunities.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E3882]/5 border border-[#0E3882]/10 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0E3882] animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#0E3882]">Mechanic Network</span>
                    </div>

                    <h2 className="text-3xl font-display font-black text-[#0E1B39] tracking-tight mb-4">
                      Get more nearby client opportunities
                    </h2>
                    
                    <p className="text-sm font-medium text-slate-600 leading-relaxed mb-8">
                      Leave your phone number or email to receive similar diagnostic cases and local customer requests in the future.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            value={contactValue}
                            onChange={(e) => setContactValue(e.target.value)}
                            placeholder="Enter your email or phone number"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070E0] focus:border-transparent transition-all font-medium"
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span className="text-slate-300">/</span>
                            <Phone className="w-4 h-4" />
                          </div>
                        </div>
                        {error && <p className="text-red-500 text-xs font-semibold mt-2 ml-1">{error}</p>}
                      </div>

                      <div className="pt-2 flex flex-col gap-3">
                        <button
                          type="submit"
                          disabled={submitting || !contactValue.trim()}
                          className="w-full py-4 rounded-xl bg-[#0070E0] text-white font-bold tracking-wide shadow-lg shadow-[#0070E0]/20 hover:bg-[#005bb5] transition-all disabled:opacity-50 disabled:hover:bg-[#0070E0] flex items-center justify-center gap-2 group"
                        >
                          {submitting ? 'Submitting...' : 'Continue'}
                          {!submitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full py-3 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
                        >
                          Skip and view report
                        </button>
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
