import { useState, useEffect, useRef } from 'react'
import { getUserLocation, formatDistance, formatRating } from '../lib/utils'
import { loadGoogleMaps, GOOGLE_MAPS_STYLE } from '../lib/maps'
import type { NearbyPlace } from '../lib/types'
import { Map as MapIcon, Users, Truck, Wrench, MapPin, Star, Loader2, AlertCircle } from 'lucide-react'

const MAP_FILTERS = ['All', 'Mechanics', 'Garages', 'Towing', 'Open Now', 'Top Rated']



function getPlaceIcon(types: string[]) {
  if (types.includes('towing')) return Truck
  if (types.some(t => t.includes('car_repair') || t.includes('mechanic'))) return Users
  return Wrench
}

function getPlaceColor(types: string[]): string {
  if (types.includes('towing')) return '#fb923c'
  return '#34d399'
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
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#CDFF00', fillOpacity: 1, strokeColor: '#062B3D', strokeWeight: 3 },
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <MapIcon className="w-5 h-5 text-purple-400" />
          <h1 className="font-display font-bold text-soft">Nearby Help Map</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {MAP_FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`chip whitespace-nowrap ${activeFilter === f ? 'active' : ''}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div ref={mapRef} className="flex-1 min-h-[300px] lg:min-h-0 relative" style={{ background: '#041E2B' }}>
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-navy/80 backdrop-blur-sm">
              <div className="card text-center max-w-sm">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="font-display font-bold text-soft mb-1">Map Error</p>
                <p className="text-sm text-muted">{error}</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy/50">
              <Loader2 className="w-8 h-8 text-cyan-DEFAULT animate-spin" />
            </div>
          )}
        </div>

        {/* Side list */}
        <div className="w-full lg:w-72 overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/5">
          {filteredPlaces.map((place: NearbyPlace) => {
            const Icon = getPlaceIcon(place.types)
            const color = getPlaceColor(place.types)
            return (
              <button key={place.id} onClick={() => setSelected(place)}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/3 transition-colors ${selected?.id === place.id ? 'bg-purple-500/5' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-soft text-sm truncate">{place.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      {place.rating > 0 && <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />{formatRating(place.rating)}</span>}
                      {place.distance && <span>{formatDistance(place.distance)}</span>}
                      <span className={place.isOpen ? 'text-emerald-400' : 'text-red-400'}>{place.isOpen ? 'Open' : 'Closed'}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
          {filteredPlaces.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No places found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
