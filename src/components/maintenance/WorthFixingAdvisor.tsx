import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Car, Gauge, DollarSign, Wrench, AlertCircle, CheckCircle2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { evaluateRepair, type RepairDecision } from '../../data/maintenanceData'
import { useTranslation } from 'react-i18next'

const CONDITIONS = ['excellent', 'good', 'fair', 'poor']
const REPAIR_TYPES = [
  'engine', 'brake', 'transmission', 'suspension',
  'ac', 'electrical', 'exhaust', 'timing',
  'gasket', 'radiator', 'tires', 'body', 'other'
]

const VERDICT_CONFIG: Record<RepairDecision['verdict'], {
  icon: React.ComponentType<any>
  bg: string
  text: string
  border: string
}> = {
  worth_fixing: { icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30' },
  second_opinion: { icon: RefreshCw, bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30' },
  not_worth: { icon: TrendingDown, bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-500/30' },
  consider_selling: { icon: TrendingUp, bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/30' },
}

export default function WorthFixingAdvisor() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    make: '', model: '', year: new Date().getFullYear(),
    mileage: 0, carValue: 0, repairCost: 0,
    repairType: '', condition: 'good', yearsToKeep: 3,
  })
  const [result, setResult] = useState<RepairDecision | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleCheck = () => {
    if (!form.repairType || !form.carValue || !form.repairCost) return
    setLoading(true)
    setTimeout(() => {
      const decision = evaluateRepair({
        carValue: form.carValue,
        repairCost: form.repairCost,
        mileage: form.mileage,
        carYear: form.year,
        repairType: form.repairType,
        condition: form.condition,
        yearsToKeep: form.yearsToKeep,
      })
      setResult(decision)
      setLoading(false)
    }, 800)
  }

  const ratio = form.carValue > 0 ? Math.round((form.repairCost / form.carValue) * 100) : 0

  return (
    <div className="bg-surface dark:bg-surface-high/30 rounded-[28px] border border-overlay overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-overlay">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-on-surface tracking-tight">{t('maintenance.advisor_tool.title')}</h3>
            <p className="text-[11px] text-muted font-medium">{t('maintenance.advisor_tool.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Car Details */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">{t('maintenance.advisor_tool.make')}</label>
            <input type="text" placeholder="Toyota"
              value={form.make} onChange={e => set('make', e.target.value)}
              className="w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">{t('maintenance.advisor_tool.model')}</label>
            <input type="text" placeholder="Camry"
              value={form.model} onChange={e => set('model', e.target.value)}
              className="w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">{t('maintenance.advisor_tool.year')}</label>
            <input type="number" placeholder="2018"
              value={form.year || ''} onChange={e => set('year', Number(e.target.value))}
              className="w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy" />
          </div>
        </div>

        {/* Mileage & Value */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">
              <Gauge className="inline w-3 h-3 mr-1" />{t('maintenance.advisor_tool.mileage')}
            </label>
            <input type="number" placeholder="95,000"
              value={form.mileage || ''} onChange={e => set('mileage', Number(e.target.value))}
              className="w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">
              <Car className="inline w-3 h-3 mr-1" />{t('maintenance.advisor_tool.car_value')}
            </label>
            <input type="number" placeholder="8,500"
              value={form.carValue || ''} onChange={e => set('carValue', Number(e.target.value))}
              className="w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy" />
          </div>
        </div>

        {/* Repair Type & Cost */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">
              <Wrench className="inline w-3 h-3 mr-1" />{t('maintenance.advisor_tool.repair_type')}
            </label>
            <select value={form.repairType} onChange={e => set('repairType', e.target.value)}
              className="w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy">
              <option value="">{t('maintenance.advisor_tool.select_repair')}</option>
              {REPAIR_TYPES.map(type => (
                <option key={type} value={type}>
                  {t(`maintenance.advisor_tool.repair_types.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">
              <DollarSign className="inline w-3 h-3 mr-1" />{t('maintenance.advisor_tool.repair_quote')}
            </label>
            <input type="number" placeholder="1,200"
              value={form.repairCost || ''} onChange={e => set('repairCost', Number(e.target.value))}
              className="w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy" />
          </div>
        </div>

        {/* Ratio indicator */}
        {form.carValue > 0 && form.repairCost > 0 && (
          <div className="bg-surface-low dark:bg-surface-highest/30 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold text-muted">{t('maintenance.advisor_tool.repair_vs_value')}</span>
            <span className={`text-sm font-black ${ratio > 75 ? 'text-red-500' : ratio > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {ratio}%
            </span>
          </div>
        )}

        {/* Condition & Keep Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">{t('maintenance.advisor_tool.car_condition')}</label>
            <div className="flex gap-1.5 flex-wrap">
              {CONDITIONS.map(c => (
                <button key={c}
                  onClick={() => set('condition', c)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                    form.condition === c
                      ? 'bg-navy text-white'
                      : 'bg-surface-low dark:bg-surface-highest/30 border border-overlay text-muted hover:border-navy/30'
                  }`}>
                  {t(`maintenance.advisor_tool.conditions.${c}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">
              {t('maintenance.advisor_tool.plan_to_keep')}
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 5, '5+'].map(y => (
                <button key={y}
                  onClick={() => set('yearsToKeep', y === '5+' ? 6 : Number(y))}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                    (y === '5+' ? form.yearsToKeep >= 6 : form.yearsToKeep === Number(y))
                      ? 'bg-navy text-white'
                      : 'bg-surface-low dark:bg-surface-highest/30 border border-overlay text-muted hover:border-navy/30'
                  }`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleCheck}
          disabled={loading || !form.repairType || !form.carValue || !form.repairCost}
          className="w-full py-3.5 bg-navy text-white rounded-2xl font-black uppercase tracking-widest text-sm disabled:opacity-50 hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-navy/20"
        >
          {loading ? t('maintenance.advisor_tool.analyzing') : t('maintenance.advisor_tool.check_decision')}
        </button>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`rounded-[20px] border p-5 ${VERDICT_CONFIG[result.verdict].border} ${VERDICT_CONFIG[result.verdict].bg}`}
            >
              <div className={`flex items-center gap-2 mb-3 ${VERDICT_CONFIG[result.verdict].text}`}>
                {(() => {
                  const V = VERDICT_CONFIG[result.verdict].icon
                  return <V className="w-5 h-5" />
                })()}
                <span className="text-base font-black">{t(result.titleKey)}</span>
              </div>
              <ul className="space-y-2">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted font-medium leading-relaxed">{t(r.key, r.params)}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
