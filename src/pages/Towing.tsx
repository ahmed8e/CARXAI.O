import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Star, PhoneCall, MessageCircle, 
  ChevronRight, Navigation, Search, Copy
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getUserLocation, formatDistance, isIOS, getMapLinks } from '../lib/utils'
import type { TowingProvider } from '../lib/types'

// ── Types ────────────────────────────────────────────────────────────
const trustFallback = (id: string) => {
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const fallbacks = [
    "Certified emergency recovery expert with 24/7 specialized roadside assistance for all vehicle types.",
    "Professional towing service known for rapid response times and careful handling of premium vehicles.",
    "Fully equipped recovery fleet providing secure transport and minor roadside repairs since 2018.",
    "Highly rated local recovery partner offering flatbed towing and emergency battery jump-starts."
  ]
  return fallbacks[seed % fallbacks.length]
}

// ── Components ───────────────────────────────────────────────────────

function BrandedPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-navy/5 to-navy/10 ${className}`}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="grid2" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid2)" />
        </svg>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center mb-1">
          <Truck className="w-5 h-5 text-navy/40" />
        </div>
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-navy/30">CarxAI</p>
      </div>
    </div>
  )
}

function ProviderImage({ src, size }: { src: string | null; size: 'sm' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const cls = size === 'lg'
    ? 'w-20 h-20 rounded-2xl object-cover border border-overlay shadow-sm'
    : 'w-14 h-14 rounded-2xl object-cover border border-overlay shrink-0 shadow-sm'

  if (!src || failed) {
    return <BrandedPlaceholder className={`${size === 'lg' ? 'w-20 h-20 rounded-2xl' : 'w-14 h-14 rounded-2xl'} border border-overlay shrink-0`} />
  }
  return <img src={src} alt="" className={cls} onError={() => setFailed(true)} />
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-overlay p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-gray-100 rounded-full w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
      </div>
    </div>
  )
}

// ── MapChooser sheet ──────────────────────────────────────────────────
function MapChooser({ provider, onClose }: {
  provider: TowingProvider
  onClose: () => void
}) {
  const ios = isIOS()
  const links = getMapLinks(provider.lat, provider.lng, provider.name)
  
  const options = [
    { label: 'Google Maps', scheme: links.googleMapsApp, web: links.googleMaps, color: 'bg-blue-600', icon: Navigation },
    { label: 'Waze', scheme: links.wazeApp, web: links.waze, color: 'bg-[#00D4B5]', icon: Navigation },
    ...(ios ? [{ label: 'Apple Maps', scheme: links.appleMaps, web: links.appleMapsWeb, color: 'bg-slate-900', icon: Navigation }] : []),
  ]

  const handleOpen = (scheme: string, web: string) => {
    const start = Date.now()
    window.location.href = scheme
    setTimeout(() => {
      if (Date.now() - start < 2000) {
        window.open(web, '_blank', 'noreferrer')
      }
    }, 1500)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0E1B39]/40 backdrop-blur-md p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.15)] mb-0 sm:mb-safe"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 pt-6">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
          
          <div className="text-center mb-10">
            <h3 className="text-2xl font-display font-black text-[#0E1B39] tracking-tight mb-2 uppercase italic leading-none">Navigation</h3>
            <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Select map application</p>
          </div>
          
          <div className="space-y-3.5">
            {options.map(opt => (
              <button
                key={opt.label}
                onClick={() => handleOpen(opt.scheme, opt.web)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 text-[#0E1B39] group transition-all active:scale-[0.98] hover:border-[#0070e0]/30 hover:shadow-xl hover:shadow-[#0E1B39]/5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${opt.color} flex items-center justify-center text-white shadow-xl shadow-black/10 transition-transform group-hover:scale-105`}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-[16px] tracking-tight">{opt.label}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-50">
              <button
                onClick={() => {
                  const addr = `${provider.address || ''} ${provider.city || ''}`.trim();
                  navigator.clipboard.writeText(addr);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 text-[#0E1B39] group transition-all active:scale-[0.98] hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0E1B39] group-hover:text-white transition-all">
                    <Copy className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-[16px] tracking-tight">Copy Address</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-10 py-5 text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-[#0E1B39] transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── ContactChooser sheet ──────────────────────────────────────────────
function ContactChooser({ provider, onClose }: {
  provider: TowingProvider
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0E1B39]/40 backdrop-blur-md p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.15)] mb-0 sm:mb-safe"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 pt-6">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
          
          <div className="text-center mb-10">
            <h3 className="text-2xl font-display font-black text-[#0E1B39] tracking-tight mb-2 uppercase italic leading-none">Contact choice</h3>
            <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Connect with the provider</p>
          </div>
          
          <div className="space-y-4">
            <a
              href={`tel:${provider.phone}`}
              className="w-full flex items-center justify-between p-5 rounded-[24px] bg-[#0E1B39] text-white group transition-all active:scale-[0.98] shadow-2xl shadow-[#0E1B39]/20"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-[15px] uppercase tracking-widest leading-none mb-1.5">Call Now</span>
                  <span className="text-[13px] opacity-60 font-medium tracking-tight whitespace-nowrap">{provider.phone}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/15 transition-all">
                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100" />
              </div>
            </a>

            <a
              href={`https://wa.me/${provider.phone?.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-between p-5 rounded-[24px] bg-[#25D366] text-white group transition-all active:scale-[0.98] shadow-2xl shadow-[#25D366]/20"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-[15px] uppercase tracking-widest leading-none mb-1.5">WhatsApp</span>
                  <span className="text-[13px] opacity-60 font-medium tracking-tight whitespace-nowrap">Rapid messaging</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/15 transition-all">
                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100" />
              </div>
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-10 py-5 text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-[#0E1B39] transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export default function Towing() {
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<TowingProvider[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<TowingProvider | null>(null)
  const [mapChooserProvider, setMapChooserProvider] = useState<TowingProvider | null>(null)
  const [contactChooserProvider, setContactChooserProvider] = useState<TowingProvider | null>(null)

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const { data, error } = await supabase
          .from('service_providers_raw')
          .select('*')
          .ilike('Category', '%remorquage%')
        
        if (error) throw error

        let userLoc: { lat: number, lng: number } | null = null
        try {
          const pos = await getUserLocation()
          userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        } catch (e) {
          console.warn('Location access denied')
        }

        const mapped: TowingProvider[] = (data || []).map((p: any) => {
          const lat = p.Lat ? Number(p.Lat) : p.Latitude ? Number(p.Latitude) : null
          const lng = p.Long ? Number(p.Long) : p.Longitude ? Number(p.Longitude) : null
          const rating = Number(p.Rating) || 0
          const reviewCount = Number(p.Review) || Number(p.ReviewCount) || 0

          return {
            id: p.id,
            name: p.Name || p.Business_name || 'Unnamed Provider',
            phone: p.Phone || '',
            city: p.City || 'Unknown City',
            address: p.Address || '',
            rating,
            reviewCount,
            lat,
            lng,
            imageUrl: p.ImageUrl || p.image1 || null,
            category: p.Category || 'Towing',
            description: p.Description || p.BusinessDescription || null,
            distance: userLoc && lat && lng 
              ? Math.sqrt(Math.pow(lat - userLoc.lat, 2) + Math.pow(lng - userLoc.lng, 2)) * 111
              : null
          }
        })

        setProviders(mapped.sort((a, b) => (a.distance || 999) - (b.distance || 999)))
      } catch (err) {
        console.error('Error loading providers:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProviders()
  }, [])

  const filtered = useMemo(() => {
    if (!citySearch) return providers
    return providers.filter(p => p.city.toLowerCase().includes(citySearch.toLowerCase()))
  }, [providers, citySearch])

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-overlay pt-12 pb-8 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-on-surface tracking-tight uppercase italic leading-none">Find Towing</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mt-1">CarxAI Recovery Network</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted group-focus-within:text-navy transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Filter by city..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full bg-surface-low border border-overlay rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-navy/5 focus:border-navy outline-none transition-all placeholder:text-muted/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="space-y-4">
            <div className="h-64 bg-white rounded-[32px] border border-overlay animate-pulse" />
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-low flex items-center justify-center mx-auto mb-6">
              <Truck className="w-8 h-8 text-muted/20" />
            </div>
            <p className="text-lg font-display font-bold text-on-surface">No providers found</p>
            <p className="text-sm text-muted mt-1">Try a different city or check your internet connection.</p>
          </div>
        ) : (
          <>
            {/* Featured Provider */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] border-2 border-navy/10 overflow-hidden shadow-xl shadow-navy/5 group cursor-pointer outline-none"
                onClick={() => setSelectedProvider(featured)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedProvider(featured) }}
                role="button"
                tabIndex={0}
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <ProviderImage src={featured.imageUrl} size="lg" />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-navy bg-navy/5 px-2.5 py-1 rounded-lg">
                            <Star className="w-3 h-3 fill-navy" /> Nearest Help
                          </span>
                        </div>
                        <h2 className="text-2xl font-display font-black text-on-surface tracking-tight leading-none">{featured.name}</h2>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-surface-low p-4 rounded-2xl border border-overlay">
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted mb-1">Response Distance</p>
                      <p className="text-base font-bold text-on-surface italic">{featured.distance ? formatDistance(featured.distance) : 'Unknown'}</p>
                    </div>
                    <div className="bg-surface-low p-4 rounded-2xl border border-overlay">
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted mb-1">Service City</p>
                      <p className="text-base font-bold text-on-surface italic">{featured.city}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={e => { e.stopPropagation(); setContactChooserProvider(featured) }}
                      className="flex-1 flex items-center justify-center gap-3 py-4.5 rounded-2xl bg-navy text-white text-[11px] font-black uppercase tracking-[0.1em] shadow-xl shadow-navy/20 active:scale-[0.98] transition-all group"
                    >
                      <PhoneCall className="w-4 h-4 group-hover:scale-110 transition-transform" /> Call Now
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setMapChooserProvider(featured) }}
                      className="flex-1 flex items-center justify-center gap-3 py-4.5 rounded-2xl bg-white border border-overlay text-navy text-[11px] font-black uppercase tracking-[0.1em] hover:bg-surface-low hover:border-navy/20 active:scale-[0.98] transition-all group"
                    >
                      <Navigation className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> Directions
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* List of others */}
            <div className="space-y-4">
              {rest.map((p, idx) => (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={p.id}
                  onClick={() => setSelectedProvider(p)}
                  className="w-full bg-white rounded-3xl border border-overlay p-4 hover:border-navy/20 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <ProviderImage src={p.imageUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-on-surface truncate group-hover:text-navy transition-colors mb-0.5">{p.name}</h3>
                      <p className="text-[12px] text-muted truncate leading-none mb-2">{p.city}</p>
                      <div className="flex items-center gap-3">
                        {p.distance !== null && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-navy/70">
                            <Navigation className="w-3 h-3" /> {formatDistance(p.distance)}
                          </span>
                        )}
                        {(p.rating || 0) > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-on-surface/60">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {(Number(p.rating) || 0).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-navy group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedProvider(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-surface rounded-t-[40px] shadow-2xl overflow-hidden p-6 pb-12"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 opacity-50" />
              
              <div className="flex items-start gap-6 mb-8">
                <ProviderImage src={selectedProvider.imageUrl} size="lg" />
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-black text-on-surface tracking-tight mb-2 uppercase italic">{selectedProvider.name}</h2>
                  <p className="text-[13px] text-muted font-bold uppercase tracking-widest">{selectedProvider.city}</p>
                </div>
              </div>

              <div className="bg-white border border-overlay rounded-3xl p-6 mb-8">
                <p className="text-[13px] text-muted leading-relaxed italic">
                  {selectedProvider.description || trustFallback(String(selectedProvider.id))}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setContactChooserProvider(selectedProvider)}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] bg-navy text-white text-[11px] font-black uppercase tracking-[0.1em] shadow-2xl shadow-navy/20 active:scale-[0.98] transition-all"
                >
                  <PhoneCall className="w-5 h-5" /> Call Now
                </button>
                <button
                  onClick={() => setMapChooserProvider(selectedProvider)}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] bg-white border border-overlay text-navy text-[11px] font-black uppercase tracking-[0.1em] active:scale-[0.98] transition-all"
                >
                  <Navigation className="w-5 h-5" /> Directions
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapChooserProvider && (
          <MapChooser provider={mapChooserProvider} onClose={() => setMapChooserProvider(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contactChooserProvider && (
          <ContactChooser provider={contactChooserProvider} onClose={() => setContactChooserProvider(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
