import { motion } from 'framer-motion'
import { Wrench, Calendar, Gauge, DollarSign, MapPin, Package, ShieldCheck, FileText, Download } from 'lucide-react'
import type { ServiceRecord } from '../../data/maintenanceData'
import { useTranslation } from 'react-i18next'

interface Props {
  records: ServiceRecord[]
  onExport: () => void
}

export default function ServiceHistoryTimeline({ records, onExport }: Props) {
  const { t, i18n } = useTranslation()

  if (records.length === 0) {
    return (
      <div className="bg-surface dark:bg-surface-high/30 rounded-[28px] border border-overlay p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-low dark:bg-surface-highest/40 flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-7 h-7 text-muted/40" />
        </div>
        <h3 className="text-base font-black text-on-surface mb-2">{t('maintenance.history_empty')}</h3>
        <p className="text-sm text-muted max-w-xs mx-auto">
          {t('maintenance.history_empty_desc')}
        </p>
      </div>
    )
  }

  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const totalSpent = records.reduce((s, r) => s + (r.cost || 0), 0)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-black text-on-surface">{records.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{t('maintenance.records')}</p>
          </div>
          <div className="w-px h-8 bg-overlay" />
          <div className="text-center">
            <p className="text-xl font-black text-on-surface">
              {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(totalSpent)}
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted">{t('maintenance.total_spent')}</p>
          </div>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-overlay text-xs font-black text-muted hover:bg-surface-low hover:text-navy transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          {t('maintenance.export')}
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-overlay" />

        <div className="space-y-4">
          {sorted.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4"
            >
              {/* Dot */}
              <div className="flex-shrink-0 w-10 flex items-start justify-center pt-4">
                <div className="w-4 h-4 rounded-full bg-navy border-2 border-surface shadow-sm shadow-navy/20 z-10" />
              </div>

              {/* Card */}
              <div className="flex-1 bg-surface dark:bg-surface-high/30 rounded-[20px] border border-overlay p-4 mb-1">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-[13px] font-black text-on-surface tracking-tight">
                      {t(`maintenance.services.${record.serviceType}`, { defaultValue: record.serviceType })}
                    </h4>
                    {record.shopName && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted" />
                        <span className="text-[11px] text-muted font-medium">{record.shopName}</span>
                      </div>
                    )}
                  </div>
                  {record.cost > 0 && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-sm font-black">{record.cost.toLocaleString(i18n.language)}</span>
                    </div>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    <span className="text-[11px] font-bold text-muted">
                      {new Date(record.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {record.mileage > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-muted" />
                      <span className="text-[11px] font-bold text-muted">
                        {record.mileage.toLocaleString(i18n.language)} {t('maintenance.mileage_unit')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Parts */}
                {record.partsReplaced && (
                  <div className="flex items-start gap-2 mb-2">
                    <Package className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted font-medium">{record.partsReplaced}</p>
                  </div>
                )}

                {/* Warranty */}
                {record.warrantyNotes && (
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{record.warrantyNotes}</p>
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="flex items-start gap-2 pt-2 border-t border-overlay">
                    <FileText className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted italic">{record.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
