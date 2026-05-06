import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Thermometer, ShieldAlert, RotateCw, Droplet, Cog, ChevronDown, AlertCircle, BotMessageSquare, Info } from 'lucide-react'
import { FLUID_GUIDE, type FluidInfo } from '../../data/maintenanceData'
import { useNavigate } from 'react-router-dom'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Droplets, Thermometer, ShieldAlert, RotateCw, Droplet, Cog
}

export default function FluidCheckGuide() {
  const [selected, setSelected] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleAskAI = (fluid: FluidInfo) => {
    navigate('/dashboard/ai-mechanic', {
      state: { initialIssue: `Fluid check question: ${fluid.name} — guidance needed` }
    })
  }

  return (
    <div className="bg-surface dark:bg-surface-high/30 rounded-[28px] border border-overlay overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-overlay">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-on-surface tracking-tight">Fluid Check Guide</h3>
            <p className="text-[11px] text-muted font-medium">General guide — verify with your owner's manual</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-2xl px-3 py-2.5">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
            This is a general guide. Locations may vary by vehicle. Always check when the engine is cold unless noted.
          </p>
        </div>
      </div>

      {/* Fluid list */}
      <div className="divide-y divide-overlay/50">
        {FLUID_GUIDE.map((fluid) => {
          const IconComp = ICON_MAP[fluid.icon] || Droplets
          const isOpen = selected === fluid.id

          return (
            <div key={fluid.id}>
              <button
                onClick={() => setSelected(isOpen ? null : fluid.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-low dark:hover:bg-surface-highest/20 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${fluid.color}18` }}>
                  <IconComp className="w-4.5 h-4.5" style={{ color: fluid.color, width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-on-surface">{fluid.name}</p>
                  <p className="text-[11px] text-muted font-medium truncate">{fluid.location}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full border-2 border-white/50 shadow-sm"
                    style={{ background: fluid.color }} />
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4">

                      {/* Normal Color */}
                      <div className="flex items-start gap-3 bg-surface-low dark:bg-surface-highest/30 rounded-2xl p-4">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border border-white/20 shadow-sm"
                          style={{ background: fluid.color }} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted mb-1">Normal Color / Appearance</p>
                          <p className="text-xs text-on-surface font-medium">{fluid.normalColor}</p>
                        </div>
                      </div>

                      {/* How to Check */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted mb-2">How to Check</p>
                        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4">
                          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">{fluid.howToCheck}</p>
                        </div>
                      </div>

                      {/* Warning Signs */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted mb-2">Warning Signs</p>
                        <div className="space-y-1.5">
                          {fluid.warningSigns.map((sign, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-muted font-medium">{sign}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Do Not */}
                      <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 rounded-2xl p-4">
                        <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">⚠ Do Not</p>
                          <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">{fluid.doNot}</p>
                        </div>
                      </div>

                      {/* See a Mechanic */}
                      <div className="flex items-start gap-3 bg-surface-low dark:bg-surface-highest/30 rounded-2xl p-4">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted mb-1">See a Mechanic If</p>
                          <p className="text-xs text-muted font-medium leading-relaxed">{fluid.seeAMechanic}</p>
                        </div>
                      </div>

                      {/* CTA buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAskAI(fluid)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy/5 hover:bg-navy/10 text-navy transition-colors"
                        >
                          <BotMessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black uppercase tracking-wider">Ask AI About This</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
