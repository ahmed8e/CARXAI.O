import { useState, useRef, useCallback } from 'react'

export type TTSStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

interface UseTTSOptions {
  /** Shared ref so only one message plays at a time across the whole page */
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>
}

interface UseTTSReturn {
  status: TTSStatus
  play: (text: string, token?: string) => Promise<void>
  prefetch: (text: string, token?: string) => Promise<string | null>
  pause: () => void
  resume: () => void
  replay: () => void
  stop: () => void
}

export function useTTS({ currentAudioRef }: UseTTSOptions): UseTTSReturn {
  const [status, setStatus] = useState<TTSStatus>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const stopCurrentGlobal = useCallback(() => {
    if (currentAudioRef.current && currentAudioRef.current !== audioRef.current) {
      console.log('[TTS] Stopping other global audio')
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
  }, [currentAudioRef])

  const createAudio = useCallback((url: string) => {
    console.log('[TTS] Creating Audio instance for URL:', url.substring(0, 50) + '...')
    const audio = new Audio(url)
    audioRef.current = audio
    currentAudioRef.current = audio

    audio.onplay = () => {
      console.log('[TTS] Audio started playing')
      setStatus('playing')
    }
    audio.onpause = () => {
      console.log('[TTS] Audio paused')
      if (!audio.ended) setStatus('paused')
    }
    audio.onended = () => {
      console.log('[TTS] Audio ended naturally')
      setStatus('idle')
    }
    audio.onerror = (e) => {
      console.error('[TTS] Audio element error:', e, audio.error)
      setStatus('error')
    }
    audio.oncanplaythrough = () => {
      console.log('[TTS] Audio can play through')
    }

    return audio
  }, [currentAudioRef])

  const play = useCallback(async (text: string, token?: string) => {
    console.log('[TTS] Play requested for text:', text.substring(0, 50) + '...')
    
    // 1. PRIME: Create audio early to help some browsers recognize the user gesture
    if (!audioRef.current) {
      console.log('[TTS] Priming audio element...')
      const primer = new Audio()
      primer.load() // Some browsers need this to "unlock" the audio channel
      audioRef.current = primer
    }

    if (blobUrlRef.current) {
      console.log('[TTS] Reusing cached blob URL')
      stopCurrentGlobal()
      const audio = createAudio(blobUrlRef.current)
      setStatus('loading')
      try {
        await audio.play()
      } catch (err) {
        console.error('[TTS] Playback of cached blob failed:', err)
        setStatus('error')
      }
      return
    }

    setStatus('loading')
    stopCurrentGlobal()

    try {
      console.log('[TTS] Fetching speech from API...')
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          model: 'tts-1',
          voice: 'nova',
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('[TTS] API Response not OK:', response.status, errText)
        setStatus('error')
        return
      }

      const contentType = response.headers.get('Content-Type')
      console.log('[TTS] API Response Header:', contentType)

      const arrayBuffer = await response.arrayBuffer()
      console.log('[TTS] Received ArrayBuffer size:', arrayBuffer.byteLength)

      // Explicitly set MIME type to help mobile browsers
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      console.log('[TTS] Blob URL created:', url)

      const audio = createAudio(url)
      console.log('[TTS] Attempting playback...')
      
      try {
        await audio.play()
        console.log('[TTS] Playback promise resolved successfully')
      } catch (playErr: any) {
        console.error('[TTS] Playback promise rejected:', playErr.name, playErr.message)
        // Check for specific mobile restrictions
        if (playErr.name === 'NotAllowedError') {
          console.warn('[TTS] Playback blocked by browser policy. User gesture might be stale.')
        }
        setStatus('error')
      }
    } catch (fetchErr) {
      console.error('[TTS] Fetch or processing failed:', fetchErr)
      setStatus('error')
    }
  }, [stopCurrentGlobal, createAudio])

  const prefetch = useCallback(async (text: string, token?: string) => {
    if (blobUrlRef.current) return blobUrlRef.current

    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text,
          model: 'tts-1',
          voice: 'nova',
        }),
      })

      if (!response.ok) return null

      const arrayBuffer = await response.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      return url
    } catch {
      return null
    }
  }, [])

  const pause = useCallback(() => {
    console.log('[TTS] Pause requested')
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    console.log('[TTS] Resume requested')
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => console.log('[TTS] Resume successful'))
        .catch(err => {
          console.error('[TTS] Resume failed:', err)
          setStatus('error')
        })
      setStatus('playing')
    }
  }, [])

  const replay = useCallback(() => {
    if (blobUrlRef.current) {
      console.log('[TTS] Replay requested')
      stopCurrentGlobal()
      const audio = createAudio(blobUrlRef.current)
      setStatus('loading')
      audio.play()
        .then(() => {
          console.log('[TTS] Replay successful')
          setStatus('playing')
        })
        .catch(err => {
          console.error('[TTS] Replay failed:', err)
          setStatus('error')
        })
    }
  }, [blobUrlRef, stopCurrentGlobal, createAudio])

  const stop = useCallback(() => {
    console.log('[TTS] Stop requested')
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setStatus('idle')
  }, [])

  return { status, play, prefetch, pause, resume, replay, stop }
}
