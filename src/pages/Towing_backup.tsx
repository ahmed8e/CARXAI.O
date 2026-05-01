import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserLocation, haversineDistance, formatDistance } from '../lib/utils'
import {
  Truck, MapPin, Star, Navigation, Search,
  AlertTriangle, PhoneCall, X, ChevronRight, MessageCircle, Copy
} from 'lucide-react'

// â”€â”€ Towing-related category keywords â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TOWING_CATEGORIES = [
  'remorquage', 'towing', 'transporteur de vÃ©hicules',
  'vehicle transport', 'dÃ©pannage', 'roadside', 'depannage',
]

function isTowingCategory(cat: string | null): boolean {
  if (!cat) return false
  const lower = cat.toLowerCase()
  return TOWING_CATEGORIES.some(kw => lower.includes(kw))
}

// â”€â”€ Branded fallback trust messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TRUST_MESSAGES = [
  'Verified provider in the Carsafety assistance network.',
  'Trusted nearby roadside assistance, available now.',
  'Reliable local automotive support through Carsafety.',
  'Nearby verified help when you need it most.',
  'Available through the Carsafety assistance network.',
]

/** Strip literal "null" / "undefined" strings from Supabase data */
function clean(val: string | null | undefined): string | null {
  if (!val || val === 'null' || val === 'undefined' || val.trim() === '') return null
  return val.trim()
}

function trustFallback(id: number): string {
  return TRUST_MESSAGES[id % TRUST_MESSAGES.length]
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// â”€â”€ Build map app links for a destination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getMapLinks(lat: number, lng: number, label: string, userLat?: number, userLng?: number) {
  const encodedLabel = encodeURIComponent(label)
  const origin = userLat != null && userLng != null
    ? `saddr=${userLat},${userLng}&`
    : ''

  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&${origin}destination=${lat},${lng}`,
    googleMapsApp: `comgooglemaps://?${origin}daddr=${lat},${lng}&directionsmode=driving`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    wazeApp: `waze://?ll=${lat},${lng}&navigate=yes`,
    appleMaps: `maps://?q=${encodedLabel}&ll=${lat},${lng}${userLat != null ? `&saddr=${userLat},${userLng}` : ''}`,
    appleMapsWeb: `https://maps.apple.com/?q=${encodedLabel}&ll=${lat},${lng}`,
  }
}

// â”€â”€ Provider type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface TowingProvider {
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

// â”€â”€ Sort providers by distance ascending â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function sortByDistance(list: TowingProvider[]): TowingProvider[] {
  return [...list].sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0
    if (a.distance === null) return 1
    if (b.distance === null) return -1
    return a.distance - b.distance
  })
}

// â”€â”€ Branded SVG Fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-navy/30">Carsafety</p>
      </div>
    </div>
  )
}

// â”€â”€ ImageWithFallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// ── Skeleton ─────────────────────────────────────────────────────────────────
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

// ── MapChooser sheet ─────────────────────────────────────────────────────────
function MapChooser({ provider, onClose }: {
  provider: TowingProvider
  onClose: () => void
}) {
  const ios = isIOS()
  const links = getMapLinks(provider.lat, provider.lng, provider.name)
  
  const options = [
    { label: 'Google Maps', scheme: links.googleMapsApp, web: links.googleMaps, color: 'bg-blue-600' },
    { label: 'Waze', scheme: links.wazeApp, web: links.waze, color: 'bg-[#00D4B5]' },
    ...(ios ? [{ label: 'Apple Maps', scheme: links.appleMaps, web: links.appleMapsWeb, color: 'bg-slate-900' }] : []),
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-sm bg-white rounded-[32px] overflow-hidden shadow-2xl p-2 mb-safe"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 opacity-50" />
          <h3 className="text-xl font-display font-black text-on-surface text-center mb-2">Navigation</h3>
          <p className="text-[13px] text-muted text-center mb-8">Choose your preferred map app</p>
          
          <div className="space-y-3">
            {options.map(opt => (
              <button
                key={opt.label}
                onClick={() => handleOpen(opt.scheme, opt.web)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-overlay text-on-surface group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center text-white shadow-lg`}>
                    <Navigation className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-[15px]">{opt.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-40" />
              </button>
            ))}

            <button
              onClick={() => {
                const addr = `${provider.address || ''} ${provider.city || ''}`.trim();
                navigator.clipboard.writeText(addr);
                onClose();
              }}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-overlay text-on-surface group transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-on-surface/60">
                  <Copy className="w-5 h-5" />
                </div>
                <span className="font-bold text-[15px]">Copy Address</span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-40" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-4 text-sm font-bold text-muted uppercase tracking-widest hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


// â”€â”€ ContactChooser sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ContactChooser({ provider, onClose }: {
  provider: TowingProvider
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl p-2 mb-safe"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 opacity-50" />
          <h3 className="text-xl font-display font-black text-on-surface text-center mb-2">Contact Provider</h3>
          <p className="text-[13px] text-muted text-center mb-8">How would you like to get in touch?</p>
          
          <div className="space-y-3">
            <a
              href={`tel:${provider.phone}`}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-[#0070e0]/5 border border-[#0070e0]/10 text-[#0070e0] group transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0070e0] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <span className="font-bold text-[15px]">Call Now</span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-40" />
            </a>

            <a
              href={`https://wa.me/${provider.phone?.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 group transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="font-bold text-[15px]">WhatsApp Business</span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-40" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-4 text-sm font-bold text-muted uppercase tracking-widest hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Towing() {
  const { user } = useAuth()
  const [rawProviders, setRawProviders] = useState<TowingProvider[]>([])
  const [providers, setProviders] = useState<TowingProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<TowingProvider | null>(null)
  const [mapChooserProvider, setMapChooserProvider] = useState<TowingProvider | null>(null)
  const [contactChooserProvider, setContactChooserProvider] = useState<TowingProvider | null>(null)

  // â”€â”€ Step 1: Get location first â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    setLocating(true)
    getUserLocation()
      .then(pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
      .catch(() => {
        setLocationDenied(true)
      })
      .finally(() => {
        setLocating(false)
      })
  }, [])

  // â”€â”€ Step 2: Fetch providers once location resolves â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (locating) return // Wait for location attempt to complete

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('service_providers_raw')
          .select('*')

        if (fetchError) throw fetchError
        if (!data || data.length === 0) {
          setRawProviders([])
          setProviders([])
          setLoading(false)
          return
        }

        const coords = userCoords // captured at time of fetch

        const mapped: TowingProvider[] = (data as any[])
          .filter(row => isTowingCategory(row.Category))
          .filter(row => row.Business_name && row.Lat && row.Long)
          .map(row => {
            const lat = parseFloat(row.Lat)
            const lng = parseFloat(row.Long)
            const validCoords = !isNaN(lat) && !isNaN(lng)

            return {
              id: row.id,
              name: row.Business_name || 'Unknown Provider',
              address: row.Address || '',
              city: row.City || '',
              phone: row.Phone || null,
              rating: row.Rating ? parseFloat(row.Rating) : 0,
              reviewCount: row.Review ? parseInt(row.Review, 10) : 0,
              imageUrl: row.image1 || null,
              lat: validCoords ? lat : 0,
              lng: validCoords ? lng : 0,
              distance: (validCoords && coords)
                ? haversineDistance(coords.lat, coords.lng, lat, lng)
                : null,
              workingHours: clean(row.Working_hour),
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
        console.error('[Towing] Fetch error:', err)
        setError('Failed to load towing providers. Please try again.')
      }

      setLoading(false)
    }

    load()
  }, [locating, userCoords])

  // â”€â”€ Step 3: If location comes in AFTER data, re-sort â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!userCoords || rawProviders.length === 0) return

    const resorted = rawProviders.map(p => ({
      ...p,
      distance: (p.lat !== 0 && p.lng !== 0)
        ? haversineDistance(userCoords.lat, userCoords.lng, p.lat, p.lng)
        : null,
    }))

    setProviders(sortByDistance(resorted))
  }, [userCoords])


  /** Fire-and-forget analytics event â€” never blocks UI */
  const trackEvent = (type: string, metadata?: object) => {
    if (!user) return
    ;(supabase as any).from('app_events').insert({ user_id: user.id, event_type: type, metadata: metadata ?? {} }).then()
  }

  // â”€â”€ Filter (city search) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredProviders = citySearch.trim()
    ? providers.filter(p =>
        p.city.toLowerCase().includes(citySearch.toLowerCase()) ||
        p.name.toLowerCase().includes(citySearch.toLowerCase()) ||
        p.address.toLowerCase().includes(citySearch.toLowerCase())
      )
    : providers

  const featured = filteredProviders[0] || null
  const rest = filteredProviders.slice(1)

  const isLoadingData = locating || loading

  return (
    <div className="min-h-full bg-[#f8f9fb]">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-overlay">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black text-on-surface tracking-tight">Emergency Towing</h1>
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
                {locating ? 'Getting your location...' : userCoords ? 'Sorted by nearest first' : 'Search by city'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              placeholder={locationDenied ? 'Search by city name...' : 'Filter towing providers...'}
              className="w-full bg-[#f3f4f6] border border-overlay rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-on-surface placeholder:text-muted/60 focus:outline-none focus:border-navy/40 focus:bg-white transition-all"
            />
          </div>

          {locationDenied && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <p className="text-[11px] font-bold text-amber-700">Location access denied â€” showing all providers. Search by city above.</p>
            </div>
          )}

          {locating && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" />
              <p className="text-[11px] font-bold text-blue-600">Detecting your locationâ€¦</p>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-2xl mx-auto px-5 py-6 pb-32">
        {error && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl mb-5">
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        {isLoadingData ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-surface-low border border-overlay flex items-center justify-center mb-5">
              <Truck className="w-9 h-9 text-muted/30" />
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1">No towing providers found</h3>
            <p className="text-sm text-muted max-w-[260px]">Try adjusting your search or broadening the area.</p>
          </div>
        ) : (
          <>
            {/* â”€â”€ Featured Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5"
              >
                <button
                  onClick={() => { setSelectedProvider(featured); trackEvent('towing_click', { name: featured.name, city: featured.city }) }}
                  className="w-full text-left relative overflow-hidden bg-gradient-to-br from-navy to-[#0F172A] text-white p-6 rounded-[28px] shadow-xl shadow-navy/15"
                >
                  {/* Featured Header Row */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white">
                      <MapPin className="w-3 h-3" /> Nearest to you
                    </span>
                    <div className="h-px flex-1 bg-white/10 ml-4 max-w-[40px]" />
                  </div>
                  <div className="flex items-start gap-4">
                    <ProviderImage src={featured.imageUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-bold truncate leading-tight mb-1">{featured.name}</h3>
                      <p className="text-[13px] text-white/60 truncate mb-2.5 leading-none">{featured.city}{featured.address ? ` Â· ${featured.address}` : ''}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {featured.distance !== null && (
                          <span className="flex items-center gap-1 text-[12px] font-bold text-orange-300">
                            <Navigation className="w-3 h-3" /> {formatDistance(featured.distance)}
                          </span>
                        )}
                        {featured.rating > 0 && (
                          <span className="flex items-center gap-1 text-[12px] font-bold text-yellow-300">
                            <Star className="w-3 h-3 fill-yellow-300" /> {featured.rating.toFixed(1)}
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
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#0070e0] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#0070e0]/90 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
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
                </button>
              </motion.div>
            )}

            {/* â”€â”€ Count row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex items-center justify-between mt-4 mb-6">
              <p className="text-[11px] font-black text-muted uppercase tracking-widest">
                {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
              </p>
              {userCoords && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/5 border border-navy/10 text-[9px] font-black text-navy/50 uppercase tracking-widest">
                  <Navigation className="w-2.5 h-2.5" /> Nearest to you
                </div>
              )}
            </div>

            {/* â”€â”€ Provider list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="space-y-2.5">
              {rest.map((p, i) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { setSelectedProvider(p); trackEvent('towing_click', { name: p.name, city: p.city }) }}
                    className="w-full text-left p-4 rounded-2xl bg-white border border-overlay hover:border-[#0070e0]/30 hover:shadow-xl hover:shadow-navy/5 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <ProviderImage src={p.imageUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-on-surface truncate leading-tight group-hover:text-navy transition-colors mb-0.5">{p.name}</h3>
                        <p className="text-[12px] text-muted truncate leading-none mb-2">{p.city}{p.address ? ` Â· ${p.address}` : ''}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {p.distance !== null && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-navy/70 bg-navy/[0.03] px-1.5 py-0.5 rounded-md">
                              <Navigation className="w-2.5 h-2.5" /> {formatDistance(p.distance)}
                            </span>
                          )}
                          {p.rating > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-on-surface/60">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {p.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Premium Action Affordance */}
                      <div className="w-10 h-10 rounded-full bg-[#0070e0]/5 flex items-center justify-center text-[#0070e0] group-hover:bg-[#0070e0] group-hover:text-white transition-all duration-300 shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* â”€â”€ Provider detail overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedProvider(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-[32px] shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-10 h-1.5 rounded-full bg-overlay" />
              </div>

              <div className="px-6 pb-8">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedProvider(null)}
                    className="w-9 h-9 rounded-full bg-surface-low flex items-center justify-center text-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Provider header with improved spacing */}
                <div className="flex items-start gap-5 mb-8">
                  <ProviderImage src={selectedProvider.imageUrl} size="lg" />
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-2xl font-display font-black text-on-surface tracking-tight leading-none mb-2">{selectedProvider.name}</h2>
                    <p className="text-[14px] text-muted font-medium leading-relaxed">{selectedProvider.city}{selectedProvider.address ? ` Â· ${selectedProvider.address}` : ''}</p>
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
                      <p className="text-base font-bold text-on-surface">{formatDistance(selectedProvider.distance)}</p>
                    </div>
                  )}
                  {selectedProvider.rating > 0 && (
                    <div className="bg-[#f3f4f6] border border-overlay p-3.5 rounded-2xl text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">Rating</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-base font-bold text-on-surface">{selectedProvider.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {selectedProvider.reviewCount > 0 && (
                    <div className="bg-[#f3f4f6] border border-overlay p-3.5 rounded-2xl text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-1">Reviews</p>
                      <p className="text-base font-bold text-on-surface">{selectedProvider.reviewCount}</p>
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

      {/* â”€â”€ Map app chooser â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Action Choice Sheets */}
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

