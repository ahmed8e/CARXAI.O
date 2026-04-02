import { useState, useRef, useCallback } from 'react'

export type TTSStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

interface UseTTSOptions {
  /** Shared ref so only one message plays at a time across the whole page */
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>
}

interface UseTTSReturn {
  status: TTSStatus
  play: (text: string) => Promise<void>
  prefetch: (text: string) => Promise<string | null>
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
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
  }, [currentAudioRef])

  const createAudio = useCallback((url: string) => {
    const audio = new Audio(url)
    audioRef.current = audio
    currentAudioRef.current = audio

    audio.onplay = () => setStatus('playing')
    audio.onpause = () => {
      // Only mark as paused if audio isn't ended (avoid flicker at natural end)
      if (!audio.ended) setStatus('paused')
    }
    audio.onended = () => setStatus('idle')
    audio.onerror = () => setStatus('error')

    return audio
  }, [currentAudioRef])

  const play = useCallback(async (text: string) => {
    // If we already have a cached blob, just replay it
    if (blobUrlRef.current) {
      stopCurrentGlobal()
      const audio = createAudio(blobUrlRef.current)
      setStatus('loading')
      try {
        await audio.play()
      } catch {
        setStatus('error')
      }
      return
    }

    setStatus('loading')
    stopCurrentGlobal()

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey || apiKey === 'sk-placeholder') {
        setStatus('error')
        return
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: 'nova',
          input: text,
          response_format: 'mp3',
          speed: 1.0,
        }),
      })

      if (!response.ok) {
        setStatus('error')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url

      const audio = createAudio(url)
      await audio.play()
    } catch {
      setStatus('error')
    }
  }, [stopCurrentGlobal, createAudio])

  const prefetch = useCallback(async (text: string) => {
    if (blobUrlRef.current) return blobUrlRef.current

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey || apiKey === 'sk-placeholder') return null

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: 'nova',
          input: text,
          response_format: 'mp3',
          speed: 1.0,
        }),
      })

      if (!response.ok) return null

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      return url
    } catch {
      return null
    }
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => setStatus('error'))
    setStatus('playing')
  }, [])

  const replay = useCallback(() => {
    if (blobUrlRef.current) {
      stopCurrentGlobal()
      const audio = createAudio(blobUrlRef.current)
      setStatus('loading')
      audio.play()
        .then(() => setStatus('playing'))
        .catch(() => setStatus('error'))
    }
  }, [blobUrlRef, stopCurrentGlobal, createAudio])

  const stop = useCallback(() => {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setStatus('idle')
  }, [])

  return { status, play, prefetch, pause, resume, replay, stop }
}
