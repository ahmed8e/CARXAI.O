/// <reference types="google.maps" />
import { useState, useEffect, useRef } from 'react'

declare global {
  interface Window {
    google: any;
  }
}
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserLocation, formatDistance, formatRating } from '../lib/utils'
import { loadGoogleMaps, GOOGLE_MAPS_STYLE } from '../lib/maps'
import type { NearbyPlace } from '../lib/types'
import { Truck, MapPin, Star, Phone, Loader2, Clock, Navigation, X } from 'lucide-react'



function getETA(distance?: number): string {
  if (!distance) return '15-20 min'
  const mins = Math.round((distance / 1000) * 3 + 5)
  return `${mins}-${mins + 5} min`
}

export default function Towing() {
  const { user } = useAuth()
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [selected, setSelected] = useState<NearbyPlace | null>(null)
  const [loading, setLoading] = useState(true)
  const [requested, setRequested] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey || apiKey === 'placeholder_google_maps_key') {
      setPlaces([])
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        console.log('[Towing Map] API Key starts with:', apiKey.substring(0, 5));
        console.log('[Towing Map] Initializing...');
        let location = { lat: 48.8566, lng: 2.3522 }; // Default: Paris
        
        try {
          const pos = await getUserLocation();
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('[Towing Map] Geolocation successful:', location);
        } catch (geoError) {
          console.warn('[Towing Map] Geolocation failed or denied. Using fallback location.', geoError);
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
        console.log('[Towing Map] Searching for providers...');
        service.nearbySearch({ 
          location, 
          radius: 15000, 
          keyword: 'towing service roadside assistance dépannage remorquage' 
        }, (results, status) => {
          console.log('[Towing Map] Search completed. Status:', status);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`[Towing Map] Found ${results.length} results.`);
            const mapped: NearbyPlace[] = results.map(p => ({
              id: p.place_id!, name: p.name!, address: p.vicinity ?? '',
              rating: p.rating ?? 0, userRatingsTotal: p.user_ratings_total ?? 0,
              isOpen: p.opening_hours?.isOpen() ?? false,
              location: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() },
              types: p.types ?? [], placeId: p.place_id!,
              distance: google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(location), p.geometry!.location!),
            }))
            
            const sorted = mapped.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
            setPlaces(sorted)

            // Clear old markers
            markersRef.current.forEach(m => m.setMap(null))
            
            // Add new markers
            markersRef.current = sorted.map(place => {
              const marker = new google.maps.Marker({
                position: place.location, map,
                icon: { 
                  path: google.maps.SymbolPath.CIRCLE, 
                  scale: 8, 
                  fillColor: '#fb923c', 
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
            console.error('[Towing Map] Search failed or returned no results. Status:', status);
            if (status === 'REQUEST_DENIED') {
              setError('Google Maps API Key denied. Please verify your API key and ensure "Places API" is enabled in Google Cloud Console.')
            } else if (status === 'OVER_QUERY_LIMIT') {
              setError('Google Maps API quota exceeded or billing not enabled.')
            } else if (status === 'ZERO_RESULTS') {
              setError('No nearby towing providers found in this area.')
            } else {
              setError(`Google Maps Error: ${status}`)
            }
          }
          setLoading(false)
        })
      } catch (err) {
        console.error('[Towing Map] Critical error during load:', err);
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

  const handleRequest = async (place: NearbyPlace) => {
    setRequested(place.id)
    if (user) {
      // @ts-ignore - Supabase type inference issue with this table
      await supabase.from('towing_requests').insert({
        user_id: user.id,
        provider_name: place.name,
        provider_place_id: place.placeId,
        status: 'requested',
      })
    }
  }

  const [isSheetExpanded, setIsSheetExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPlaces = places.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <h3 className="text-lg font-display font-black text-white italic tracking-tight mb-1">Towing Map View</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#CDFF00]/60">Google Maps Enabled</p>
          </div>
        )}
      </div>

      {/* 2. Floating Top UI Layer */}
      <div className="absolute top-0 left-0 right-0 z-10 px-7 pt-6 md:px-8 md:pt-8 pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between max-w-[393px] mx-auto pointer-events-auto"
        >
          <div className="flex items-center gap-3 bg-navy/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl w-full">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(251,146,60,0.2)]">
              <Truck className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-black text-white italic tracking-tight text-sm uppercase">Towing</h1>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 hidden md:block">Emergency Roadside Assistance</p>
            </div>
          </div>
          
          <button className="w-10 h-10 ml-3 rounded-2xl bg-navy/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-2xl group shrink-0">
            <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
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

          <div className="px-6 pb-4">
            {/* Action Bar / Emergency Trigger */}
            <div className="flex gap-2 mb-6">
              <button className="flex-1 bg-[#CDFF00] p-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(205,255,0,0.15)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Truck className="w-5 h-5 text-navy mb-0.5" />
                <span className="text-[10px] font-black text-navy uppercase tracking-widest">Request Now</span>
              </button>
              <button className="flex-1 bg-white/[0.03] border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/[0.05] transition-all">
                <Phone className="w-5 h-5 text-[#CDFF00] mb-0.5" />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Live Call</span>
              </button>
            </div>

            {/* Search Area */}
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text" 
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#CDFF00]/30 transition-all shadow-inner" 
                placeholder="Search towing services..."
                value={searchQuery} 
                onFocus={() => setIsSheetExpanded(true)}
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          {/* Provider List Content */}
          <div className="flex-1 overflow-y-auto px-3 pb-24 lg:pb-6">
            {error && (
              <div className="mx-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Search Error</p>
                <p className="text-xs text-red-400/80 leading-relaxed font-medium">{error}</p>
              </div>
            )}
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <Loader2 className="w-8 h-8 text-[#CDFF00] animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Locating Assistance...</p>
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
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white text-[15px] leading-tight group-hover:text-[#CDFF00] transition-colors">{place.name}</h3>
                        <p className="text-[11px] text-white/40 mt-1 truncate max-w-[180px] font-medium">{place.address}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                        <span className="text-[10px] font-black text-orange-400 italic">ETA {getETA(place.distance || 0)}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                          place.isOpen 
                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/5 text-red-400 border-red-500/20'
                        }`}>
                          {place.isOpen ? 'Available' : 'Busy'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {place.rating > 0 && (
                        <div className="flex items-center gap-1.5 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[11px] font-black text-white/80">{formatRating(place.rating)}</span>
                        </div>
                      )}
                      {place.distance && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-white/20" />
                          <span className="text-[11px] font-bold text-white/30">{formatDistance(place.distance || 0)}</span>
                        </div>
                      )}
                    </div>

                    {requested === place.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                      >
                       <Truck className="w-3 h-3" /> ✓ Request Sent
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-40">
                <Truck className="w-12 h-12 text-white/5 mb-6" />
                <p className="text-[11px] font-black uppercase tracking-widest mb-1.5 tracking-tighter">No Towing Available</p>
                <p className="text-xs font-medium leading-relaxed max-w-[200px] mx-auto">Try a different search or call emergency services directly.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4. Provider Detail Overlay */}
      {selected && !isSheetExpanded && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-[420px] z-40"
        >
          <div className="bg-navy border border-white/10 p-7 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="pr-4">
                  <h3 className="text-2xl font-display font-black text-white italic tracking-tighter mb-1.5">{selected.name}</h3>
                  <div className="flex items-center gap-2 text-white/40">
                    <MapPin className="w-3.5 h-3.5" />
                    <p className="text-[11px] font-medium truncate max-w-[240px]">{selected.address}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelected(null)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Star className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Rating</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-black text-white italic">{formatRating(selected.rating)}</span>
                    <span className="text-xs text-white/20 font-bold">({selected.userRatingsTotal})</span>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Clock className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#CDFF00]/40 mb-2">Response Time</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#CDFF00]" />
                    <span className="text-lg font-black text-white italic">{getETA(selected.distance)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button 
                  onClick={() => handleRequest(selected)}
                  disabled={requested === selected.id}
                  className={`flex-[2] text-center py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(205,255,0,0.2)] ${requested === selected.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-navy'}`} 
                  style={requested === selected.id ? {} : { background: '#CDFF00' }}
                  whileHover={requested !== selected.id ? { scale: 1.02, backgroundColor: '#DFFF30' } : {}}
                  whileTap={requested !== selected.id ? { scale: 0.98 } : {}}
                >
                  {requested === selected.id ? '✓ Towing Requested' : <><Truck className="w-4 h-4" /> Request Towing</>}
                </motion.button>
                <motion.a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.location.lat},${selected.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-white/[0.1] transition-all"
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
