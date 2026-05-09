import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Snowflake, MapPin, AlertCircle, Info, Zap, BotMessageSquare } from 'lucide-react'
import type { SeasonalChecklistData, ChecklistItem } from '../../data/maintenanceData'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sun, Snowflake, MapPin
}

const WARNING_CONFIG = {
  critical: { key: 'critical', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', icon: AlertCircle },
  warning: { key: 'warning', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Zap },
  info: { key: 'info', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Info },
}

interface Props {
  checklist: SeasonalChecklistData
  onUpdate: (checklistId: string, items: ChecklistItem[]) => void
}

export default function SeasonalChecklist({ checklist, onUpdate }: Props) {
  const { t } = useTranslation()
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items)
  const [expanded, setExpanded] = useState(true)
  const navigate = useNavigate()

  const CheckIcon = ICON_MAP[checklist.icon] || Sun
  const done = items.filter(i => i.checked).length
  const total = items.length
  const pct = Math.round((done / total) * 100)

  const toggle = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    setItems(updated)
    onUpdate(checklist.id, updated)
  }

  const handleAskAI = (item: ChecklistItem) => {
    navigate('/dashboard/ai-mechanic', {
      state: { initialIssue: `${t(checklist.titleKey)}: ${t(item.labelKey)} — ${t(item.descriptionKey)}` }
    })
  }

  return (
    <div className="bg-surface dark:bg-surface-high/30 rounded-[28px] border border-overlay overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer select-none"
        style={{ borderBottom: expanded ? '1px solid var(--color-overlay)' : 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${checklist.color}18` }}>
            <CheckIcon className="w-5 h-5" style={{ color: checklist.color }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-on-surface tracking-tight">{t(checklist.titleKey)}</h3>
            <p className="text-[10px] text-muted font-medium">
              {t('maintenance.seasonal_tool.completed', { done, total })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-9 h-9">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor"
                strokeWidth="3" className="text-surface-low dark:text-surface-highest/40" />
              <circle cx="18" cy="18" r="14" fill="none"
                stroke={checklist.color} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 87.96} 87.96`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-on-surface">
              {pct}%
            </span>
          </div>

          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="w-6 h-6 rounded-full bg-surface-low dark:bg-surface-highest/30 flex items-center justify-center"
          >
            <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="divide-y divide-overlay/50">
          {items.map((item) => {
            const warnCfg = WARNING_CONFIG[item.warningLevel]
            const WarnIcon = warnCfg.icon
            return (
              <div key={item.id} className={`p-4 transition-colors ${item.checked ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(item.id)}
                    className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      item.checked
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-overlay hover:border-navy bg-transparent'
                    }`}
                  >
                    {item.checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[13px] font-black text-on-surface ${item.checked ? 'line-through' : ''}`}>
                        {t(item.labelKey)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${warnCfg.bg} ${warnCfg.color}`}>
                        <WarnIcon className="w-2.5 h-2.5" />
                        {t(`maintenance.seasonal_tool.warning_levels.${warnCfg.key}`)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-medium leading-relaxed">{t(item.descriptionKey)}</p>
                  </div>

                  {/* Ask AI */}
                  <button
                    onClick={() => handleAskAI(item)}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-navy/5 hover:bg-navy/10 text-navy transition-colors"
                  >
                    <BotMessageSquare className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider">{t('maintenance.seasonal_tool.ask_ai')}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
