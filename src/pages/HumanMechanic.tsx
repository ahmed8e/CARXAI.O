import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getUserLocation, formatDistance, formatRating } from '../lib/utils'
import { loadGoogleMaps, GOOGLE_MAPS_STYLE } from '../lib/maps'
import type { NearbyPlace } from '../lib/types'
import { Users, MapPin, Star, Phone, Navigation, Search, Loader2 } from 'lucide-react'

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
        console.log('[Mechanic Map] API Key starts with:', apiKey.substring(0, 5));
        console.log('[Mechanic Map] Initializing...');
        let location = { lat: 48.8566, lng: 2.3522 }; // Default: Paris
        
        try {
          const pos = await getUserLocation();
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('[Mechanic Map] Geolocation successful:', location);
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
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#CDFF00', fillOpacity: 1, strokeColor: '#062B3D', strokeWeight: 3 },
          title: 'Your Location',
          zIndex: 100
        })

        const service = new google.maps.places.PlacesService(map)
        console.log('[Mechanic Map] Searching for providers...');
        service.nearbySearch({ 
          location, 
          radius: 15000, 
          keyword: 'mechanic garage car repair auto repair mécanicien garage' 
        }, (results, status) => {
          console.log('[Mechanic Map] Search completed. Status:', status);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`[Mechanic Map] Found ${results.length} results.`);
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
                  fillColor: '#34d399', 
                  fillOpacity: 0.9, 
                  strokeColor: '#062B3D', 
                  strokeWeight: 2 
                },
                title: place.name
              })
              marker.addListener('click', () => setSelected(place))
              return marker
            })
          } else {
            console.error('[Mechanic Map] Search failed or returned no results. Status:', status);
            if (status === 'REQUEST_DENIED') {
              setError('Google Maps API Key denied. Please verify your API key and ensure "Places API" is enabled in Google Cloud Console.')
            } else if (status === 'OVER_QUERY_LIMIT') {
              setError('Google Maps API quota exceeded or billing not enabled.')
            } else if (status === 'ZERO_RESULTS') {
              setError('No nearby mechanics found in this area.')
            } else {
              setError(`Google Maps Error: ${status}`)
            }
          }
          setLoading(false)
        })
      } catch (err) {
        console.error('[Mechanic Map] Critical error during load:', err);
        setLoading(false)
      }
    }
    load()
  }, [])

  // Keep markers synchronized and center map on selection
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
    <div className="relative h-full overflow-hidden bg-navy">
      {/* 1. Full-Screen Map Background */}
      <div className="absolute inset-0 z-0">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Subtle Dark Map Overlay */}
        <div className="absolute inset-0 bg-navy/40 pointer-events-none" />
        
        {/* Map API Key Fallback */}
        {(!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'placeholder_google_maps_key') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-navy/60 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-display font-black text-white italic tracking-tight mb-1">Immersive Map View</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#CDFF00]/60">Google Maps Enabled</p>
          </div>
        )}
      </div>

      {/* 2. Floating Top UI Layer */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-6 md:p-8 pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between max-w-md mx-auto pointer-events-auto"
        >
          <div className="flex items-center gap-3 bg-navy/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl w-full">
            <div className="w-6 h-6 rounded-lg bg-[#CDFF00]/20 flex items-center justify-center border border-[#CDFF00]/20 shadow-[0_0_15px_rgba(205,255,0,0.2)]">
              <Users className="w-3.5 h-3.5 text-[#CDFF00]" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-black text-white italic tracking-tight text-sm uppercase">Human Mechanic</h1>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#CDFF00]/40 hidden md:block">Expert Provider Network</p>
            </div>
          </div>
          
          <button className="w-10 h-10 ml-3 rounded-2xl bg-navy/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-2xl group shrink-0">
            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* 3. Layered Bottom Sheet */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: isSheetExpanded ? '10%' : '55%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 z-30 h-[95%] lg:h-[85%] lg:max-w-md lg:left-1/2 lg:-translate-x-1/2 lg:bottom-6 lg:rounded-[24px] overflow-hidden"
      >
        <div className="h-full bg-navy/95 backdrop-blur-3xl border-t lg:border border-white/10 rounded-t-[24px] lg:rounded-[24px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col">
          {/* Sheet Handle */}
          <div 
            className="w-full py-4 flex flex-col items-center cursor-pointer lg:hidden"
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
          >
            <div className="w-12 h-1 rounded-full bg-white/20 mb-1" />
          </div>

          {/* Search Area */}
          <div className="px-6 pb-2">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
              <input 
                type="text" 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#CDFF00]/30 transition-all shadow-inner" 
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
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    activeFilter === f 
                      ? 'bg-[#CDFF00] text-navy border-[#CDFF00] shadow-[0_0_20px_rgba(205,255,0,0.2)]' 
                      : 'bg-white/[0.03] text-white/40 border-white/5 hover:border-white/20'
                  }`}
                  whileTap={{ scale: 0.96 }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-2 pb-24 lg:pb-6">
            {error && (
              <div className="mx-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Notice</p>
                <p className="text-xs text-red-400/80 leading-relaxed">{error}</p>
              </div>
            )}
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <Loader2 className="w-8 h-8 text-[#CDFF00] animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Analyzing Nearby Data...</p>
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
                        ? 'bg-[#CDFF00]/5 border-[#CDFF00]/20' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="pr-2">
                        <h3 className="font-bold text-white text-[15px] leading-tight group-hover:text-[#CDFF00] transition-colors">{place.name}</h3>
                        <p className="text-[11px] text-white/40 mt-1 truncate max-w-[200px]">{place.address}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border flex-shrink-0 ${
                        place.isOpen 
                          ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/5 text-red-400 border-red-500/20'
                      }`}>
                        {place.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {place.rating > 0 && (
                        <div className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-1 rounded-md border border-white/5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[11px] font-black text-white/80">{formatRating(place.rating)}</span>
                        </div>
                      )}
                      {place.distance && (
                        <div className="flex items-center gap-1.5">
                          <Navigation className="w-3 h-3 text-[#CDFF00]" />
                          <span className="text-[11px] font-bold text-white/40">{formatDistance(place.distance || 0)}</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                  <MapPin className="w-8 h-8 text-white/10" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-2">No Providers Nearby</p>
                <p className="text-xs text-white/20 max-w-[200px] leading-relaxed">Try adjusting your filters or expanding your search area.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4. Detail Panel (Floating on map when selected) */}
      {selected && !isSheetExpanded && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 z-40"
        >
          <div className="bg-navy border border-white/10 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#CDFF00]/40 to-transparent" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-display font-black text-white italic tracking-tight mb-1">{selected.name}</h3>
                  <p className="text-xs text-white/40 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {selected.address}
                  </p>
                </div>
                <button 
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5">User Rating</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-black text-white">{formatRating(selected.rating)}</span>
                    <span className="text-[10px] text-white/20 font-medium">({selected.userRatingsTotal})</span>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#CDFF00]/40 mb-1.5">Est. Distance</p>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#CDFF00]" />
                    <span className="text-sm font-black text-white">{formatDistance(selected.distance || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.a 
                  href={`tel:${selected.phoneNumber || '0000'}`} 
                  className="flex-1 text-center py-4 rounded-xl text-navy font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2" 
                  style={{ background: '#CDFF00' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Phone className="w-4 h-4" /> Call Dealer
                </motion.a>
                <motion.a 
                  href={`https://maps.google.com/?q=${selected.location.lat},${selected.location.lng}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-14 h-14 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-white/[0.1] transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Navigation className="w-5 h-5 text-[#CDFF00]" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
