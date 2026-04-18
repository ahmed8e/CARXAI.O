import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Star, PhoneCall, MessageCircle, 
  ChevronRight, Navigation, Search, Copy, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getUserLocation, formatDistance, isIOS, getMapLinks } from '../lib/utils'
import type { TowingProvider } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'
import LocationPrompt from '../components/ui/LocationPrompt'
import QualityPrompt from '../components/ui/QualityPrompt'
import UpgradePrompt from '../components/ui/UpgradePrompt'

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
        <div className="p-8 pt-6 relative">
          <button onClick={onClose} className="absolute right-6 top-6 w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#0E1B39] transition-all">
            <X className="w-4.5 h-4.5" />
          </button>

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
                className="w-full flex items-center justify-between p-5 rounded-[24px] bg-white border border-slate-100 text-[#0E1B39] group transition-all active:scale-[0.98] hover:border-navy/20 hover:shadow-xl hover:shadow-navy/5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${opt.color} flex items-center justify-center text-white shadow-xl shadow-black/10 transition-transform group-hover:scale-105`}>
                    <opt.icon className="w-5.5 h-5.5" />
                  </div>
                  <span className="font-bold text-[16px] tracking-tight">{opt.label}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-4.5 h-4.5 text-navy" />
                </div>
              </button>
            ))}

            <div className="pt-6 mt-6 border-t border-slate-50">
              <button
                onClick={() => {
                  const addr = `${provider.address || ''} ${provider.city || ''}`.trim();
                  navigator.clipboard.writeText(addr);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-5 rounded-[24px] bg-slate-50 border border-slate-100 text-[#0E1B39] group transition-all active:scale-[0.98] hover:bg-white hover:border-navy/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-navy group-hover:text-white transition-all">
                    <Copy className="w-5.5 h-5.5" />
                  </div>
                  <span className="font-bold text-[16px] tracking-tight">Copy Address</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-40 group-hover:opacity-100">
                  <ChevronRight className="w-4.5 h-4.5 text-navy" />
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-10 py-5 rounded-[22px] bg-slate-50 border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-navy hover:bg-white hover:border-navy/20 transition-all"
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
        <div className="p-8 pt-6 relative">
          <button onClick={onClose} className="absolute right-6 top-6 w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#0E1B39] transition-all">
            <X className="w-4.5 h-4.5" />
          </button>

          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
          
          <div className="text-center mb-10">
            <h3 className="text-2xl font-display font-black text-[#0E1B39] tracking-tight mb-2 uppercase italic leading-none">Contact choice</h3>
            <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Connect with the provider</p>
          </div>
          
          <div className="space-y-4">
            <a
              href={`tel:${provider.phone}`}
              className="w-full flex items-center justify-between p-6 rounded-[28px] bg-white border border-slate-100 group transition-all active:scale-[0.98] shadow-sm hover:border-navy/20 hover:shadow-xl hover:shadow-navy/5"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center text-white shadow-xl shadow-navy/20 transition-transform group-hover:scale-105">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-[16px] uppercase tracking-widest leading-none mb-1.5 text-navy group-hover:text-[#0070e0] transition-colors">Call Now</span>
                  <span className="text-[13px] text-slate-400 font-medium tracking-tight whitespace-nowrap">{provider.phone}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-5.5 h-5.5 text-navy" />
              </div>
            </a>

            <a
              href={`https://wa.me/${provider.phone?.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-between p-6 rounded-[28px] bg-white border border-slate-100 group transition-all active:scale-[0.98] shadow-sm hover:border-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/5"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-xl shadow-[#25D366]/20 transition-transform group-hover:scale-105">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-[16px] uppercase tracking-widest leading-none mb-1.5 text-[#25D366]">WhatsApp</span>
                  <span className="text-[13px] text-slate-400 font-medium tracking-tight whitespace-nowrap">Rapid messaging</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ChevronRight className="w-5.5 h-5.5 text-navy" />
              </div>
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-10 py-5 rounded-[22px] bg-slate-50 border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-navy hover:bg-white hover:border-navy/20 transition-all"
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
  
  const { user } = useAuth()
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [showQualityPrompt, setShowQualityPrompt] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const userPlan = user?.user_metadata?.plan || 'Free'
  const isPaidUser = userPlan === 'Pro' || userPlan === 'Advance'

  useEffect(() => {
    // Proactive prompt sequencing
    const timer = setTimeout(() => {
      // 1. Check for Plan Gating
      if (!isPaidUser) {
        setShowUpgradePrompt(true)
        return
      }

      // 2. Proactive informational sequencing for paid users
      const hasLocation = user?.user_metadata?.latitude || user?.user_metadata?.city
      const lastLocSeen = localStorage.getItem('carxai_location_prompt_seen')
      const lastQualSeen = localStorage.getItem('carxai_quality_prompt_seen')
      const now = Date.now()
      
      const locActive = !hasLocation && (!lastLocSeen || now - parseInt(lastLocSeen) > 24 * 60 * 60 * 1000)
      const qualActive = !lastQualSeen

      if (locActive) {
        setShowLocationPrompt(true)
      } else if (qualActive) {
        setShowQualityPrompt(true)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [user, isPaidUser])

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
    <div className="min-h-full bg-[#f8f9fb]">
      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-overlay">
        <div className="max-w-2xl mx-auto px-5 py-4">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center shadow-lg shadow-navy/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black text-on-surface tracking-tight">Find Towing</h1>
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
                {loading ? 'Getting your location…' : 'CarxAI Recovery Network'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              placeholder="Search by city..."
              className="w-full bg-[#f3f4f6] border border-overlay rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-muted/60 focus:outline-none focus:border-navy/40 focus:bg-white transition-all"
            />
          </div>

          {/* Location status — synchronized with Mechanic page */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" />
              <p className="text-[11px] font-bold text-blue-600">Detecting your location…</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 py-6 pb-32">
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
            {/* ── Featured card ────────────────────────────────── */}
            {featured && (
              <motion.div 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mb-5 cursor-pointer outline-none"
                onClick={() => setSelectedProvider(featured)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedProvider(featured) }}
                role="button"
                tabIndex={0}
              >
                <div className="w-full text-left relative overflow-hidden bg-gradient-to-br from-navy to-[#0F172A] text-white p-6 rounded-[28px] shadow-xl shadow-navy/15 group">
                  {/* Featured Header Row */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white">
                      <Star className="w-3 h-3" /> Nearest help
                    </span>
                    <div className="h-px flex-1 bg-white/10 ml-4 max-w-[40px]" />
                  </div>

                  <div className="flex items-start gap-4">
                    <ProviderImage src={featured.imageUrl} size="lg" />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="text-[18px] font-bold truncate leading-tight mb-1">{featured.name}</h3>
                      <p className="text-[13px] text-white/60 truncate mb-3 leading-none">{featured.city}{featured.address ? ` · ${featured.address}` : ''}</p>
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        {featured.distance !== null && (
                          <span className="flex items-center gap-1 text-[12px] font-bold text-sky-300">
                            <Navigation className="w-3 h-3" /> {formatDistance(featured.distance)}
                          </span>
                        )}
                        {featured.rating > 0 && (
                          <span className="flex items-center gap-1 text-[12px] font-bold text-yellow-300">
                            <Star className="w-3 h-3 fill-yellow-300" /> {(Number(featured.rating) || 0).toFixed(1)}
                            {featured.reviewCount > 0 && <span className="text-white/40 font-medium">({featured.reviewCount})</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={e => { e.stopPropagation(); setContactChooserProvider(featured) }}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0070e0] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-[#0070e0]/90 active:scale-[0.98] transition-all"
                    >
                      <PhoneCall className="w-4 h-4" /> Call Now
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setMapChooserProvider(featured) }}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/20 active:scale-[0.98] transition-all"
                    >
                      <Navigation className="w-4 h-4" /> Directions
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Count row ────────────────────────────────────── */}
            <div className="flex items-center justify-between mt-4 mb-6 px-1">
              <p className="text-[11px] font-black text-muted uppercase tracking-widest">
                {filtered.length} provider{filtered.length !== 1 ? 's' : ''} found
              </p>
              {featured?.distance !== null && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/5 border border-navy/10 text-[9px] font-black text-navy/50 uppercase tracking-widest">
                  <Navigation className="w-2.5 h-2.5" /> Ordered by distance
                </div>
              )}
            </div>
            {/* ── Provider list ───────────────────────────────── */}
            <div className="space-y-2.5">
              {rest.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.025 }}
                >
                  <button
                    onClick={() => setSelectedProvider(p)}
                    className="w-full text-left p-4 rounded-2xl bg-white border border-overlay hover:border-[#0070e0]/30 hover:shadow-xl hover:shadow-navy/5 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <ProviderImage src={p.imageUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-on-surface truncate leading-tight group-hover:text-navy transition-colors mb-0.5">{p.name}</h3>
                        <p className="text-[12px] text-muted truncate leading-none mb-2">{p.city}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          {p.distance !== null && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-navy/70 bg-navy/[0.03] px-1.5 py-0.5 rounded-md">
                              <Navigation className="w-2.5 h-2.5" /> {formatDistance(p.distance)}
                            </span>
                          )}
                          {(p.rating || 0) > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-on-surface/60">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {(Number(p.rating) || 0).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Affordance */}
                      <div className="w-10 h-10 rounded-full bg-[#0070e0]/5 flex items-center justify-center text-[#0070e0] group-hover:bg-[#0070e0] group-hover:text-white transition-all duration-300 shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                </motion.div>
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
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-[32px] shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-10 h-1.5 rounded-full bg-overlay" />
              </div>
              <div className="px-6 pb-8">
                <div className="flex justify-end mb-2">
                  <button onClick={() => setSelectedProvider(null)} className="w-9 h-9 rounded-full bg-surface-low flex items-center justify-center text-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Provider header */}
                <div className="flex items-start gap-5 mb-8">
                  <ProviderImage src={selectedProvider.imageUrl} size="lg" />
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-2xl font-display font-black text-on-surface tracking-tight leading-none mb-2">{selectedProvider.name}</h2>
                    <p className="text-[14px] text-muted font-medium leading-relaxed">{selectedProvider.city}{selectedProvider.address ? ` · ${selectedProvider.address}` : ''}</p>
                    <span className="inline-flex mt-3 text-[10px] font-black uppercase tracking-widest bg-navy/5 text-navy/60 border border-navy/10 px-3 py-1.5 rounded-xl">Towing & Recovery</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {selectedProvider.distance !== null && (
                    <div className="bg-[#f3f4f6] border border-overlay p-3.5 rounded-2xl text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">Distance</p>
                      <p className="text-[15px] font-bold text-on-surface">{formatDistance(selectedProvider.distance)}</p>
                    </div>
                  )}
                  {selectedProvider.rating > 0 && (
                    <div className="bg-[#f3f4f6] border border-overlay p-3.5 rounded-2xl text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">Rating</p>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-[15px] font-bold text-on-surface">{selectedProvider.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {selectedProvider.reviewCount > 0 && (
                    <div className="bg-[#f3f4f6] border border-overlay p-3.5 rounded-2xl text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">Reviews</p>
                      <p className="text-[15px] font-bold text-on-surface">{selectedProvider.reviewCount}</p>
                    </div>
                  )}
                </div>

                {/* Description card */}
                <div className="mb-8 p-5 bg-[#f8f9fa] border border-overlay rounded-3xl">
                  <p className="text-[13px] font-medium text-on-surface/70 leading-relaxed italic">
                    {selectedProvider.description || trustFallback(String(selectedProvider.id))}
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="space-y-3.5">
                  {selectedProvider.phone && (
                    <>
                      <button
                        onClick={() => setContactChooserProvider(selectedProvider)}
                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[22px] bg-gradient-to-b from-[#0070e0] to-[#005bb5] text-white text-[13px] font-black uppercase tracking-[0.05em] shadow-[0_20px_40px_-15px_rgba(0,112,224,0.3)] border border-white/10 hover:brightness-110 active:scale-[0.97] transition-all"
                      >
                        <PhoneCall className="w-5 h-5 shadow-sm" /> Call Now
                      </button>
                      <button
                        onClick={() => setMapChooserProvider(selectedProvider)}
                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[22px] bg-white border border-overlay text-navy text-[13px] font-black uppercase tracking-[0.05em] active:scale-[0.97] transition-all"
                      >
                        <Navigation className="w-5 h-5" /> Directions
                      </button>
                    </>
                  )}
                </div>
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

      <LocationPrompt 
        isOpen={showLocationPrompt} 
        onClose={() => {
          setShowLocationPrompt(false)
          // Sequence to QualityPrompt if not seen
          if (!localStorage.getItem('carxai_quality_prompt_seen')) {
            setTimeout(() => setShowQualityPrompt(true), 600)
          }
        }} 
      />

      <QualityPrompt
        isOpen={showQualityPrompt}
        onClose={() => setShowQualityPrompt(false)}
        onContinue={() => setShowQualityPrompt(false)}
      />

      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </div>
  )
}
