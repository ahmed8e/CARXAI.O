import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getUserLocation, formatDistance, formatRating } from '../lib/utils'
import { loadGoogleMaps, GOOGLE_MAPS_STYLE } from '../lib/maps'
import type { NearbyPlace } from '../lib/types'
import { Users, MapPin, Star, Phone, Navigation, Search, Loader2, X } from 'lucide-react'

const FILTERS = ['All', 'Open Now', 'Closest', 'Top Rated', 'Garage', 'Mechanic']

export default function HumanMechanic() {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [selected, setSelected] = useState<NearbyPlace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])


  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey || apiKey === 'placeholder_google_maps_key') {
      setLoading(false)
      setError('Google Maps API key is missing.')
      return
    }

    const load = async () => {
      try {
        let location = { lat: 48.8566, lng: 2.3522 }; // Default: Paris
        
        try {
          const pos = await getUserLocation();
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (geoError) {
          console.warn('[Mechanic Map] Geolocation failed. Using fallback location.', geoError);
        }

        if (!window.google) {
          await loadGoogleMaps(apiKey)
        }

        const map = new google.maps.Map(mapRef.current!, {
          center: location, zoom: 12,
          styles: GOOGLE_MAPS_STYLE,
          disableDefaultUI: true, zoomControl: true,
        })
        mapInstanceRef.current = map

        new google.maps.Marker({
          position: location, map,
          icon: { 
            path: google.maps.SymbolPath.CIRCLE, 
            scale: 10, 
            fillColor: '#0070E0', 
            fillOpacity: 1, 
            strokeColor: '#FFFFFF', 
            strokeWeight: 3 
          },
          title: 'Your Location',
          zIndex: 100
        })

        const service = new google.maps.places.PlacesService(map)
        service.nearbySearch({ 
          location, 
          radius: 15000, 
          keyword: 'mechanic garage car repair auto repair mécanicien garage' 
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const mapped: NearbyPlace[] = results.map(p => ({
              id: p.place_id!, name: p.name!, address: p.vicinity ?? '',
              rating: p.rating ?? 0, userRatingsTotal: p.user_ratings_total ?? 0,
              isOpen: p.opening_hours?.isOpen() ?? false,
              location: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() },
              types: p.types ?? [], placeId: p.place_id!,
              distance: google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(location), p.geometry!.location!),
            }))
            
            setPlaces(mapped)

            // Clear old markers
            markersRef.current.forEach(m => m.setMap(null))
            
            // Add new markers
            markersRef.current = mapped.map(place => {
              const marker = new google.maps.Marker({
                position: place.location, map,
                icon: { 
                  path: google.maps.SymbolPath.CIRCLE, 
                  scale: 8, 
                  fillColor: '#0070E0', 
                  fillOpacity: 0.8, 
                  strokeColor: '#FFFFFF', 
                  strokeWeight: 2 
                },
                title: place.name
              })
              marker.addListener('click', () => setSelected(place))
              return marker
            })
          } else {
            console.error('[Mechanic Map] Search failed:', status);
            if (status === 'ZERO_RESULTS') {
              setError('No nearby mechanics found in this area.')
            } else {
              setError(`Google Maps Error: ${status}`)
            }
          }
          setLoading(false)
        })
      } catch (err) {
        console.error('[Mechanic Map] Critical error:', err);
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selected && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(selected.location)
      mapInstanceRef.current.setZoom(14)
    }
  }, [selected])

  const filteredPlaces = places.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (activeFilter === 'Open Now' && !p.isOpen) return false
    if (activeFilter === 'Top Rated' && p.rating < 4) return false
    if (activeFilter === 'Garage' && !p.types.includes('car_repair')) return false
    if (activeFilter === 'Mechanic' && !p.types.some(t => t.includes('mechanic') || t.includes('repair'))) return false
    return true
  }).sort((a, b) => {
    if (activeFilter === 'Closest') return (a.distance ?? Infinity) - (b.distance ?? Infinity)
    if (activeFilter === 'Top Rated') return b.rating - a.rating
    return 0
  })
  
  const [isSheetExpanded, setIsSheetExpanded] = useState(false)

  return (
    <div className="relative h-full overflow-hidden bg-transparent">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Map API Key Fallback */}
        {(!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'placeholder_google_maps_key') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-surface/60 dark:bg-surface-low/60 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-navy/20" />
            </div>
            <h3 className="text-lg font-display font-bold text-on-surface mb-1">Interactive Map</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/60">Google Maps Integration Required</p>
          </div>
        )}
      </div>

      {/* Floating Top Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-6 md:p-8 pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between max-w-md mx-auto pointer-events-auto"
        >
          <div className="flex items-center gap-3 bg-surface/80 dark:bg-surface-low/80 backdrop-blur-xl border border-overlay px-6 py-3 rounded-2xl shadow-xl w-full">
            <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-on-surface italic tracking-tight text-sm uppercase">Human Mechanic</h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-navy/40 hidden md:block">Nearby Providers</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Sheet */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: isSheetExpanded ? '10%' : '55%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 z-30 h-[95%] lg:h-[85%] lg:max-w-md lg:left-1/2 lg:-translate-x-1/2 lg:bottom-6 lg:rounded-[32px] overflow-hidden"
      >
        <div className="h-full bg-surface/95 dark:bg-surface-low/95 backdrop-blur-3xl border-t lg:border border-overlay rounded-t-[32px] lg:rounded-[32px] shadow-2xl flex flex-col">
          {/* Sheet Handle */}
          <div 
            className="w-full py-5 flex flex-col items-center cursor-pointer lg:hidden"
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
          >
            <div className="w-12 h-1.5 rounded-full bg-overlay" />
          </div>

          {/* Search Area */}
          <div className="px-6 pb-2">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
              <input 
                type="text" 
                className="w-full bg-surface-low dark:bg-surface-high border border-overlay rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-on-surface placeholder:text-muted focus:outline-none focus:border-navy focus:bg-surface transition-all shadow-inner" 
                placeholder="Find a mechanic near you..."
                value={searchQuery} 
                onFocus={() => setIsSheetExpanded(true)}
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {FILTERS.map(f => (
                <motion.button 
                  key={f} 
                  onClick={() => setActiveFilter(f)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    activeFilter === f 
                      ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' 
                      : 'bg-surface dark:bg-surface-high text-muted border-overlay hover:border-navy/30'
                  }`}
                  whileTap={{ scale: 0.96 }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-3 pb-24 lg:pb-6">
            {error && (
              <div className="mx-3 p-5 bg-red-50 border border-red-100 rounded-2xl mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 mb-1">Notice</p>
                <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
              </div>
            )}
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-navy animate-spin mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Searching providers...</p>
              </div>
            ) : filteredPlaces.length > 0 ? (
              <div className="space-y-2">
                {filteredPlaces.map(place => (
                  <motion.button 
                    key={place.id} 
                    onClick={() => {
                      setSelected(place)
                      setIsSheetExpanded(false)
                    }}
                    className={`w-full text-left p-5 rounded-2xl transition-all group relative border ${
                      selected?.id === place.id 
                        ? 'bg-navy/[0.03] border-navy/20' 
                        : 'bg-surface dark:bg-surface-high border-overlay hover:border-navy/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-on-surface text-[15px] leading-tight group-hover:text-navy transition-colors">{place.name}</h3>
                        <p className="text-[11px] text-muted mt-1 truncate max-w-[200px] font-medium">{place.address}</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border flex-shrink-0 ${
                        place.isOpen 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {place.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {place.rating > 0 && (
                        <div className="flex items-center gap-1.5 bg-surface-low dark:bg-surface-high/40 px-2 py-1 rounded-md border border-overlay">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[11px] font-bold text-on-surface">{formatRating(place.rating)}</span>
                        </div>
                      )}
                      {place.distance && (
                        <div className="flex items-center gap-1.5">
                          <Navigation className="w-3 h-3 text-navy" />
                          <span className="text-[11px] font-bold text-muted">{formatDistance(place.distance || 0)}</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                  <MapPin className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">No Providers Nearby</p>
                <p className="text-xs text-slate-300 max-w-[200px] leading-relaxed font-medium">Try adjusting your filters or search area.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Detail Overlay */}
      {selected && !isSheetExpanded && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute bottom-6 left-6 right-6 lg:left-1/2 lg:-translate-x-1/2 lg:w-[480px] z-40"
        >
          <div className="bg-white border border-slate-100 p-7 rounded-[32px] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-navy/10" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold text-on-surface italic tracking-tight mb-1">{selected.name}</h3>
                  <div className="flex items-center gap-2 text-muted">
                    <MapPin className="w-4 h-4" />
                    <p className="text-xs font-medium truncate max-w-[280px]">{selected.address}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelected(null)}
                  className="w-10 h-10 rounded-full bg-surface-low dark:bg-surface-high/40 flex items-center justify-center text-muted hover:text-navy hover:bg-navy/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-surface-low dark:bg-surface-high/40 border border-overlay p-4 rounded-2xl">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-2">Google Rating</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-base font-bold text-on-surface">{formatRating(selected.rating)}</span>
                    <span className="text-[11px] text-muted font-medium">({selected.userRatingsTotal})</span>
                  </div>
                </div>
                <div className="bg-surface-low dark:bg-surface-high/40 border border-overlay p-4 rounded-2xl">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-navy mb-2">Distance</p>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-navy" />
                    <span className="text-base font-bold text-on-surface">{formatDistance(selected.distance || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.a 
                  href={`tel:${selected.phoneNumber || '0000'}`} 
                  className="flex-1 text-center py-4 rounded-2xl bg-navy text-white font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-navy/20" 
                  whileHover={{ y: -2, filter: 'brightness(1.1)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Phone className="w-4 h-4" /> Contact Provider
                </motion.a>
                <motion.a 
                  href={`https://maps.google.com/?q=${selected.location.lat},${selected.location.lng}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-16 h-16 rounded-2xl bg-surface-low dark:bg-surface-high/40 border border-overlay flex items-center justify-center text-navy hover:bg-navy/5 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Navigation className="w-6 h-6" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
