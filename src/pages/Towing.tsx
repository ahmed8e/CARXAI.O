import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserLocation, haversineDistance, formatDistance } from '../lib/utils'
import {
  Truck, MapPin, Star, Phone, Navigation, Search,
  ShieldCheck, Clock, AlertTriangle, PhoneCall, ExternalLink, X
} from 'lucide-react'

// ── Towing-related category keywords ─────────────────────────────────
const TOWING_CATEGORIES = [
  'remorquage',
  'towing',
  'transporteur de véhicules',
  'vehicle transport',
  'dépannage',
  'roadside',
]

function isTowingCategory(cat: string | null): boolean {
  if (!cat) return false
  const lower = cat.toLowerCase()
  return TOWING_CATEGORIES.some(kw => lower.includes(kw))
}

// ── Provider type after processing ───────────────────────────────────
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
  distance: number | null       // meters, null if no user location
  workingHours: string | null
  website: string | null
  mapLink: string | null
  description: string | null
  category: string | null
}

// ── Skeleton loader ──────────────────────────────────────────────────
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

export default function Towing() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<TowingProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<TowingProvider | null>(null)
  const [requested, setRequested] = useState<number | null>(null)

  // ── Fetch providers from Supabase ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      // 1. Try to get user location
      let coords: { lat: number; lng: number } | null = null
      try {
        const pos = await getUserLocation()
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserCoords(coords)
      } catch {
        setLocationDenied(true)
      }

      // 2. Fetch towing providers from Supabase
      try {
        const { data, error: fetchError } = await supabase
          .from('service_providers_raw')
          .select('*')

        if (fetchError) throw fetchError
        if (!data || data.length === 0) {
          setProviders([])
          setLoading(false)
          return
        }

        // 3. Filter to towing categories & parse
        const mapped: TowingProvider[] = (data as any[])
          .filter(row => isTowingCategory(row.Category))
          .filter(row => row.Lat && row.Long && row.Business_name)
          .map(row => {
            const lat = parseFloat(row.Lat!)
            const lng = parseFloat(row.Long!)
            const dist = coords && !isNaN(lat) && !isNaN(lng)
              ? haversineDistance(coords.lat, coords.lng, lat, lng)
              : null

            return {
              id: row.id,
              name: row.Business_name || 'Unknown Provider',
              address: row.Address || '',
              city: row.City || '',
              phone: row.Phone || null,
              rating: row.Rating ? parseFloat(row.Rating) : 0,
              reviewCount: row.Review ? parseInt(row.Review, 10) : 0,
              imageUrl: row.image1 || null,
              lat,
              lng,
              distance: isNaN(lat) || isNaN(lng) ? null : dist,
              workingHours: row.Working_hour || null,
              website: row.Website_url || null,
              mapLink: row.MapLink || null,
              description: row.BusinessDescription || null,
              category: row.Category || null,
            }
          })

        // 4. Sort by distance ascending (null distances go last)
        mapped.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0
          if (a.distance === null) return 1
          if (b.distance === null) return -1
          return a.distance - b.distance
        })

        setProviders(mapped)
      } catch (err: any) {
        console.error('[Towing] Fetch error:', err)
        setError('Failed to load towing providers. Please try again.')
      }

      setLoading(false)
    }

    load()
  }, [])

  // ── Handle towing request ────────────────────────────────────────
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

  // ── City filter ──────────────────────────────────────────────────
  const filteredProviders = citySearch.trim()
    ? providers.filter(p =>
        p.city.toLowerCase().includes(citySearch.toLowerCase()) ||
        p.name.toLowerCase().includes(citySearch.toLowerCase()) ||
        p.address.toLowerCase().includes(citySearch.toLowerCase())
      )
    : providers

  const featured = filteredProviders[0] || null
  const rest = filteredProviders.slice(1)

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
                {userCoords ? 'Nearest help first' : 'Search by city'}
              </p>
            </div>
          </div>

          {/* Search / city fallback */}
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
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 py-6 pb-32">
        {error && (
          <div className="p-5 bg-red-50 border border-red-100 rounded-2xl mb-5">
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
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
                  onClick={() => setSelectedProvider(featured)}
                  className="w-full text-left relative overflow-hidden bg-gradient-to-br from-navy to-[#0F172A] text-white p-6 rounded-[28px] shadow-xl shadow-navy/15 group"
                >
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-white/90">
                      <MapPin className="w-3 h-3" /> Nearest to you
                    </span>
                  </div>
                  <div className="flex items-start gap-4 mt-2">
                    {featured.imageUrl ? (
                      <img src={featured.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shrink-0" />
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
                    <a
                      href={featured.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${featured.lat},${featured.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 border border-white/10 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                    >
                      <Navigation className="w-4 h-4" /> Directions
                    </a>
                  </div>
                </button>
              </motion.div>
            )}

            {/* ── Results count ────────────────────────────────── */}
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
                  onClick={() => setSelectedProvider(p)}
                  className="w-full text-left p-4 rounded-2xl bg-white border border-overlay hover:border-navy/20 hover:shadow-md transition-all group"
                >
                  <div className="flex gap-4">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-overlay shrink-0" />
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

      {/* ── Detail overlay ────────────────────────────────────── */}
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
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-10 h-1.5 rounded-full bg-overlay" />
              </div>

              <div className="px-6 pb-8">
                {/* Close */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setSelectedProvider(null)}
                    className="w-9 h-9 rounded-full bg-surface-low flex items-center justify-center text-muted hover:text-on-surface transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Provider header */}
                <div className="flex items-start gap-4 mb-6">
                  {selectedProvider.imageUrl ? (
                    <img src={selectedProvider.imageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border border-overlay" />
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

                {/* Stats grid */}
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

                {/* Working hours */}
                {selectedProvider.workingHours && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#f3f4f6] rounded-xl border border-overlay mb-6">
                    <Clock className="w-4 h-4 text-muted shrink-0" />
                    <p className="text-[12px] font-medium text-on-surface/80">{selectedProvider.workingHours}</p>
                  </div>
                )}

                {/* Description */}
                {selectedProvider.description && (
                  <p className="text-sm text-muted leading-relaxed mb-6">{selectedProvider.description}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2.5">
                  {selectedProvider.phone && (
                    <a
                      href={`tel:${selectedProvider.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-navy to-[#0F172A] text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-navy/20 hover:shadow-xl hover:-translate-y-[1px] transition-all"
                    >
                      <PhoneCall className="w-4 h-4" /> Call Now
                    </a>
                  )}
                  <a
                    href={selectedProvider.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${selectedProvider.lat},${selectedProvider.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-surface-low border border-overlay text-navy text-[11px] font-bold uppercase tracking-widest hover:bg-navy/5 transition-all"
                  >
                    <Navigation className="w-4 h-4" /> Directions
                  </a>
                </div>

                {/* Request towing */}
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
                  {requested === selectedProvider.id ? (
                    <><ShieldCheck className="w-4 h-4" /> Towing Requested</>
                  ) : (
                    <><Truck className="w-4 h-4" /> Request Towing</>
                  )}
                </motion.button>

                {/* Website link */}
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
    </div>
  )
}
