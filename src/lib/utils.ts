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
    case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    default: return 'text-muted bg-surface border-surface-high'
  }
}

export function getUrgencyBadge(level: string): string {
  switch (level) {
    case 'critical': return '🔴 Critical'
    case 'high': return '🟠 High'
    case 'medium': return '🟡 Medium'
    case 'low': return '🟢 Low'
    default: return 'Unknown'
  }
}

export function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Improved voice selection
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => 
      (v.name.includes('Google US English') || v.name.includes('English (United States)')) && 
      v.lang.startsWith('en')
    )
    if (preferredVoice) utterance.voice = preferredVoice

    utterance.rate = 1.0 // Natural rate
    utterance.pitch = 1.05 // Clearer pitch
    window.speechSynthesis.speak(utterance)
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
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
