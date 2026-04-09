import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserLocation, haversineDistance, formatDistance } from '../lib/utils'
import {
  Truck, MapPin, Star, Phone, Navigation, Search,
  ShieldCheck, Clock, AlertTriangle, PhoneCall, ExternalLink, X, Map
} from 'lucide-react'

// ── Towing-related category keywords ─────────────────────────────────
const TOWING_CATEGORIES = [
  'remorquage', 'towing', 'transporteur de véhicules',
  'vehicle transport', 'dépannage', 'roadside', 'depannage',
]

function isTowingCategory(cat: string | null): boolean {
  if (!cat) return false
  const lower = cat.toLowerCase()
  return TOWING_CATEGORIES.some(kw => lower.includes(kw))
}

// ── Branded fallback trust messages ─────────────────────────────────
const TRUST_MESSAGES = [
  'Verified provider in the Carxai assistance network.',
  'Trusted nearby roadside assistance, available now.',
  'Reliable local automotive support through Carxai.',
  'Nearby verified help when you need it most.',
  'Available through the Carxai assistance network.',
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

// ── Build map app links for a destination ─────────────────────────────
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

// ── Provider type ─────────────────────────────────────────────────────
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

// ── Sort providers by distance ascending ─────────────────────────────
function sortByDistance(list: TowingProvider[]): TowingProvider[] {
  return [...list].sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0
    if (a.distance === null) return 1
    if (b.distance === null) return -1
    return a.distance - b.distance
  })
}

// ── Skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl border border-overlay bg-white animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-low shrink-0" />
        <div className="flex-1 space-y-2.5 py-1">
          <div className="h-4 bg-surface-low rounded-lg w-3/4" />
          <div className="h-3 bg-surface-low rounded-lg w-1/2" />
          <div className="h-3 bg-surface-low rounded-lg w-1/3" />
        </div>
      </div>
    </div>
  )
}

// ── MapChooser sheet ──────────────────────────────────────────────────
interface MapChooserProps {
  provider: TowingProvider
  userCoords: { lat: number; lng: number } | null
  onClose: () => void
}

function MapChooser({ provider, userCoords, onClose }: MapChooserProps) {
  const links = getMapLinks(
    provider.lat, provider.lng, provider.name,
    userCoords?.lat, userCoords?.lng
  )
  const ios = isIOS()

  const options: { label: string; icon: string; primary: string; fallback: string; color: string }[] = [
    {
      label: 'Google Maps',
      icon: '🗺️',
      primary: links.googleMapsApp,
      fallback: links.googleMaps,
      color: 'from-[#4285F4] to-[#2563EB]',
    },
    {
      label: 'Waze',
      icon: '🚗',
      primary: links.wazeApp,
      fallback: links.waze,
      color: 'from-[#09D3AC] to-[#05A584]',
    },
    ...(ios ? [{
      label: 'Apple Maps',
      icon: '🍎',
      primary: links.appleMaps,
      fallback: links.appleMapsWeb,
      color: 'from-slate-600 to-slate-800',
    }] : []),
  ]

  const handleOpen = (primary: string, fallback: string) => {
    // Try opening the app URI; after a short timeout fall back to browser
    const start = Date.now()
    window.location.href = primary
    setTimeout(() => {
      // If still on page (app didn't open), open web fallback
      if (Date.now() - start < 2000) {
        window.open(fallback, '_blank', 'noreferrer')
      }
    }, 1500)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-[32px] shadow-2xl pb-8"
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-5">
          <div className="w-10 h-1.5 rounded-full bg-overlay" />
        </div>

        {/* Header */}
        <div className="px-6 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Navigate to</p>
              <h3 className="text-lg font-display font-black text-on-surface tracking-tight leading-tight">{provider.name}</h3>
              {provider.city && <p className="text-[13px] text-muted mt-0.5">{provider.city}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-low flex items-center justify-center text-muted hover:text-on-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map options */}
        <div className="px-5 space-y-2.5">
          {options.map(opt => (
            <motion.button
              key={opt.label}
              onClick={() => handleOpen(opt.primary, opt.fallback)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${opt.color} text-white shadow-lg hover:shadow-xl hover:-translate-y-[1px] transition-all`}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl w-10 text-center">{opt.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-bold text-[15px]">{opt.label}</p>
                <p className="text-[11px] text-white/70">Open in {opt.label}</p>
              </div>
              <Navigation className="w-5 h-5 text-white/50" />
            </motion.button>
          ))}
        </div>

        {/* Web fallback note */}
        <p className="text-center text-[10px] font-bold text-muted uppercase tracking-widest mt-5 px-6">
          Will open app if installed, otherwise opens in browser
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────
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
  const [requested, setRequested] = useState<number | null>(null)

  // ── Step 1: Get location first ──────────────────────────────────
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

  // ── Step 2: Fetch providers once location resolves ──────────────
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

  // ── Step 3: If location comes in AFTER data, re-sort ───────────
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

  // ── Handle request ──────────────────────────────────────────────
  const handleRequest = async (provider: TowingProvider) => {
    setRequested(provider.id)
    if (user) {
      await (supabase as any).from('towing_requests').insert({
        user_id: user.id,
        provider_name: provider.name,
        status: 'requested',
      })
    }
  }

  /** Fire-and-forget analytics event — never blocks UI */
  const trackEvent = (type: string, metadata?: object) => {
    if (!user) return
    ;(supabase as any).from('app_events').insert({ user_id: user.id, event_type: type, metadata: metadata ?? {} }).then()
  }

  // ── Filter (city search) ────────────────────────────────────────
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
      {/* ── Header ────────────────────────────────────────────────── */}
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
              <p className="text-[11px] font-bold text-amber-700">Location access denied — showing all providers. Search by city above.</p>
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
            {/* ── Featured Card ────────────────────────────────── */}
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
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white/90">
                      <MapPin className="w-3 h-3" /> Nearest to you
                    </span>
                  </div>
                  <div className="flex items-start gap-4 mt-2">
                    {featured.imageUrl ? (
                      <img src={featured.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                        <Truck className="w-7 h-7 text-white/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-bold truncate leading-tight mb-1">{featured.name}</h3>
                      <p className="text-[13px] text-white/60 truncate mb-2">{featured.city}{featured.address ? ` · ${featured.address}` : ''}</p>
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
                      <a
                        href={`tel:${featured.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-orange-400 transition-all"
                      >
                        <PhoneCall className="w-4 h-4" /> Call Now
                      </a>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setMapChooserProvider(featured) }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 border border-white/10 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                    >
                      <Navigation className="w-4 h-4" /> Directions
                    </button>
                  </div>
                </button>
              </motion.div>
            )}

            {/* ── Count row ────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
                {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
              </p>
              {userCoords && (
                <p className="text-[10px] font-bold text-navy/50 uppercase tracking-widest">Sorted by distance</p>
              )}
            </div>

            {/* ── Provider list ────────────────────────────────── */}
            <div className="space-y-2.5">
              {rest.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { setSelectedProvider(p); trackEvent('towing_click', { name: p.name, city: p.city }) }}
                  className="w-full text-left p-4 rounded-2xl bg-white border border-overlay hover:border-navy/20 hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-overlay shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-surface-low border border-overlay flex items-center justify-center shrink-0">
                        <Truck className="w-6 h-6 text-muted/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-on-surface truncate leading-tight group-hover:text-navy transition-colors">{p.name}</h3>
                      <p className="text-[12px] text-muted truncate mt-0.5">{p.city}{p.address ? ` · ${p.address}` : ''}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {p.distance !== null && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-navy/70">
                            <MapPin className="w-3 h-3" /> {formatDistance(p.distance)}
                          </span>
                        )}
                        {p.rating > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-on-surface/60">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {p.rating.toFixed(1)}
                          </span>
                        )}
                        {p.workingHours && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted/60">
                            <Clock className="w-3 h-3" /> {p.workingHours}
                          </span>
                        )}
                      </div>
                    </div>
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="w-11 h-11 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-all self-center shrink-0"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {requested === p.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Request sent
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Provider detail overlay ────────────────────────────── */}
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

                <div className="flex items-start gap-4 mb-6">
                  {selectedProvider.imageUrl ? (
                    <img src={selectedProvider.imageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border border-overlay" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-surface-low border border-overlay flex items-center justify-center">
                      <Truck className="w-8 h-8 text-muted/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-display font-black text-on-surface tracking-tight mb-1">{selectedProvider.name}</h2>
                    <p className="text-[13px] text-muted truncate">{selectedProvider.city}{selectedProvider.address ? ` · ${selectedProvider.address}` : ''}</p>
                    {selectedProvider.category && (
                      <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-widest bg-navy/5 text-navy/70 border border-navy/10 px-2.5 py-1 rounded-lg">{selectedProvider.category}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
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

                {selectedProvider.workingHours && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#f3f4f6] rounded-xl border border-overlay mb-6">
                    <Clock className="w-4 h-4 text-muted shrink-0" />
                    <p className="text-[12px] font-medium text-on-surface/80">{selectedProvider.workingHours}</p>
                  </div>
                )}

                {/* Description or branded fallback */}
                <div className="mb-6 px-4 py-3.5 bg-gradient-to-r from-navy/[0.04] to-transparent border border-navy/10 rounded-2xl">
                  <p className="text-[12px] font-medium text-on-surface/70 leading-relaxed">
                    {selectedProvider.description || trustFallback(selectedProvider.id)}
                  </p>
                </div>

                <div className="flex gap-2.5">
                  {selectedProvider.phone && (
                    <a
                      href={`tel:${selectedProvider.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-navy to-[#0F172A] text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-navy/20 hover:-translate-y-[1px] transition-all"
                    >
                      <PhoneCall className="w-4 h-4" /> Call Now
                    </a>
                  )}
                  <button
                    onClick={() => { setSelectedProvider(null); setMapChooserProvider(selectedProvider) }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-surface-low border border-overlay text-navy text-[11px] font-bold uppercase tracking-widest hover:bg-navy/5 transition-all"
                  >
                    <Map className="w-4 h-4" /> Directions
                  </button>
                </div>

                <motion.button
                  onClick={() => handleRequest(selectedProvider)}
                  disabled={requested === selectedProvider.id}
                  className={`w-full mt-3 flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                    requested === selectedProvider.id
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 hover:-translate-y-[1px]'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {requested === selectedProvider.id
                    ? <><ShieldCheck className="w-4 h-4" /> Towing Requested</>
                    : <><Truck className="w-4 h-4" /> Request Towing</>
                  }
                </motion.button>

                {selectedProvider.website && (
                  <a
                    href={selectedProvider.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[11px] font-bold text-muted hover:text-navy transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Visit Website
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map app chooser ────────────────────────────────────── */}
      <AnimatePresence>
        {mapChooserProvider && (
          <MapChooser
            provider={mapChooserProvider}
            userCoords={userCoords}
            onClose={() => setMapChooserProvider(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
