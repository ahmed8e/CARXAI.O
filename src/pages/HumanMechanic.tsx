import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserLocation, haversineDistance, formatDistance, isIOS, getMapLinks } from '../lib/utils'
import {
  Users, MapPin, Star, Navigation, Search,
  AlertTriangle, PhoneCall, Wrench, X,
  ChevronRight, MessageCircle, Copy
} from 'lucide-react'
import LocationPrompt from '../components/ui/LocationPrompt'
import ProviderWaitingState from '../components/ui/ProviderWaitingState'
import UpgradePrompt from '../components/ui/UpgradePrompt'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { getSavedUserLocation, isLocationValid } from '../lib/location'

// ── Strict mechanic / garage / repair category whitelist ─────────────
// Only true automotive workshop / repair / inspection providers
const MECHANIC_KEYWORDS = [
  'mécanicien', 'mecanicien',
  'mechanic',
  'garage automobile', 'garage auto',
  'car repair', 'auto repair',
  'réparation automobile', 'reparation automobile',
  'atelier mécanique', 'atelier mecanique',
  'carrosserie', 'bodywork',
  'centre auto', 'auto center',
  'contrôle technique', 'controle technique', 'vehicle inspection',
  'vidange', 'oil change',
  'pneumatique', 'tyre', 'pneus',
]

// Exclude pure towing or unrelated results that may leak through
const MECHANIC_EXCLUDES = ['remorquage', 'towing', 'dépannage routier', 'depannage routier']

function isMechanicCategory(cat: string | null): boolean {
  if (!cat) return false
  const lower = cat.toLowerCase()
  if (MECHANIC_EXCLUDES.some(x => lower.includes(x))) return false
  return MECHANIC_KEYWORDS.some(kw => lower.includes(kw))
}

// ── Clean raw Supabase strings ────────────────────────────────────────
function clean(val: string | null | undefined): string | null {
  if (!val || val === 'null' || val === 'undefined' || val.trim() === '') return null
  return val.trim()
}

// ── Trust fallback messages ───────────────────────────────────────────
const TRUST_MESSAGES = [
  'Verified local garage in the Carxai network.',
  'Trusted automotive workshop, available now.',
  'Reliable mechanic for all car makes and models.',
  'Professional car repair through Carxai.',
  'Experienced local mechanic available nearby.',
]
function trustFallback(id: number): string {
  return TRUST_MESSAGES[id % TRUST_MESSAGES.length]
}

// ── Provider type ─────────────────────────────────────────────────────
interface MechanicProvider {
  id: number
  name: string
  address: string
  city: string
  phone: string | null
  rating: number
  reviewCount: number
  imageUrl: string | null
  lat: number
  lng: number
  distance: number | null
  workingHours: string | null
  website: string | null
  mapLink: string | null
  description: string | null
  category: string | null
}

function sortByDistance(list: MechanicProvider[]): MechanicProvider[] {
  return [...list].sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0
    if (a.distance === null) return 1
    if (b.distance === null) return -1
    return a.distance - b.distance
  })
}

// ── Filters ───────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Nearest', label: 'Nearest' },
  { key: 'Top Rated', label: 'Top Rated' },
]

// ── Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl border border-overlay bg-white animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-low shrink-0" />
        <div className="flex-1 space-y-2.5 py-1">
          <div className="h-4 bg-surface-low rounded-lg w-3/4" />
          <div className="h-3 bg-surface-low rounded-lg w-1/2" />
          <div className="h-3 bg-surface-low rounded-lg w-1/3" />
        </div>
        <div className="w-11 h-11 rounded-xl bg-surface-low self-center shrink-0" />
      </div>
    </div>
  )
}

// ── Branded SVG Fallback ─────────────────────────────────────────────
function BrandedPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-navy/5 to-navy/10 ${className}`}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <Wrench className="w-4 h-4 text-navy" />
        </div>
      </div>
    </div>
  )
}

function ProviderImage({ src, size }: { src: string | null, size: 'sm' | 'lg' | 'sm-featured' }) {
  const dims = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-24 h-24' : 'w-20 h-20'
  if (!src) return <BrandedPlaceholder className={`${dims} rounded-2xl`} />
  return (
    <img 
      src={src} 
      alt="" 
      className={`${dims} rounded-2xl object-cover border border-overlay shadow-sm bg-white`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none'
        // Fallback to placeholder on error
      }}
    />
  )
}
function MapChooser({ provider, onClose }: {
  provider: MechanicProvider
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
  provider: MechanicProvider
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

// ── Main component ────────────────────────────────────────────────────
export default function HumanMechanic() {
  const routeLocation = useLocation()
  const { user, updateProfile } = useAuth()
  const [rawProviders, setRawProviders] = useState<MechanicProvider[]>([])
  const [providers, setProviders] = useState<MechanicProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [hasInitializedCoords, setHasInitializedCoords] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [searchQuery, setSearchQuery] = useState(routeLocation.state?.initialSearch || '')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedProvider, setSelectedProvider] = useState<MechanicProvider | null>(null)
  const [mapChooserProvider, setMapChooserProvider] = useState<MechanicProvider | null>(null)
  const [contactChooserProvider, setContactChooserProvider] = useState<MechanicProvider | null>(null)
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  
  // ── Sync Coords from Metadata/Storage on Load ──────────────────
  useEffect(() => {
    if (user && !hasInitializedCoords) {
      const saved = getSavedUserLocation(user.user_metadata)
      if (saved) {
        setUserCoords({ lat: saved.lat, lng: saved.lng })
      }
      setHasInitializedCoords(true)
    }
  }, [user, hasInitializedCoords])
  
  const navigate = useNavigate()
  const { isAdvanced, isFree, loading: subLoading, isResolved } = useSubscription()

  // ── Stable Gating Logic ────────────────────────────────────────
  useEffect(() => {
    // 1. Wait until everything is resolved
    if (!isResolved || subLoading || loading || locating || !hasInitializedCoords) return

    // 2. High-priority override: if user HAS providers, bypass prompts entirely
    if (rawProviders.length > 0) {
      setShowLocationPrompt(false)
      setShowUpgradePrompt(false)
      return
    }

    const timer = setTimeout(() => {
      // 3. Strict Plan Gating: Advanced users NEVER see the prompt
      if (isAdvanced) {
        setShowUpgradePrompt(false)
      } else if (isFree) {
        setShowUpgradePrompt(true)
        return
      }

      // 4. Location Prompt for paid (but not assigned) users
      const hasValidLocation = (userCoords !== null) || 
                               (user?.user_metadata?.latitude && isLocationValid(user?.user_metadata?.location_timestamp))
      
      if (!hasValidLocation && !isFree) {
        setShowLocationPrompt(true)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [user, isAdvanced, isFree, isResolved, subLoading, loading, locating, rawProviders, userCoords, hasInitializedCoords])

  /** Fire-and-forget analytics event — never blocks UI */
  const trackEvent = (type: string, metadata?: object) => {
    if (!user) return
    ;(supabase as any).from('app_events').insert({ user_id: user.id, event_type: type, metadata: metadata ?? {} }).then()
  }

  // ── Step 1: Geo first ────────────────────────────────────────────
  useEffect(() => {
    // Only auto-locate if we don't already have coordinates
    if (userCoords) {
      setLocating(false)
      return
    }
    
    setLocating(true)
    const run = async () => {
      try {
        const pos = await getUserLocation()
        const now = Date.now()
        const { error } = await updateProfile({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_timestamp: now
        })
        if (error) console.error('Error updating location profile:', error)
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      } catch {
        setLocationDenied(true)
      } finally {
        setLocating(false)
      }
    }
    run()
  }, [])

  // ── Step 2: Fetch after geo resolves ─────────────────────────────
  useEffect(() => {
    if (locating) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('service_providers_raw')
          .select('*')
          .eq('assigned_user_id', user?.id || '')
        if (fetchError) throw fetchError
        if (!data || data.length === 0) { setLoading(false); return }

        const coords = userCoords
        const mapped: MechanicProvider[] = (data as any[])
          .filter(row => isMechanicCategory(row.Category))
          .filter(row => row.Business_name && row.Lat && row.Long)
          .map(row => {
            const lat = parseFloat(row.Lat)
            const lng = parseFloat(row.Long)
            const valid = !isNaN(lat) && !isNaN(lng)
            return {
              id: row.id,
              name: clean(row.Business_name) || 'Unknown Provider',
              address: clean(row.Address) || '',
              city: clean(row.City) || '',
              phone: clean(row.Phone),
              rating: row.Rating ? (Number(row.Rating) || 0) : 0,
              reviewCount: (row.Review || row.ReviewCount) ? (Number(row.Review || row.ReviewCount) || 0) : 0,
              imageUrl: clean(row.image1) || clean(row.ImageUrl),
              lat: valid ? lat : 0,
              lng: valid ? lng : 0,
              distance: (valid && coords) ? haversineDistance(coords.lat, coords.lng, lat, lng) : null,
              workingHours: clean(row.Working_hour) || clean(row.WorkingHours),
              website: clean(row.Website_url),
              mapLink: clean(row.MapLink),
              description: clean(row.BusinessDescription),
              category: clean(row.Category),
            }
          })

        const sorted = sortByDistance(mapped)
        setRawProviders(sorted)
        setProviders(sorted)
      } catch (err: any) {
        setError('Failed to load mechanic providers.')
      }
      setLoading(false)
    }
    load()
  }, [locating, userCoords])

  // ── Step 3: Re-sort if coords arrive late ─────────────────────────
  useEffect(() => {
    if (!userCoords || rawProviders.length === 0) return
    const resorted = rawProviders.map(p => ({
      ...p,
      distance: (p.lat !== 0 && p.lng !== 0) ? haversineDistance(userCoords.lat, userCoords.lng, p.lat, p.lng) : null,
    }))
    setProviders(sortByDistance(resorted))
  }, [userCoords])

  // ── Filter + sort ────────────────────────────────────────────────
  const filteredProviders = providers
    .filter(p => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (activeFilter === 'Nearest') {
        if (a.distance === null && b.distance === null) return 0
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      }
      if (activeFilter === 'Top Rated') return b.rating - a.rating
      return 0
    })

  const featured = filteredProviders[0] || null
  const rest = filteredProviders.slice(1)
  const isLoadingData = locating || loading

  return (
    <div className="min-h-full bg-[#f8f9fb]">

      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-overlay">
        <div className="max-w-2xl mx-auto px-5 py-4">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center shadow-lg shadow-navy/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black text-on-surface tracking-tight">Find a Mechanic</h1>
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
                {locating ? 'Getting your location…' : userCoords ? 'Sorted by nearest first' : 'Search by city'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search mechanics, garages, cities…"
              className="w-full bg-[#f3f4f6] border border-overlay rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-muted/60 focus:outline-none focus:border-navy/40 focus:bg-white transition-all"
            />
          </div>

          {/* Filter chips — refined active/inactive states */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(f => (
              <motion.button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                whileTap={{ scale: 0.96 }}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  activeFilter === f.key
                    ? 'bg-navy text-white border-navy shadow-md shadow-navy/25 ring-2 ring-navy/10'
                    : 'bg-white text-muted border-overlay hover:border-navy/30 hover:text-navy/70'
                }`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>

          {/* Notices */}
          {locationDenied && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <p className="text-[11px] font-bold text-amber-700">Location denied — search by city to find nearby mechanics.</p>
            </div>
          )}
          {locating && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" />
              <p className="text-[11px] font-bold text-blue-600">Detecting your location…</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 py-6 pb-32">
        {error && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl mb-5">
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        {isLoadingData ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : filteredProviders.length === 0 ? (
          <div className="space-y-6">
            {/* Inline 24h waiting state for when location is known but no providers assigned yet */}
            {userCoords ? (
              <ProviderWaitingState />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-low border border-overlay flex items-center justify-center mb-5">
                  <Wrench className="w-9 h-9 text-muted/30" />
                </div>
                <h3 className="text-base font-bold text-on-surface mb-1">No mechanics assigned yet</h3>
                <p className="text-sm text-muted max-w-[260px]">
                  Try a different city name or adjust filters.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Featured card ────────────────────────────────── */}
            {featured && (
              <motion.div 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mb-5 cursor-pointer outline-none"
                onClick={() => { setSelectedProvider(featured); trackEvent('mechanic_click', { name: featured.name, city: featured.city }) }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedProvider(featured); trackEvent('mechanic_click', { name: featured.name, city: featured.city }) } }}
                role="button"
                tabIndex={0}
              >
                <div className="w-full text-left relative overflow-hidden bg-gradient-to-br from-navy to-[#0F172A] text-white p-6 rounded-[28px] shadow-xl shadow-navy/15 group">
                  {/* Featured Header Row */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white">
                      <MapPin className="w-3 h-3" /> Nearest to you
                    </span>

                  </div>
                  <div className="flex items-start gap-4">
                    <ProviderImage src={featured.imageUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-bold truncate leading-tight mb-1">{featured.name}</h3>
                      <p className="text-[13px] text-white/60 truncate mb-2.5 leading-none">{featured.city}{featured.address ? ` · ${featured.address}` : ''}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {featured.distance !== null && (
                          <span className="flex items-center gap-1 text-[12px] font-bold text-sky-300">
                            <Navigation className="w-3 h-3" /> {formatDistance(featured.distance)}
                          </span>
                        )}
                        {featured.rating > 0 && (
                          <span className="flex items-center gap-1 text-[12px] font-bold text-yellow-300">
                            <Star className="w-3 h-3 fill-yellow-300" /> {(Number(featured.rating) || 0).toFixed(1)}
                            {featured.reviewCount > 0 && <span className="text-white/40">({featured.reviewCount})</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    {featured.phone && (
                      <button
                        onClick={e => { e.stopPropagation(); setContactChooserProvider(featured) }}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0070e0] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-[#0070e0]/90 active:scale-[0.98] transition-all"
                      >
                        <PhoneCall className="w-4 h-4" /> Call Now
                      </button>
                    )}
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
            <div className="flex items-center justify-between mt-4 mb-6">
              <p className="text-[11px] font-black text-muted uppercase tracking-widest">
                {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
              </p>
              {userCoords && activeFilter === 'Nearest' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/5 border border-navy/10 text-[9px] font-black text-navy/50 uppercase tracking-widest">
                  <Navigation className="w-2.5 h-2.5" /> Ordered by distance
                </div>
              )}
            </div>

            {/* ── Provider cards ───────────────────────────────── */}
            <div className="space-y-2.5">
              {rest.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                >
                  <button
                    onClick={() => { setSelectedProvider(p); trackEvent('mechanic_click', { name: p.name, city: p.city }) }}
                    className="w-full text-left p-4 rounded-2xl bg-white border border-overlay hover:border-[#0070e0]/30 hover:shadow-xl hover:shadow-navy/5 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <ProviderImage src={p.imageUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-on-surface truncate leading-tight group-hover:text-navy transition-colors mb-0.5">{p.name}</h3>
                        <p className="text-[12px] text-muted truncate leading-none mb-2">{p.city}{p.address ? ` · ${p.address}` : ''}</p>
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

                      {/* Premium Action Affordance */}
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

      {/* ── Provider detail sheet ──────────────────────────────── */}
      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
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

                {/* Provider header with improved spacing */}
                <div className="flex items-start gap-5 mb-8">
                  <ProviderImage src={selectedProvider.imageUrl} size="lg" />
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-2xl font-display font-black text-on-surface tracking-tight leading-none mb-2">{selectedProvider.name}</h2>
                    <p className="text-[14px] text-muted font-medium leading-relaxed">{selectedProvider.city}{selectedProvider.address ? ` · ${selectedProvider.address}` : ''}</p>
                    {selectedProvider.category && (
                      <span className="inline-flex mt-3 text-[10px] font-black uppercase tracking-widest bg-navy/5 text-navy/60 border border-navy/10 px-3 py-1.5 rounded-xl">{selectedProvider.category}</span>
                    )}
                  </div>
                </div>

                {/* Refined Stats Grid */}
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

                {/* Description - Apple Maps Style Card */}
                <div className="mb-8 p-5 bg-[#f8f9fa] border border-overlay rounded-3xl">
                  <p className="text-[13px] font-medium text-on-surface/70 leading-relaxed">
                    {selectedProvider.description || trustFallback(selectedProvider.id)}
                  </p>
                </div>

                {/* CTA buttons - Premium Visual Excellence */}
                <div className="space-y-3.5">
                  {selectedProvider.phone && (
                    <>
                      <a
                        href={`tel:${selectedProvider.phone}`}
                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[22px] bg-gradient-to-b from-[#0070e0] to-[#005bb5] text-white text-[13px] font-black uppercase tracking-[0.05em] shadow-[0_20px_40px_-15px_rgba(0,112,224,0.3)] border border-white/10 hover:brightness-110 active:scale-[0.97] transition-all"
                      >
                        <PhoneCall className="w-5 h-5 shadow-sm" /> Call Now
                      </a>
                      <a
                        href={`https://wa.me/${selectedProvider.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-3 py-5 rounded-[22px] bg-gradient-to-b from-[#10b981] to-[#059669] text-white text-[13px] font-black uppercase tracking-[0.05em] shadow-[0_20px_40px_-15px_rgba(16,185,129,0.25)] border border-white/10 hover:brightness-110 active:scale-[0.97] transition-all"
                      >
                        <MessageCircle className="w-5 h-5 shadow-sm" /> WhatsApp Business
                      </a>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Chooser Sheets */}
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
        onClose={() => setShowLocationPrompt(false)} 
      />

      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={() => {
          setShowUpgradePrompt(false)
          if (isFree) navigate('/dashboard')
        }}
      />
    </div>
  )
}
