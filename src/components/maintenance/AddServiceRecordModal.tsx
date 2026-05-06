import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wrench, Calendar, Gauge, DollarSign, MapPin, FileText, Package, ShieldCheck } from 'lucide-react'
import type { ServiceRecord } from '../../data/maintenanceData'

const SERVICE_TYPES = [
  'Oil Change', 'Tire Rotation', 'Brake Inspection', 'Brake Pad Replacement',
  'Air Filter Replacement', 'Battery Check / Replacement', 'Coolant Flush',
  'Transmission Service', 'Alignment', 'Wheel Balance', 'Spark Plugs',
  'Belt Replacement', 'AC Service', 'Full Inspection', 'Other'
]

interface Props {
  isOpen: boolean
  vehicleId: string
  currentMileage: number
  onClose: () => void
  onSaved: (record: Omit<ServiceRecord, 'id'>) => void
}

export default function AddServiceRecordModal({ isOpen, vehicleId, currentMileage, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    serviceType: '',
    customService: '',
    date: new Date().toISOString().split('T')[0],
    mileage: currentMileage,
    cost: '',
    shopName: '',
    notes: '',
    partsReplaced: '',
    warrantyNotes: '',
  })
  const [saving, setSaving] = useState(false)

  // Side effects: Prevent background scroll and hide bottom nav
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.serviceType) return
    setSaving(true)
    setTimeout(() => {
      onSaved({
        vehicleId,
        serviceType: form.serviceType === 'Other' ? form.customService : form.serviceType,
        date: form.date,
        mileage: form.mileage,
        cost: Number(form.cost) || 0,
        shopName: form.shopName,
        notes: form.notes,
        partsReplaced: form.partsReplaced,
        warrantyNotes: form.warrantyNotes,
      })
      setSaving(false)
      onClose()
      setForm({
        serviceType: '', customService: '',
        date: new Date().toISOString().split('T')[0],
        mileage: currentMileage, cost: '', shopName: '',
        notes: '', partsReplaced: '', warrantyNotes: '',
      })
    }, 600)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-lg bg-surface dark:bg-surface-low rounded-[28px] border border-overlay shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-overlay flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-navy" />
                </div>
                <div>
                  <h2 className="text-base font-black text-on-surface tracking-tight">Add Service Record</h2>
                  <p className="text-[10px] text-muted font-medium">Log completed maintenance</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-low dark:bg-surface-highest/40 flex items-center justify-center hover:bg-surface-high transition-colors"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            {/* Form Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Service Type */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">
                  Service Type *
                </label>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-muted flex-shrink-0" />
                  <select
                    value={form.serviceType}
                    onChange={e => set('serviceType', e.target.value)}
                    className="flex-1 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy"
                  >
                    <option value="">Select service...</option>
                    {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {form.serviceType === 'Other' && (
                  <input
                    type="text"
                    placeholder="Describe the service..."
                    value={form.customService}
                    onChange={e => set('customService', e.target.value)}
                    className="mt-2 w-full bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-navy"
                  />
                )}
              </div>

              {/* Date & Mileage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Date</label>
                  <div className="flex items-center gap-2 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5">
                    <Calendar className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => set('date', e.target.value)}
                      className="flex-1 bg-transparent text-sm font-bold text-on-surface outline-none min-w-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Mileage</label>
                  <div className="flex items-center gap-2 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5">
                    <Gauge className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    <input
                      type="number"
                      value={form.mileage}
                      onChange={e => set('mileage', Number(e.target.value))}
                      className="flex-1 bg-transparent text-sm font-bold text-on-surface outline-none min-w-0"
                    />
                  </div>
                </div>
              </div>

              {/* Cost & Shop */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Cost ($)</label>
                  <div className="flex items-center gap-2 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5">
                    <DollarSign className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    <input
                      type="number"
                      value={form.cost}
                      onChange={e => set('cost', e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-transparent text-sm font-bold text-on-surface outline-none min-w-0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Shop / Mechanic</label>
                  <div className="flex items-center gap-2 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5">
                    <MapPin className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    <input
                      type="text"
                      value={form.shopName}
                      onChange={e => set('shopName', e.target.value)}
                      placeholder="Shop name..."
                      className="flex-1 bg-transparent text-sm font-bold text-on-surface outline-none min-w-0"
                    />
                  </div>
                </div>
              </div>

              {/* Parts Replaced */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Parts Replaced</label>
                <div className="flex items-start gap-2 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5">
                  <Package className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                  <textarea
                    value={form.partsReplaced}
                    onChange={e => set('partsReplaced', e.target.value)}
                    placeholder="e.g. Motorcraft 5W-30 oil, OEM filter..."
                    rows={2}
                    className="flex-1 bg-transparent text-sm font-medium text-on-surface outline-none resize-none min-w-0"
                  />
                </div>
              </div>

              {/* Warranty Notes */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Warranty / Guarantee</label>
                <div className="flex items-start gap-2 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                  <input
                    type="text"
                    value={form.warrantyNotes}
                    onChange={e => set('warrantyNotes', e.target.value)}
                    placeholder="e.g. 12 months / 12,000 miles..."
                    className="flex-1 bg-transparent text-sm font-medium text-on-surface outline-none min-w-0"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1.5">Notes</label>
                <div className="flex items-start gap-2 bg-surface-low dark:bg-surface-highest/30 border border-overlay rounded-xl px-3 py-2.5">
                  <FileText className="w-3.5 h-3.5 text-muted flex-shrink-0 mt-0.5" />
                  <textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Anything else worth noting..."
                    rows={2}
                    className="flex-1 bg-transparent text-sm font-medium text-on-surface outline-none resize-none min-w-0"
                  />
                </div>
              </div>

              {/* Receipt Placeholder */}
              <div className="border-2 border-dashed border-overlay rounded-2xl p-4 text-center">
                <FileText className="w-6 h-6 text-muted/40 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-muted">Receipt Upload</p>
                <p className="text-[10px] text-muted/60">Coming soon — photo receipt storage</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-overlay flex-shrink-0 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-overlay text-sm font-black text-muted hover:bg-surface-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.serviceType}
                className="flex-1 py-3 rounded-2xl bg-navy text-white text-sm font-black uppercase tracking-widest disabled:opacity-50 hover:brightness-110 transition-all active:scale-[0.98]"
              >
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
