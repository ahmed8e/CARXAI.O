import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Volume2, AlertCircle } from 'lucide-react'
import { useTTS } from '../../lib/useTTS'

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

  const handleClick = () => {
    if (status === 'idle' || status === 'error') {
      play(cleanText)
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
    <div className="flex items-center gap-2 mt-2.5 ml-0.5">
      {/* Primary pill button */}
      <motion.button
        onClick={handleClick}
        disabled={isLoading}
        whileTap={!isLoading ? { scale: 0.95 } : {}}
        className={`
          flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold
          border transition-all duration-200 select-none
          ${isPlaying
            ? 'bg-navy/8 border-navy/20 text-navy'
            : isError
            ? 'bg-red-50 border-red-200/60 text-red-500'
            : 'bg-transparent border-overlay text-muted hover:border-navy/25 hover:text-navy hover:bg-navy/4'
          }
          ${isLoading ? 'cursor-default opacity-70' : 'cursor-pointer'}
        `}
        style={{ minWidth: 88 }}
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold
                       border border-overlay text-muted hover:border-navy/20 hover:text-navy
                       transition-all uppercase tracking-wider"
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
