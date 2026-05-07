import { motion } from 'framer-motion'
import { Shield, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import type { HealthCategory } from '../../data/maintenanceData'
import { useTranslation } from 'react-i18next'

interface Props {
  score: number
  labelKey: string
  categories: HealthCategory[]
}

const STATUS_COLORS = {
  excellent: { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500/20' },
  good: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500/20' },
  attention: { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-500/20' },
  risk: { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-500/20' },
}

const CAT_KEY_MAP: Record<string, string> = {
  'Engine': 'engine',
  'Brakes': 'brakes',
  'Tires': 'tires',
  'Fluids': 'fluids',
  'Battery / Electrical': 'battery',
  'Maintenance Consistency': 'consistency'
}

export default function HealthScoreCard({ score, categories }: Props) {
  const { t } = useTranslation()
  const overall = score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 40 ? 'attention' : 'risk'
  const colors = STATUS_COLORS[overall]
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-surface dark:bg-surface-high/40 rounded-[28px] border border-overlay p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-navy" />
        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">{t('maintenance.health_card.title')}</h3>
      </div>

      {/* Score Ring */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-[128px] h-[128px] flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
              className="text-surface-low dark:text-surface-highest/30" />
            <motion.circle
              cx="60" cy="60" r="54" fill="none"
              strokeWidth="8" strokeLinecap="round"
              className={colors.text}
              stroke="currentColor"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-on-surface tracking-tight">{score}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.bg}/10 ${colors.text} mb-2`}>
            {overall === 'excellent' || overall === 'good' ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : overall === 'attention' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px] font-black uppercase tracking-wider">
              {t(`maintenance.status_labels.${overall}`)}
            </span>
          </div>
          <p className="text-xs text-muted font-medium leading-relaxed">
            {t(`maintenance.health_card.messages.${overall}`)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2.5">
        {categories.map((cat) => {
          const pct = Math.round((cat.score / cat.maxScore) * 100)
          const catColors = STATUS_COLORS[cat.status]
          const catKey = CAT_KEY_MAP[cat.label] || 'other'
          return (
            <div key={cat.label} className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-muted w-[120px] truncate">
                {catKey !== 'other' ? t(`maintenance.health_card.categories.${catKey}`) : cat.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface-low dark:bg-surface-highest/30 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${catColors.bg}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span className={`text-[10px] font-black ${catColors.text} w-8 text-right`}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
