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
  { elementType: 'geometry', stylers: [{ color: '#062B3D' }] },
  { elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#B8C6CC' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#0B4E63' }]
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#57D6E8' }]
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#B8C6CC' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8EF3FF', opacity: 0.5 }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#041E2B' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#B8C6CC', opacity: 0.5 }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#0B4E63' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#B8C6CC' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#0B4E63', weight: 2 }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#F4F8FB' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#0B4E63', weight: 1.5 }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#062B3D' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#57D6E8' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#041E2B' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0B4E63' }]
  }
]
