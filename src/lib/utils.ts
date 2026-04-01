import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function getUrgencyColor(level: string): string {
  switch (level) {
    case 'critical': return 'text-red-500 bg-red-50 border-red-100'
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-100'
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100'
    case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    default: return 'text-muted bg-surface border-overlay'
  }
}

export function getUrgencyBadge(level: string): string {
  switch (level) {
    case 'critical': return 'Critical Status'
    case 'high': return 'High Urgency'
    case 'medium': return 'Medium Priority'
    case 'low': return 'Safe / Low Urgency'
    default: return 'Status Unknown'
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
