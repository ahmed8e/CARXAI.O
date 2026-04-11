import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number | string | null | undefined): string {
  const m = Number(meters)
  if (isNaN(m)) return 'Nearby'
  if (m < 1000) return `${Math.round(m)}m`
  return `${(m / 1000).toFixed(1)}km`
}

export function formatRating(rating: number | string | null | undefined): string {
  const r = Number(rating)
  return isNaN(r) ? '0.0' : r.toFixed(1)
}

export function getUrgencyColor(level: string): string {
  switch (level) {
    case 'stop_driving': return 'text-red-500 bg-red-50 border-red-100'
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-100'
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100'
    case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    default: return 'text-muted bg-surface border-overlay'
  }
}

export function getUrgencyBadge(level: string): string {
  switch (level) {
    case 'stop_driving': return 'Stop driving'
    case 'high': return 'High'
    case 'medium': return 'Medium'
    case 'low': return 'Low'
    default: return 'Unknown'
  }
}



export function getUserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    })
  })
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isIOS(): boolean {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

export function getMapLinks(lat: number | null, lng: number | null, name: string) {
  if (!lat || !lng) return { googleMaps: '#', googleMapsApp: '#', waze: '#', wazeApp: '#', appleMaps: '#', appleMapsWeb: '#' }
  
  const encodedName = encodeURIComponent(name)
  return {
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    googleMapsApp: `comgooglemaps://?q=${lat},${lng}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    wazeApp: `waze://?ll=${lat},${lng}&navigate=yes`,
    appleMaps: `maps://?q=${encodedName}&ll=${lat},${lng}`,
    appleMapsWeb: `https://maps.apple.com/?q=${encodedName}&ll=${lat},${lng}`
  }
}
