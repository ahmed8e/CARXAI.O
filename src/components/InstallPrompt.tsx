import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share, PlusSquare, Zap, Smartphone } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

const DISMISS_KEY = 'carxai_install_prompt_dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export default function InstallPrompt() {
  const { isInstallable, isIOS, isStandalone, handleInstall } = usePWAInstall()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Determine if we should show the prompt
    const checkVisibility = () => {
      // 1. Don't show if already in standalone mode (installed)
      if (isStandalone) return false
      
      // 2. Check if user dismissed it recently
      const dismissedAt = localStorage.getItem(DISMISS_KEY)
      if (dismissedAt) {
        const timeSinceDismissal = Date.now() - parseInt(dismissedAt, 10)
        if (timeSinceDismissal < DISMISS_DURATION) return false
      }

      // 3. Show if it's installable via browser (Android/Chrome) or it's iOS Safari
      return isInstallable || isIOS
    }

    if (checkVisibility()) {
      // Delay visibility slightly for better UX (let dashboard load first)
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isIOS, isStandalone])

  const handleDismiss = (permanent = false) => {
    setIsVisible(false)
    if (permanent) {
      // For now, permanent dismissal just sets a very long duration or standard 7 days
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } else {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    }
  }

  const onInstallClick = async () => {
    if (isInstallable) {
      await handleInstall()
      handleDismiss(true)
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-96"
      >
        <div className="bg-surface dark:bg-surface-low border border-overlay shadow-2xl rounded-3xl p-6 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-navy/5 rounded-full blur-3xl pointer-events-none" />
          
          <button 
            onClick={() => handleDismiss()}
            className="absolute top-4 right-4 p-2 text-muted hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-navy" fill="currentColor" />
            </div>
            <div>
              <h3 className="text-lg font-display font-black text-on-surface italic tracking-tight">
                {isIOS ? 'Add Carxai to Home' : 'Install Carxai'}
              </h3>
              <p className="text-sm text-muted font-medium leading-relaxed">
                {isIOS 
                  ? 'Use Carxai like an app for faster access and a better mobile experience.' 
                  : 'Install our app for instant access and a smoother experience.'}
              </p>
            </div>
          </div>

          {isIOS ? (
            <div className="space-y-4">
              <div className="bg-surface-low dark:bg-slate-800/50 rounded-2xl p-4 border border-overlay">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 shadow-sm border border-overlay">
                    <Share className="w-3.5 h-3.5 text-on-surface" />
                  </div>
                  <p className="text-on-surface font-semibold pt-0.5">
                    1. Tap the <span className="text-navy">Share</span> button in Safari.
                  </p>
                </div>
                <div className="h-4 border-l border-overlay ml-3 my-1" />
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 shadow-sm border border-overlay">
                    <PlusSquare className="w-3.5 h-3.5 text-on-surface" />
                  </div>
                  <p className="text-on-surface font-semibold pt-0.5">
                    2. Scroll down and tap <span className="text-navy">Add to Home Screen</span>.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleDismiss()}
                className="w-full py-3.5 text-sm font-bold text-muted hover:text-on-surface transition-colors"
              >
                Got it, thanks
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={onInstallClick}
                className="w-full py-3.5 bg-navy text-white rounded-2xl font-bold shadow-lg shadow-navy/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
              <button 
                onClick={() => handleDismiss()}
                className="w-full py-3 text-sm font-bold text-muted hover:text-on-surface transition-colors"
              >
                Not now
              </button>
            </div>
          )}

          {/* Device Indicator (Subtle) */}
          <div className="mt-4 pt-4 border-t border-overlay flex items-center justify-center gap-2">
            <Smartphone className="w-3 h-3 text-muted" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted/60">
              Web App Optimization Active
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
