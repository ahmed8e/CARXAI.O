"use client"

import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState, memo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  DollarSign, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  Zap,
  Star,
  ShieldCheck,
  Search,
  Wrench,
  Gauge
} from "lucide-react"

// Diagnostic Scenario Data Structure
const scenarioKeys = ['brakes', 'battery', 'engine', 'tires', 'overheating']

const diagnosticScenarios = [
  { id: 1, key: 'brakes', icon: ShieldAlert, color: "bg-red-500", score: 92 },
  { id: 2, key: 'battery', icon: Gauge, color: "bg-blue-500", score: 75 },
  { id: 3, key: 'engine', icon: AlertTriangle, color: "bg-amber-500", score: 88 },
  { id: 4, key: 'tires', icon: ShieldCheck, color: "bg-emerald-500", score: 95 },
  { id: 5, key: 'overheating', icon: Activity, color: "bg-red-600", score: 98 }
]

interface ScenarioMetadata {
  key: string
  score: number
}

// Helper for random entry/exit
function getRandomEdgePoint(containerSize: { width: number; height: number }, edge: 'top' | 'bottom' | 'left' | 'right') {
  const margin = 100 
  switch (edge) {
    case 'top': return { x: Math.random() * containerSize.width, y: -margin }
    case 'bottom': return { x: Math.random() * containerSize.width, y: containerSize.height + margin }
    case 'left': return { x: -margin, y: Math.random() * containerSize.height }
    case 'right': return { x: containerSize.width + margin, y: Math.random() * containerSize.height }
  }
}

interface AnimatedInsightProps {
  scenario: typeof diagnosticScenarios[0]
  isKeyScenario?: boolean
  containerSize: { width: number; height: number }
  onReachCenter?: (metadata: ScenarioMetadata) => void
  onComplete?: () => void
}

function AnimatedInsight({ scenario, isKeyScenario = false, containerSize, onReachCenter, onComplete }: AnimatedInsightProps) {
  const controls = useAnimation()
  const Icon = scenario.icon

  useEffect(() => {
    const animateScenario = async () => {
      if (isKeyScenario) {
        const edges: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right']
        const entryEdge = edges[Math.floor(Math.random() * edges.length)]
        const startPoint = getRandomEdgePoint(containerSize, entryEdge)
        const centerPoint = { x: containerSize.width / 2 - 40, y: containerSize.height / 2 - 40 }

        await controls.set({ x: startPoint.x, y: startPoint.y, scale: 0.6, filter: "blur(4px)", opacity: 0 })
        await controls.start({
          x: centerPoint.x,
          y: centerPoint.y,
          scale: 1.5,
          filter: "blur(0px)",
          opacity: 1,
          transition: { duration: 3, ease: [0.16, 1, 0.3, 1] }
        })

        onReachCenter?.({ 
          key: scenario.key,
          score: scenario.score
        })
        await new Promise(resolve => setTimeout(resolve, 3000))

        const exitEdge = edges[Math.floor(Math.random() * edges.length)]
        const exitPoint = getRandomEdgePoint(containerSize, exitEdge)

        await controls.start({
          x: exitPoint.x,
          y: exitPoint.y,
          scale: 0.6,
          filter: "blur(4px)",
          opacity: 0,
          transition: { duration: 2.5, ease: "easeInOut" }
        })
      } else {
        const animateLoop = async () => {
          while (true) {
            const edges: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right']
            const startEdge = edges[Math.floor(Math.random() * edges.length)]
            const endEdge = edges[Math.floor(Math.random() * edges.length)]
            const start = getRandomEdgePoint(containerSize, startEdge)
            const end = getRandomEdgePoint(containerSize, endEdge)

            await controls.set({ x: start.x, y: start.y, scale: 0.4, opacity: 0 })
            await controls.start({ opacity: 0.3, transition: { duration: 0.5 } })
            await controls.start({
              x: end.x,
              y: end.y,
              transition: { duration: 5 + Math.random() * 5, ease: "linear" }
            })
            await controls.start({ opacity: 0, transition: { duration: 0.5 } })
          }
        }
        animateLoop()
      }
      if (isKeyScenario) onComplete?.()
    }
    animateScenario()
  }, [isKeyScenario, containerSize, controls, scenario, onReachCenter, onComplete])

  return (
    <motion.div
      className="absolute w-20 h-20 md:w-24 md:h-24"
      animate={controls}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      <div className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-colors duration-500",
        scenario.color,
        "bg-opacity-20"
      )}>
        <div className={cn("absolute inset-0 opacity-40", scenario.color)} />
        <div className="relative z-10">
           <Icon className="w-10 h-10 text-white drop-shadow-lg" />
        </div>
      </div>
    </motion.div>
  )
}

const MetadataDisplay = memo(function MetadataDisplay({ metadata }: { metadata: ScenarioMetadata }) {
  const { t } = useTranslation()
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
    >
      <div className="relative w-32 h-32">
        {/* Risk Label - Left */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-0 top-0 -translate-x-full -translate-y-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-2xl min-w-[140px]"
        >
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('landing.hero.cards.risk_label')}</p>
           <p className={cn(
             "text-sm font-black", 
             (metadata.key === 'brakes' || metadata.key === 'overheating') ? 'text-red-600' : 'text-amber-600'
           )}>
             {t(`landing.hero.scenarios.${metadata.key}.risk`)}
           </p>
        </motion.div>

        {/* Estimate - Right */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-2xl min-w-[150px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('landing.hero.cards.estimate')}</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {t(`landing.hero.scenarios.${metadata.key}.estimate`)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Status - Bottom */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-[#0F172A] border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[180px] text-center"
        >
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{t('landing.hero.cards.safe_drive')}</p>
          <p className="text-sm font-black text-white">
            {t(`landing.hero.scenarios.${metadata.key}.status`)}
          </p>
        </motion.div>

        {/* Title - Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 -translate-y-full px-6 py-3 bg-white/95 border border-slate-200 rounded-2xl shadow-xl min-w-[200px] text-center"
        >
           <p className="text-sm font-black text-slate-900">
             {t(`landing.hero.scenarios.${metadata.key}.name`)}
           </p>
        </motion.div>
      </div>
    </motion.div>
  )
})

export const CarSafetySpotlightHero = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [currentMetadata, setCurrentMetadata] = useState<ScenarioMetadata | null>(null)
  const [keyIndex, setKeyIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  const isRTL = i18n.dir() === 'rtl'

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleComplete = useCallback(() => {
    setIsAnimating(false)
    setTimeout(() => {
      setKeyIndex((prev) => (prev + 1) % diagnosticScenarios.length)
      setIsAnimating(true)
    }, 500)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden bg-white">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-blue-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] bg-indigo-50/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
          
          {/* Content Block */}
          <motion.div 
            className={cn(
              "flex flex-col items-center lg:items-start text-center lg:text-start space-y-10",
              isRTL ? "lg:order-2" : "lg:order-1"
            )}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50">
                <div className="w-5 h-5 rounded-full bg-[#0070E0] flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#0070E0] font-black">{t('landing.hero.badge')}</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-[88px] font-black tracking-tight text-slate-900 leading-[1.02]">
                {t('landing.hero.title')}
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-500 max-w-xl font-medium leading-relaxed opacity-90">
                {t('landing.hero.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
              <Button 
                onClick={() => navigate('/login?mode=register')}
                className="w-full sm:w-auto h-auto py-6 px-12 rounded-[24px] bg-[#0070E0] text-white font-black uppercase tracking-widest text-[15px] shadow-[0_20px_40px_-10px_rgba(0,112,224,0.4)] hover:-translate-y-1.5 transition-all duration-500"
              >
                {t('landing.hero.cta_start')}
                <ChevronRight className={cn("w-5 h-5 transition-transform", isRTL ? "rotate-180 mr-1" : "ml-1")} />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto h-auto py-6 px-12 rounded-[24px] border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[15px] hover:border-[#0070E0]/30 transition-all duration-500"
              >
                {t('landing.hero.cta_demo')}
              </Button>
            </div>

            {/* Trust Row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-slate-100 w-full lg:w-full">
              <div className="flex items-center -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-11 h-11 rounded-full border-[3px] border-white bg-slate-100 flex items-center justify-center shadow-md overflow-hidden ring-1 ring-slate-100">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-center sm:text-start">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ms-2 text-xs font-black text-slate-900">4.9/5</span>
                </div>
                <p className="text-[13px] font-bold text-slate-400 tracking-tight">{t('landing.hero.trust_row')}</p>
              </div>
            </div>
          </motion.div>

          {/* Visual Block */}
          <motion.div 
            className={cn(
              "relative flex justify-center items-center",
              isRTL ? "lg:order-1" : "lg:order-2"
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div 
              ref={containerRef}
              className="relative w-full aspect-[4/5] lg:aspect-square max-w-[650px] rounded-[64px] overflow-hidden border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] bg-slate-50/40 backdrop-blur-sm"
            >
              {/* Background Diagnostics */}
              {diagnosticScenarios.slice(2).map((item) => (
                <AnimatedInsight
                  key={`bg-${item.id}`}
                  scenario={item}
                  isKeyScenario={false}
                  containerSize={containerSize}
                />
              ))}

              {/* Key Animated Diagnostic */}
              {isAnimating && (
                <AnimatedInsight
                  key={`key-${diagnosticScenarios[keyIndex].id}`}
                  scenario={diagnosticScenarios[keyIndex]}
                  isKeyScenario={true}
                  containerSize={containerSize}
                  onReachCenter={setCurrentMetadata}
                  onComplete={handleComplete}
                />
              )}

              {/* Spotlight Metadata */}
              <AnimatePresence mode="wait">
                {currentMetadata && (
                  <MetadataDisplay metadata={currentMetadata} />
                )}
              </AnimatePresence>

              {/* Phone Mockup Placeholder / Decorative Element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[600px] border-[12px] border-slate-900 rounded-[54px] bg-white shadow-2xl opacity-10 -z-10 pointer-events-none">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-900 rounded-b-2xl" />
              </div>
              
              {/* Decorative Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-slate-200/50 rounded-full -z-20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] border border-slate-200/30 rounded-full -z-20 pointer-events-none" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
