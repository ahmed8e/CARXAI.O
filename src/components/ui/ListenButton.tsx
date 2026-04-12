import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Volume2, AlertCircle } from 'lucide-react'
import { useTTS } from '../../lib/useTTS'
import { supabase } from '../../lib/supabase'

interface ListenButtonProps {
  text: string
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>
}

/** Strip markdown so TTS reads clean text */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/`(.*?)`/g, '$1')
    .trim()
}

export default function ListenButton({ text, currentAudioRef }: ListenButtonProps) {
  const { status, play, pause, resume, replay } = useTTS({ currentAudioRef })

  const cleanText = useMemo(() => stripMarkdown(text), [text])

  const handleClick = async () => {
    if (status === 'idle' || status === 'error') {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      play(cleanText, token)
    } else if (status === 'playing') {
      pause()
    } else if (status === 'paused') {
      resume()
    }
  }

  const isLoading = status === 'loading'
  const isPlaying = status === 'playing'
  const isPaused = status === 'paused'
  const isIdle = status === 'idle'
  const isError = status === 'error'
  const isDone = isIdle && !isLoading

  return (
    <div className="flex items-center gap-2">
      {/* Primary pill button */}
      <motion.button
        onClick={handleClick}
        disabled={isLoading}
        whileTap={!isLoading ? { scale: 0.95 } : {}}
        className={`
          flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em]
          border transition-all duration-500 select-none
          ${isPlaying
            ? 'bg-navy/5 border-navy/20 text-navy shadow-inner'
            : isError
            ? 'bg-red-50 border-red-200/60 text-red-500'
            : 'bg-blue-50/30 border-navy/5 text-navy shadow-[0_4px_12px_rgba(0,112,224,0.04)] hover:shadow-[0_8px_20px_rgba(0,112,224,0.08)] hover:border-navy/10 hover:bg-white hover:-translate-y-[1px]'
          }
          ${isLoading ? 'cursor-default opacity-70' : 'cursor-pointer'}
        `}
        style={{ minWidth: 100 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {/* Animated waveform */}
              <span className="flex items-end gap-[2.5px] h-3.5">
                {[0, 0.15, 0.08].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="w-[2.5px] rounded-full bg-navy/50"
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
                    style={{ height: 12, display: 'block', transformOrigin: 'bottom' }}
                  />
                ))}
              </span>
              <span className="uppercase tracking-wider">Generating…</span>
            </motion.span>
          ) : isPlaying ? (
            <motion.span
              key="playing"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              className="flex items-center gap-1.5"
            >
              {/* Mini live waveform */}
              <span className="flex items-end gap-[2px] h-3.5">
                {[0, 0.1, 0.05, 0.15].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="w-[2px] rounded-full bg-navy"
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                    style={{ height: 12, display: 'block', transformOrigin: 'bottom' }}
                  />
                ))}
              </span>
              <Pause className="w-3 h-3" />
              <span className="uppercase tracking-wider">Pause</span>
            </motion.span>
          ) : isPaused ? (
            <motion.span
              key="paused"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              className="flex items-center gap-1.5"
            >
              <Play className="w-3 h-3" />
              <span className="uppercase tracking-wider">Resume</span>
            </motion.span>
          ) : isError ? (
            <motion.span
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5"
            >
              <AlertCircle className="w-3 h-3" />
              <span className="uppercase tracking-wider">Try again</span>
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 4 }}
              className="flex items-center gap-1.5"
            >
              <Volume2 className="w-3 h-3" />
              <span className="uppercase tracking-wider">Listen</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Replay pill — appears after first play ends */}
      <AnimatePresence>
        {(isPaused || (isDone && !isLoading && !isError)) && status !== 'idle' ? null : null}
      </AnimatePresence>

      {/* Replay — show when done or paused (not on first idle) */}
      <AnimatePresence>
        {(isPaused) && (
          <motion.button
            key="replay"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            onClick={replay}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-bold
                       bg-white border border-overlay shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-navy/60 hover:border-navy/20 hover:text-navy hover:shadow-[0_4px_15px_rgba(0,0,0,0.06)] hover:-translate-y-[1px]
                       transition-all uppercase tracking-widest"
            title="Replay from beginning"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Replay
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
