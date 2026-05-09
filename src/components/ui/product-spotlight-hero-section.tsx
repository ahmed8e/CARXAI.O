"use client"

import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  DollarSign, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  Gauge,
  Wrench
} from "lucide-react"

// Adapted data for Car Safety
const carSafetyInsights = [
  // KEY INSIGHTS - cards that will be spotlighted (1-5)
  { 
    id: 1, 
    name: "Risk Level: Critical", 
    value: "HIGH", 
    score: 92, 
    icon: ShieldAlert,
    color: "bg-red-500",
    image: "https://images.unsplash.com/photo-1486006396113-ad75047821e1?q=80&w=1760&auto=format&fit=crop"
  },
  { 
    id: 2, 
    name: "Repair Cost Estimate", 
    value: "$185 - $320", 
    score: 85, 
    icon: DollarSign,
    color: "bg-blue-500",
    image: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=1760&auto=format&fit=crop"
  },
  { 
    id: 3, 
    name: "Brake System Issue", 
    value: "Immediate Attention", 
    score: 94, 
    icon: AlertTriangle,
    color: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=1760&auto=format&fit=crop"
  },
  { 
    id: 4, 
    name: "AI Diagnosis Complete", 
    value: "Report Ready", 
    score: 98, 
    icon: CheckCircle,
    color: "bg-emerald-500",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1760&auto=format&fit=crop"
  },
  { 
    id: 5, 
    name: "Engine Health Scan", 
    value: "Minor Concerns", 
    score: 88, 
    icon: Activity,
    color: "bg-indigo-500",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1760&auto=format&fit=crop"
  },

  // BACKGROUND ELEMENTS (6-15)
  { id: 6, name: "Tire Pressure", value: "32 PSI", score: 90, icon: Gauge, color: "bg-slate-400", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1760&auto=format&fit=crop" },
  { id: 7, name: "Oil Life", value: "15%", score: 75, icon: Wrench, color: "bg-orange-400", image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1760&auto=format&fit=crop" },
  { id: 8, name: "Battery Status", value: "Healthy", score: 95, icon: Activity, color: "bg-emerald-400", image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=1760&auto=format&fit=crop" },
]

const keyInsights = carSafetyInsights.slice(0, 5)
const backgroundInsights = carSafetyInsights.slice(5)

interface InsightMetadata {
  name: string
  value: string
  score: number
}

// Helper function to generate random entry/exit points
function getRandomEdgePoint(containerSize: { width: number; height: number }, edge: 'top' | 'bottom' | 'left' | 'right') {
  const margin = 100 
  switch (edge) {
    case 'top': return { x: Math.random() * containerSize.width, y: -margin }
    case 'bottom': return { x: Math.random() * containerSize.width, y: containerSize.height + margin }
    case 'left': return { x: -margin, y: Math.random() * containerSize.height }
    case 'right': return { x: containerSize.width + margin, y: Math.random() * containerSize.height }
  }
}

// Helper function to create curved path
function createCurvedPath(start: { x: number; y: number }, end: { x: number; y: number }, containerSize: { width: number; height: number }) {
  const curveVariation = 40 + Math.random() * 80
  const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * curveVariation
  const midY = (start.y + end.y) / 2 + (Math.random() - 0.5) * curveVariation
  return [start, { x: midX, y: midY }, end]
}

interface AnimatedInsightProps {
  insight: typeof carSafetyInsights[0]
  isKeyInsight?: boolean
  containerSize: { width: number; height: number }
  onReachCenter?: (metadata: InsightMetadata) => void
  onComplete?: () => void
}

function AnimatedInsight({ insight, isKeyInsight = false, containerSize, onReachCenter, onComplete }: AnimatedInsightProps) {
  const controls = useAnimation()
  const Icon = insight.icon

  useEffect(() => {
    const animateInsight = async () => {
      if (isKeyInsight) {
        const edges: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right']
        const entryEdge = edges[Math.floor(Math.random() * edges.length)]
        const startPoint = getRandomEdgePoint(containerSize, entryEdge)
        const centerPoint = { x: containerSize.width / 2 - 48, y: containerSize.height / 2 - 48 }

        await controls.set({ x: startPoint.x, y: startPoint.y, scale: 0.6, filter: "blur(4px)", opacity: 0 })
        await controls.start({
          x: centerPoint.x,
          y: centerPoint.y,
          scale: 1.6,
          filter: "blur(0px)",
          opacity: 1,
          transition: { duration: 3, ease: [0.16, 1, 0.3, 1] }
        })

        onReachCenter?.({ name: insight.name, value: insight.value, score: insight.score })
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
            const entryEdge = edges[Math.floor(Math.random() * edges.length)]
            const exitEdge = edges[Math.floor(Math.random() * edges.length)]
            const startPoint = getRandomEdgePoint(containerSize, entryEdge)
            const endPoint = getRandomEdgePoint(containerSize, exitEdge)
            const path = createCurvedPath(startPoint, endPoint, containerSize)

            await controls.set({ x: startPoint.x, y: startPoint.y, scale: 0.4, opacity: 0 })
            await controls.start({ opacity: 0.4, transition: { duration: 0.5 } })

            for (let i = 1; i < path.length; i++) {
              await controls.start({
                x: path[i].x,
                y: path[i].y,
                transition: { duration: 3 + Math.random() * 3, ease: "linear" }
              })
            }
            await controls.start({ opacity: 0, transition: { duration: 0.5 } })
          }
        }
        animateLoop()
      }
      if (isKeyInsight) onComplete?.()
    }
    animateInsight()
  }, [isKeyInsight, containerSize, controls, insight, onReachCenter, onComplete])

  return (
    <motion.div
      className="absolute w-20 h-20 md:w-24 md:h-24"
      animate={controls}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      <div className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-colors duration-500",
        insight.color,
        "bg-opacity-20"
      )}>
        <div className={cn("absolute inset-0 opacity-40", insight.color)} />
        <div className="relative z-10 p-4">
           <Icon className={cn("w-10 h-10 md:w-12 md:h-12", "text-white drop-shadow-lg")} />
        </div>
        {/* Subtle glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  )
}

function CircularProgress({ value, size = 40 }: { value: number; size?: number }) {
  const percentage = Math.min(Math.max(value, 0), 100)
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 dark:border-slate-800" />
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, #10b981 0deg ${(percentage * 3.6)}deg, transparent ${(percentage * 3.6)}deg 360deg)`,
          mask: `radial-gradient(circle at center, transparent ${size/2 - 3}px, black ${size/2 - 2}px)`,
          WebkitMask: `radial-gradient(circle at center, transparent ${size/2 - 3}px, black ${size/2 - 2}px)`
        }}
      />
      <span className="relative text-[10px] font-black text-emerald-600 dark:text-emerald-400 z-10">
        {value}
      </span>
    </div>
  )
}

const MetadataDisplay = memo(function MetadataDisplay({ metadata }: { metadata: InsightMetadata }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
    >
      <div className="relative w-32 h-32">
        {/* Left Bubble: Value */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-2xl min-w-[140px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Estimate</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{metadata.value}</p>
            </div>
          </div>
        </motion.div>

        {/* Right Bubble: Health Score */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-4 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <CircularProgress value={metadata.score} />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Health Score</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{metadata.score}/100</p>
            </div>
          </div>
        </motion.div>

        {/* Top Bubble: Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-[#0F172A] border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[220px] text-center"
        >
          <p className="text-sm font-black text-white tracking-tight leading-tight">
            {metadata.name}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
})

export function ProductSpotlightHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [currentMetadata, setCurrentMetadata] = useState<InsightMetadata | null>(null)
  const [keyIndex, setKeyIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

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
      setKeyIndex((prev) => (prev + 1) % keyInsights.length)
      setIsAnimating(true)
    }, 500)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden bg-white">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-blue-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] bg-indigo-50/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column - Content */}
          <motion.div 
            className="space-y-10 order-2 lg:order-1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/50">
                <div className="w-5 h-5 rounded-full bg-[#0070E0] flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#0070E0] font-black">AI CAR MECHANIC</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.05]">
                Understand your <span className="text-[#0070E0]">car problem</span> before you overpay.
              </h1>
              
              <p className="text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
                Car Safety helps drivers understand warning lights, repair urgency, and possible overcharging before visiting a mechanic. Get clear answers in seconds.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-auto py-5 px-10 rounded-[20px] bg-[#0070E0] text-white font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-10px_rgba(0,112,224,0.4)] hover:-translate-y-1 hover:shadow-[0_25px_50px_-10px_rgba(0,112,224,0.5)] transition-all duration-500"
              >
                Start Free Diagnosis
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              
              <Button 
                variant="outline"
                size="lg" 
                className="w-full sm:w-auto h-auto py-5 px-10 rounded-[20px] border-slate-200 text-slate-600 font-black uppercase tracking-widest text-sm hover:border-[#0070E0]/30 hover:text-[#0070E0] transition-all duration-500"
              >
                See How It Works
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-8 pt-4 border-t border-slate-100">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Trusted By</p>
                 <div className="flex items-center -space-x-3">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 shadow-sm overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                     </div>
                   ))}
                 </div>
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Average Rating</p>
                 <div className="flex items-center gap-1">
                   <CheckCircle className="w-4 h-4 text-emerald-500" />
                   <span className="text-sm font-black text-slate-900 tracking-tight">4.9/5 stars</span>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Right Column - Diagnostic Field */}
          <motion.div 
            className="relative order-1 lg:order-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div 
              ref={containerRef}
              className="relative w-full h-[500px] lg:h-[650px] rounded-[48px] overflow-hidden border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] bg-slate-50/30 backdrop-blur-sm"
            >
              {/* Animated Insights */}
              {backgroundInsights.map((item) => (
                <AnimatedInsight
                  key={`bg-${item.id}`}
                  insight={item}
                  isKeyInsight={false}
                  containerSize={containerSize}
                />
              ))}

              {isAnimating && (
                <AnimatedInsight
                  key={`key-${keyInsights[keyIndex].id}`}
                  insight={keyInsights[keyIndex]}
                  isKeyInsight={true}
                  containerSize={containerSize}
                  onReachCenter={setCurrentMetadata}
                  onComplete={handleComplete}
                />
              )}

              {/* Metadata Spotlight */}
              <AnimatePresence mode="wait">
                {currentMetadata && (
                  <MetadataDisplay metadata={currentMetadata} />
                )}
              </AnimatePresence>

              {/* Ambient Decorative Shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-slate-200/50 rounded-full -z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-slate-200/30 rounded-full -z-10" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
