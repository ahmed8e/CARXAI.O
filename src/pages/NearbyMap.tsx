import { useState, useEffect, useRef } from 'react'
import { getUserLocation, formatDistance, formatRating } from '../lib/utils'
import { loadGoogleMaps, GOOGLE_MAPS_STYLE } from '../lib/maps'
import type { NearbyPlace } from '../lib/types'
import { Map as MapIcon, Users, Truck, Wrench, MapPin, Star, Loader2, AlertCircle, ChevronRight } from 'lucide-react'

const MAP_FILTERS = ['All', 'Mechanics', 'Garages', 'Towing', 'Open Now', 'Top Rated']

function getPlaceIcon(types: string[]) {
  if (types.includes('towing')) return Truck
  if (types.some(t => t.includes('car_repair') || t.includes('mechanic'))) return Users
  return Wrench
}

function getPlaceColor(types: string[]): string {
  if (types.includes('towing')) return '#ea580c' // orange-600
  return '#0070E0' // brand blue
}

export default function NearbyMap() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [selected, setSelected] = useState<NearbyPlace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
          console.warn('[Nearby Map] Geolocation failed. Using fallback location.');
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
          keyword: 'mechanic garage car repair towing service' 
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const mapped: NearbyPlace[] = results.map((p: any) => ({
              id: p.place_id!, name: p.name!, address: p.vicinity ?? '',
              rating: p.rating ?? 0, userRatingsTotal: p.user_ratings_total ?? 0,
              isOpen: p.opening_hours?.isOpen() ?? false,
              location: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() },
              types: p.types ?? [], placeId: p.place_id!,
              distance: google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(location), p.geometry!.location!),
            }))
            
            setPlaces(mapped)

            // Clear old markers
            markersRef.current.forEach((m: any) => m.setMap(null))
            
            // Add new markers
            markersRef.current = mapped.map((place: NearbyPlace) => {
              const color = getPlaceColor(place.types)
              const marker = new google.maps.Marker({
                position: place.location, map,
                icon: { 
                  path: google.maps.SymbolPath.CIRCLE, 
                  scale: 8, 
                  fillColor: color, 
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
            setError(status === 'ZERO_RESULTS' ? 'No nearby help found.' : `Map Status: ${status}`)
          }
          setLoading(false)
        })
      } catch (err) {
        setLoading(false)
        setError('Failed to load map.')
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

  const filteredPlaces = places.filter((p: NearbyPlace) => {
    if (activeFilter === 'Open Now' && !p.isOpen) return false
    if (activeFilter === 'Top Rated' && p.rating < 4.5) return false
    if (activeFilter === 'Towing' && !p.types.includes('towing')) return false
    if (activeFilter === 'Mechanics' && p.types.includes('towing')) return false
    if (activeFilter === 'Garages' && !p.types.includes('car_repair')) return false
    return true
  })

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-overlay">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-on-surface text-lg italic tracking-tight uppercase">Nearby Help Map</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Real-time Service Network</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {MAP_FILTERS.map(f => (
            <button 
              key={f} 
              onClick={() => setActiveFilter(f)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                activeFilter === f 
                  ? 'bg-navy text-white border-navy shadow-md shadow-navy/20' 
                  : 'bg-surface-low dark:bg-slate-800 text-muted border-overlay hover:border-navy/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div ref={mapRef} className="flex-1 min-h-[350px] lg:min-h-0 relative bg-surface-low dark:bg-slate-900">
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="bg-surface dark:bg-slate-800 border border-overlay p-8 rounded-3xl text-center max-w-sm shadow-2xl">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <p className="font-display font-bold text-on-surface text-lg mb-2">Map Error</p>
                <p className="text-sm text-muted font-medium leading-relaxed">{error}</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/40 dark:bg-slate-900/40 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-navy animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy/60">Scanning Area...</p>
              </div>
            </div>
          )}
        </div>

        {/* Side list */}
        <div className="w-full lg:w-80 overflow-y-auto border-t lg:border-t-0 lg:border-l border-overlay bg-surface dark:bg-slate-900 shadow-2xl">
          {filteredPlaces.map((place: NearbyPlace) => {
            const Icon = getPlaceIcon(place.types)
            const color = getPlaceColor(place.types)
            const isSelected = selected?.id === place.id
            
            return (
              <button 
                key={place.id} 
                onClick={() => setSelected(place)}
                className={`w-full text-left p-5 border-b border-overlay transition-all group ${
                  isSelected ? 'bg-navy/[0.03] border-navy/10' : 'hover:bg-surface-high/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      isSelected ? 'shadow-md' : 'shadow-sm'
                    }`} 
                    style={{ backgroundColor: `${color}10` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`font-bold text-sm truncate transition-colors ${
                        isSelected ? 'text-navy' : 'text-on-surface group-hover:text-navy'
                      }`}>
                        {place.name}
                      </p>
                      <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${
                        isSelected ? 'translate-x-1 text-navy' : 'group-hover:translate-x-1'
                      }`} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-muted">
                      {place.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-on-surface/80">{formatRating(place.rating)}</span>
                        </span>
                      )}
                      {place.distance && <span>{formatDistance(place.distance)}</span>}
                      <span className={`font-bold ${place.isOpen ? 'text-emerald-600' : 'text-red-500'}`}>
                        {place.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
          
          {filteredPlaces.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-low dark:bg-slate-800 border border-overlay flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-muted/30" />
              </div>
              <p className="text-sm font-bold text-muted uppercase tracking-widest mb-2">No results found</p>
              <p className="text-xs text-muted/60 leading-relaxed italic">Try selecting a different filter or expanding your search area.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
