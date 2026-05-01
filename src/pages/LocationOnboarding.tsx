import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Navigation, ArrowRight, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserLocation } from '../lib/utils'
import { saveUserLocation } from '../lib/location'

const SUGGESTED_CITIES = [
  'London', 'New York', 'Paris', 'Berlin', 'Tokyo', 'Sydney'
]

export default function LocationOnboarding() {
  const { updateProfile } = useAuth()
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCityInput, setShowCityInput] = useState(false)

  const handleCitySubmit = async (selectedCity: string) => {
    if (!selectedCity) return
    const now = Date.now()
    const { error: updateError } = await updateProfile({ 
      city: selectedCity,
      location_timestamp: now
    })
    if (updateError) {
      setError(updateError.message || 'Failed to save city. Please try again.')
      setLoading(false)
    } else {
      // Save for 24h persistence locally
      saveUserLocation({ lat: 0, lng: 0 }, selectedCity, now)
      navigate('/choose-plan')
    }
  }

  const handleUseLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      const pos = await getUserLocation()
      const now = Date.now()
      const { error: updateError } = await updateProfile({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        location_timestamp: now
      })
      if (updateError) {
        setError(updateError.message || 'Failed to save location.')
      } else {
        // Save for 24h persistence locally
        saveUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }, undefined, now)
        navigate('/choose-plan')
      }
    } catch (err) {
      console.error('Location error:', err)
      setError('Location permission denied or unavailable.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/choose-plan')
  }

  return (
    <div className="min-h-screen bg-soft dark:bg-surface-low flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-navy/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <MapPin className="w-8 h-8 text-navy" />
          </div>
          <h1 className="text-3xl font-display font-bold text-on-surface mb-3 tracking-tight italic uppercase">
            Let's find your local help
          </h1>
          <p className="text-muted font-medium text-sm leading-relaxed px-4">
            Choose your city or enable location to discover relevant towing and mechanics nearby.
          </p>
        </div>

        <div className="bg-surface dark:bg-surface p-8 rounded-3xl border border-overlay shadow-2xl shadow-black/5 space-y-4">
          
          <AnimatePresence mode="wait">
            {!showCityInput ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                {/* Primary Action: Choose My City */}
                <button
                  onClick={() => setShowCityInput(true)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-surface-low dark:bg-surface-high/40 border border-overlay hover:border-navy/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-surface flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Search className="w-5 h-5 text-navy" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-on-surface">Choose my city</p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Manual Selection</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:text-navy transition-all" />
                </button>

                {/* Secondary Action: Use My Location */}
                <button
                  onClick={handleUseLocation}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-surface-low dark:bg-surface-high/40 border border-overlay hover:border-navy/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-surface flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Navigation className="w-5 h-5 text-navy" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-on-surface">Use my location</p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Automatic Scan</p>
                    </div>
                  </div>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:text-navy transition-all" />
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="city-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-muted" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter your city name..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-low dark:bg-surface-low/60 border border-overlay text-on-surface font-bold focus:border-navy focus:ring-[3px] focus:ring-navy/10 placeholder:text-muted/50 transition-all outline-none"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCitySubmit(city)}
                  />
                  <button 
                    onClick={() => setShowCityInput(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-on-surface transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest pl-1">Popular Cities</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_CITIES.map(c => (
                      <button
                        key={c}
                        onClick={() => handleCitySubmit(c)}
                        className="px-4 py-2 rounded-xl bg-surface-low dark:bg-surface-high/40 border border-overlay hover:border-navy hover:text-navy transition-all text-xs font-bold"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!city || loading}
                  onClick={() => handleCitySubmit(city)}
                  className="w-full py-4 rounded-2xl bg-navy text-white font-bold shadow-lg shadow-navy/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust Line */}
          <div className="pt-4 border-t border-overlay flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted leading-relaxed font-medium">
              Car Safety helps you discover relevant nearby options. We don't set prices or act as a middleman.
            </p>
          </div>
        </div>

        {/* tertiary action: skip */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleSkip}
            className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-on-surface transition-colors"
          >
            Not now, I'll do this later
          </button>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4 text-xs font-bold text-red-500 bg-red-50 py-2 rounded-lg border border-red-100"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
