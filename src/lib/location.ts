/**
 * CarxAI Location Persistence Utility
 * Manage user location with a 24-hour expiration window.
 * Persists to both localStorage for speed and Supabase for cross-device reliability.
 */

const LOCATION_KEY = 'carxai_user_location'
const EXPIRATION_TIME = 24 * 60 * 60 * 1000 // 24 hours

interface SavedLocation {
  lat: number
  lng: number
  city?: string
  timestamp: number
}

/**
 * Saves location data locally. 
 * Note: Actual persistence to Supabase happens via AuthContext.updateProfile
 */
export function saveUserLocation(coords: { lat: number; lng: number }, city?: string, timestamp: number = Date.now()) {
  const data: SavedLocation = {
    ...coords,
    city,
    timestamp
  }
  localStorage.setItem(LOCATION_KEY, JSON.stringify(data))
  localStorage.setItem('carxai_location_prompt_seen', timestamp.toString())
}

/**
 * Checks if a location is valid based on a timestamp
 */
export function isLocationValid(timestamp?: number | string): boolean {
  if (!timestamp) return false
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  if (isNaN(ts)) return false
  return Date.now() - ts < EXPIRATION_TIME
}

/**
 * Returns saved coords if < 24h old, else returns null.
 * Can fallback to user_metadata if localStorage is empty.
 */
export function getSavedUserLocation(userMetadata?: any): { lat: number; lng: number; city?: string } | null {
  // 1. Try localStorage first
  const stored = localStorage.getItem(LOCATION_KEY)
  if (stored) {
    try {
      const data: SavedLocation = JSON.parse(stored)
      if (isLocationValid(data.timestamp)) {
        return { lat: data.lat, lng: data.lng, city: data.city }
      }
    } catch (err) {
      console.error('Error parsing local location:', err)
    }
  }

  // 2. Try User Metadata as fallback (Cross-device persistence)
  if (userMetadata?.latitude && userMetadata?.longitude && isLocationValid(userMetadata?.location_timestamp)) {
    // Re-sync local storage
    saveUserLocation(
      { lat: userMetadata.latitude, lng: userMetadata.longitude },
      userMetadata.city,
      userMetadata.location_timestamp
    )
    return { lat: userMetadata.latitude, lng: userMetadata.longitude, city: userMetadata.city }
  }

  return null
}

export function clearSavedUserLocation() {
  localStorage.removeItem(LOCATION_KEY)
}
