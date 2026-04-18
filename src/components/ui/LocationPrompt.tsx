import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, Map as MapIcon, X, ShieldCheck, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getUserLocation } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'
import { saveUserLocation } from '../../lib/location'

interface LocationPromptProps {
  isOpen: boolean
  onClose: () => void
}

export default function LocationPrompt({ isOpen, onClose }: LocationPromptProps) {
  const navigate = useNavigate()
  const { updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUseLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      const pos = await getUserLocation()
      const { error: updateError } = await updateProfile({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      })
      if (updateError) {
        setError(updateError.message || 'Failed to save location.')
      } else {
        // Use the new centralized utility for 24h persistence
        saveUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        onClose()
      }
    } catch (err) {
      console.error('Location error:', err)
      setError('Location permission denied or unavailable.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualEntry = () => {
    navigate('/onboarding-location')
    onClose()
  }

  const handleNotNow = () => {
    // Dismiss for 24 hours (fake a date in the past that makes it "seen" but allows showing again soon if logic allows, 
    // or just set a "dismissed" flag). Let's use 30 days for primary, 24h for Not Now.
    localStorage.setItem('carxai_location_prompt_seen', (Date.now() - (29 * 24 * 60 * 60 * 1000)).toString()) 
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                     <MapPin className="w-6 h-6 text-navy animate-pulse" />
                   </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="text-center space-y-4 mb-10">
                <h3 className="text-[26px] font-display font-black text-navy tracking-tight italic leading-tight uppercase">
                  Find the best <br />
                  <span className="text-on-surface tracking-tighter not-italic font-black">nearby help</span>
                </h3>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed px-2">
                  Enable your location so we can try to show you the most relevant mechanic and towing contacts in your area, faster and more accurately.
                </p>
              </div>

              {/* Actions Section */}
              <div className="space-y-3">
                <button
                  onClick={handleUseLocation}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-5 rounded-[24px] bg-navy text-white shadow-lg shadow-navy/20 hover:brightness-110 active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-[15px] tracking-tight">Use My Location</span>
                  </div>
                  {loading ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all" />
                  )}
                </button>

                <button
                  onClick={handleManualEntry}
                  className="w-full flex items-center justify-between p-5 rounded-[24px] bg-white border border-slate-100 text-on-surface hover:border-navy/20 active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-navy/5 group-hover:text-navy transition-all">
                      <MapIcon className="w-5 h-5 text-slate-400 group-hover:text-navy" />
                    </div>
                    <span className="font-bold text-[15px] tracking-tight">Enter Manually</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={handleNotNow}
                  className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted/60 hover:text-on-surface transition-colors"
                >
                  Not Now
                </button>
              </div>

              {/* Trust Footer */}
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                 <p className="text-[10px] font-bold text-muted leading-relaxed uppercase tracking-wide opacity-70">
                   Benefit: Precision nearby <br />
                   mechanic & towing results
                 </p>
              </div>
            </div>

            {error && (
              <div className="px-8 pb-4">
                <p className="text-[11px] font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                  {error}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
