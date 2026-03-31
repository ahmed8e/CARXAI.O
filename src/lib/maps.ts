export async function loadGoogleMaps(apiKey: string): Promise<void> {
  if (!apiKey || apiKey === 'placeholder_google_maps_key') {
    throw new Error('Invalid Google Maps API Key. Please check your .env file.')
  }

  // Check for existing script in the head
  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement
  
  if (existingScript) {
    try {
      const url = new URL(existingScript.src)
      const scriptKey = url.searchParams.get('key')
      
      if (scriptKey && scriptKey !== apiKey) {
        console.warn('[MAP AUTH] API Key mismatch detected between .env and loaded script.', { 
          loaded: scriptKey.substring(0, 5) + '...', 
          target: apiKey.substring(0, 5) + '...' 
        })
        console.warn('[MAP AUTH] Forcing page refresh to clear cached Google Maps authorization...')
        window.location.reload()
        // Return a never-resolving promise to block further execution while page reloads
        return new Promise(() => {})
      }
    } catch (e) {
      console.error('[MAP AUTH] Error checking existing script key:', e)
    }

    // If script exists and key matches, just wait for google object if not yet ready
    if (window.google) return
  }

  // Load fresh script
  console.log('[MAP AUTH] Initializing Google Maps with key starting with:', apiKey.substring(0, 5))
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
  script.async = true
  
  return new Promise((resolve, reject) => {
    script.onload = () => {
      console.log('[MAP AUTH] Google Maps script loaded successfully.')
      resolve()
    }
    script.onerror = () => {
      console.error('[MAP AUTH] Failed to load Google Maps script. Check your internet connection or API key.')
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })
}

export const GOOGLE_MAPS_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#C9E2FF" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
]
