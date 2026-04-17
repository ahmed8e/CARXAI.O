import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle2 } from 'lucide-react'

interface DevelopmentModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  badgeText?: string
  bodyText?: string
  descriptionText?: string
}

export default function DevelopmentModal({
  isOpen,
  onClose,
  title = "Nearby Map",
  badgeText = "In Development",
  bodyText = "This feature is currently under development and will be available soon.",
  descriptionText = "We are building a better live map experience for nearby mechanics and towing support."
}: DevelopmentModalProps) {
  
  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-low/60 dark:bg-black/60 backdrop-blur-md"
          />

          {/* Modal Surface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-surface border border-overlay rounded-[32px] shadow-2xl overflow-hidden p-8"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-high/20 transition-colors text-muted hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content Container */}
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-navy/10 text-navy mb-6">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">{badgeText}</span>
              </div>

              {/* Icon / Visual representation */}
              <div className="w-20 h-20 rounded-3xl bg-surface-low dark:bg-white/5 flex items-center justify-center mb-6 shadow-inner ring-1 ring-overlay">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy to-blue-400 flex items-center justify-center shadow-lg shadow-navy/30">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Title & Body */}
              <h2 className="text-2xl font-display font-black text-on-surface tracking-tight italic mb-3">
                {title}
              </h2>
              <p className="text-sm font-bold text-on-surface/80 leading-relaxed mb-2 px-4">
                {bodyText}
              </p>
              {descriptionText && (
                <p className="text-[11px] font-medium text-muted leading-relaxed mb-8 px-6">
                  {descriptionText}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-navy text-white font-bold text-sm tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-navy/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Got it
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-surface-low dark:bg-white/5 text-muted font-bold text-[11px] uppercase tracking-widest hover:text-on-surface transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
