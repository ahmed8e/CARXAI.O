import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, AlertCircle, Activity, CheckCircle2,
  ShieldCheck, Droplets, Wind, Thermometer,
  BatteryMedium, CircleDot, ShieldAlert
} from 'lucide-react'
import type { MaintenanceStatus, ServiceStatus } from '../../data/maintenanceData'
import { useTranslation } from 'react-i18next'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Droplets, Wind, Thermometer, BatteryMedium, CircleDot, ShieldAlert
}

const STATUS_CONFIG: Record<ServiceStatus, {
  key: string
  bannerBg: string
  bannerText: string
  border: string
  icon: React.ComponentType<any>
}> = {
  overdue: {
    key: 'overdue',
    bannerBg: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20',
    bannerText: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-500/30',
    icon: AlertCircle,
  },
  due: {
    key: 'due_now',
    bannerBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
    bannerText: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
    icon: Activity,
  },
  coming_soon: {
    key: 'coming_soon',
    bannerBg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
    bannerText: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-500/30',
    icon: Activity,
  },
  good: {
    key: 'all_good',
    bannerBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
    bannerText: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-overlay',
    icon: CheckCircle2,
  },
}

interface Props {
  status: MaintenanceStatus
  currentMileage: number
  onLogService: (itemId: string, mileage: number) => void
}

export default function MaintenanceReminderCard({ status, currentMileage, onLogService }: Props) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [logMileage, setLogMileage] = useState(currentMileage)
  const [logging, setLogging] = useState(false)
  const [done, setDone] = useState(false)

  const cfg = STATUS_CONFIG[status.status]
  const StatusIcon = cfg.icon
  const ItemIcon = ICON_MAP[status.item.icon] || Droplets

  const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US'
  const dueDateStr = status.nextDueDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' })

  const handleLog = () => {
    setLogging(true)
    setTimeout(() => {
      onLogService(status.item.id, logMileage)
      setLogging(false)
      setDone(true)
      setExpanded(false)
      setTimeout(() => setDone(false), 3000)
    }, 600)
  }

  return (
    <motion.div
      layout
      className={`bg-surface dark:bg-surface-high/30 rounded-[24px] border overflow-hidden transition-colors duration-200 ${cfg.border}`}
    >
      {/* Status Banner */}
      <div className={`px-5 py-2.5 flex items-center justify-between border-b ${cfg.bannerBg}`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-3.5 h-3.5 ${cfg.bannerText}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.bannerText}`}>
            {t(`maintenance.status_labels.${cfg.key}`)}
          </span>
        </div>
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
          {status.item.intervalMiles > 0
            ? t('maintenance.reminder_card.next_service', { mileage: status.nextDueMileage.toLocaleString() })
            : t('maintenance.reminder_card.due_date', { date: dueDateStr })}
        </span>
      </div>

      {/* Main */}
      <div className="p-5">
        <div
          className="flex items-start justify-between cursor-pointer select-none"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-low dark:bg-surface-highest/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ItemIcon className="w-4.5 h-4.5 text-navy" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-on-surface tracking-tight leading-tight mb-1">
                {status.title}
              </h3>
              <p className="text-xs text-muted font-medium leading-relaxed max-w-xs">
                {status.explanation}
              </p>
              {status.item.intervalMiles > 0 && (
                <p className="text-[10px] text-muted/60 font-bold mt-1">
                  {t('maintenance.reminder_card.est_cost', { low: status.item.costLow, high: status.item.costHigh })}
                </p>
              )}
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 transition-colors ${expanded ? 'bg-navy/10' : 'bg-surface-low dark:bg-surface-highest/40'}`}>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-overlay space-y-4">
                {/* Anti-scam & Risk */}
                <div className="bg-surface-low dark:bg-surface-highest/30 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-on-surface uppercase tracking-wider mb-1">{t('maintenance.reminder_card.anti_scam')}</p>
                      <p className="text-xs text-muted leading-relaxed">{status.item.antiScamNote}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-on-surface uppercase tracking-wider mb-1">{t('maintenance.reminder_card.risk_delayed')}</p>
                      <p className="text-xs text-muted leading-relaxed">{status.item.riskIfDelayed}</p>
                    </div>
                  </div>
                </div>

                {/* Log Service */}
                <div>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                    {t('maintenance.reminder_card.log_title')}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={logMileage}
                      onChange={e => setLogMileage(Number(e.target.value))}
                      className="flex-1 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-navy text-center"
                      placeholder={t('maintenance.reminder_card.mileage_label')}
                    />
                    <button
                      onClick={handleLog}
                      disabled={logging || done}
                      className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-60 hover:brightness-110 transition-all active:scale-95 whitespace-nowrap"
                    >
                      {done ? t('maintenance.reminder_card.logged') : logging ? t('maintenance.reminder_card.saving') : t('maintenance.save_button')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
