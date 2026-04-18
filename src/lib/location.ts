/**
 * CarxAI Location Persistence Utility
 * Manage user location with a 24-hour expiration window.
 */

const LOCATION_KEY = 'carxai_user_location'
const EXPIRATION_TIME = 24 * 60 * 60 * 1000 // 24 hours

interface SavedLocation {
  lat: number
  lng: number
  city?: string
  timestamp: number
}

export function saveUserLocation(coords: { lat: number; lng: number }, city?: string) {
  const data: SavedLocation = {
    ...coords,
    city,
    timestamp: Date.now()
  }
  localStorage.setItem(LOCATION_KEY, JSON.stringify(data))
  // Also synchronize with the old prompt key for backward compatibility/sequencing
  localStorage.setItem('carxai_location_prompt_seen', Date.now().toString())
}

export function getSavedUserLocation(): { lat: number; lng: number; city?: string } | null {
  const stored = localStorage.getItem(LOCATION_KEY)
  if (!stored) return null

  try {
    const data: SavedLocation = JSON.parse(stored)
    const isExpired = Date.now() - data.timestamp > EXPIRATION_TIME

    if (isExpired) {
      localStorage.removeItem(LOCATION_KEY)
      return null
    }

    return { lat: data.lat, lng: data.lng, city: data.city }
  } catch (err) {
    console.error('Error parsing saved location:', err)
    return null
  }
}

export function clearSavedUserLocation() {
  localStorage.removeItem(LOCATION_KEY)
}
