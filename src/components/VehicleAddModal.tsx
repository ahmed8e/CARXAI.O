import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, X, Search, ChevronRight,
  CheckCircle2, AlertCircle, Loader2, RotateCcw,
  Fuel, Settings, Gauge, Hash
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CAR_BRANDS, CAR_MODELS, FUEL_TYPES, GEARBOX_TYPES } from '../lib/car-data'
import type { Database } from '../lib/types'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

type SelectionStep = 'BRAND' | 'MODEL' | 'YEAR' | 'REVIEW'

interface VehicleAddModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called after the vehicle is successfully saved. Receives the new vehicle. */
  onSaved?: (vehicle: Vehicle) => void
  /** If provided, pre-populates the form for editing */
  editingVehicle?: Vehicle | null
}

const defaultForm = (hasVehicles: boolean) => ({
  make: '',
  model: '',
  year: new Date().getFullYear(),
  fuel_type: 'Gasoline',
  engine_type: '',
  gearbox: 'Automatic',
  vin: '',
  plate_number: '',
  mileage: 0,
  is_default: !hasVehicles,
})

export default function VehicleAddModal({ isOpen, onClose, onSaved, editingVehicle }: VehicleAddModalProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<SelectionStep>('BRAND')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState(defaultForm(true))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset / populate form when modal opens
  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setSearchTerm('')

    if (editingVehicle) {
      setFormData({
        make: editingVehicle.make,
        model: editingVehicle.model,
        year: editingVehicle.year,
        fuel_type: editingVehicle.fuel_type || 'Gasoline',
        engine_type: editingVehicle.engine_type || '',
        gearbox: editingVehicle.gearbox || 'Automatic',
        vin: editingVehicle.vin || '',
        plate_number: editingVehicle.plate_number || '',
        mileage: editingVehicle.mileage || 0,
        is_default: editingVehicle.is_default,
      })
      setCurrentStep('REVIEW')
    } else {
      setFormData(defaultForm(true))
      setCurrentStep('BRAND')
    }
  }, [isOpen, editingVehicle])

  const filteredBrands = CAR_BRANDS.filter(b =>
    b.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const availableModels = CAR_MODELS[formData.make] || []
  const filteredModels = availableModels.filter(m =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stepsOrder: SelectionStep[] = ['BRAND', 'MODEL', 'YEAR', 'REVIEW']
  const currentIdx = stepsOrder.indexOf(currentStep)

  const stepLabel = {
    BRAND: 'Select your vehicle brand.',
    MODEL: `Select your ${formData.make} model.`,
    YEAR: `What model year is your ${formData.make} ${formData.model}?`,
    REVIEW: 'Review and confirm your vehicle information.',
  }[currentStep]

  const handleSave = async () => {
    if (!formData.make || !formData.model || !formData.year) {
      setError('Please fill in Brand, Model, and Year.')
      return
    }
    if (!user?.id) {
      setError('You must be logged in to save a vehicle.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          id: editingVehicle?.id
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save vehicle');
      }

      // Since we need the saved vehicle object for onSaved, 
      // but our API currently just returns success, 
      // we'll assume the data we sent is what was saved.
      // In a real scenario, the API should return the saved object.
      const savedVehicle = { ...formData, id: editingVehicle?.id || 'new-id', user_id: user.id } as Vehicle;

      onClose()
      if (savedVehicle) onSaved?.(savedVehicle)
    } catch (err: any) {
      console.error('Error saving vehicle:', err)
      setError(err.message || 'Failed to save vehicle. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-surface-low/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden my-auto border border-slate-200"
        >
          {/* Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-display font-black text-slate-900 italic tracking-tight">
                {editingVehicle ? 'Edit Vehicle' : 'Add Your Vehicle'}
              </h2>
              <p className="text-slate-500 font-medium text-sm mt-1">{stepLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-8 flex gap-1 mb-4">
            {stepsOrder.map((step, idx) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  idx <= currentIdx ? 'bg-blue-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-8 pt-4">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 text-red-600 text-sm font-bold">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* ── BRAND ── */}
            {currentStep === 'BRAND' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search brands..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500/30 focus:bg-white outline-none transition-all font-bold text-slate-900"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => {
                        setFormData({ ...formData, make: brand, model: '' })
                        setCurrentStep('MODEL')
                        setSearchTerm('')
                      }}
                      className="px-4 py-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-500/30 hover:bg-white transition-all text-left font-bold text-slate-700 flex items-center justify-between group"
                    >
                      {brand}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setFormData({ ...formData, make: searchTerm || 'Other', model: '' })
                      setCurrentStep('MODEL')
                      setSearchTerm('')
                    }}
                    className="px-4 py-4 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-500/30 hover:bg-white transition-all text-left font-bold text-blue-600"
                  >
                    Enter "{searchTerm || 'Other'}" manually
                  </button>
                </div>
              </div>
            )}

            {/* ── MODEL ── */}
            {currentStep === 'MODEL' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setCurrentStep('BRAND')}
                    className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    ← Back to Brand
                  </button>
                  <span className="text-sm font-bold text-slate-500">{formData.make}</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${formData.make} models...`}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500/30 focus:bg-white outline-none transition-all font-bold text-slate-900"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredModels.map(model => (
                    <button
                      key={model}
                      onClick={() => {
                        setFormData({ ...formData, model })
                        setCurrentStep('YEAR')
                        setSearchTerm('')
                      }}
                      className="px-4 py-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-500/30 hover:bg-white transition-all text-left font-bold text-slate-700 flex items-center justify-between group"
                    >
                      {model}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setFormData({ ...formData, model: searchTerm || 'Other' })
                      setCurrentStep('YEAR')
                      setSearchTerm('')
                    }}
                    className="px-4 py-4 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-500/30 hover:bg-white transition-all text-left font-bold text-blue-600"
                  >
                    Enter "{searchTerm || 'Other'}" manually
                  </button>
                </div>
              </div>
            )}

            {/* ── YEAR ── */}
            {currentStep === 'YEAR' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setCurrentStep('MODEL')}
                    className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    ← Back to Model
                  </button>
                  <span className="text-sm font-bold text-slate-500">
                    {formData.make} {formData.model}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from({ length: 46 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        setFormData({ ...formData, year })
                        setCurrentStep('REVIEW')
                      }}
                      className="px-4 py-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-500/30 hover:bg-white transition-all text-center font-bold text-slate-700"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── REVIEW ── */}
            {currentStep === 'REVIEW' && (
              <div className="space-y-5">
                {/* Summary card */}
                <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-blue-100">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-display font-black italic text-slate-900 leading-none">
                        {formData.year} {formData.make}
                      </h4>
                      <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                        {formData.model || '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep('BRAND')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Change
                  </button>
                </div>

                {/* Detail fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      <Fuel className="w-3.5 h-3.5" /> Fuel Type
                    </label>
                    <select
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500/30 focus:bg-white outline-none transition-all font-bold text-slate-900 appearance-none text-sm"
                      value={formData.fuel_type}
                      onChange={e => setFormData({ ...formData, fuel_type: e.target.value })}
                    >
                      {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      <Settings className="w-3.5 h-3.5" /> Gearbox
                    </label>
                    <select
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500/30 focus:bg-white outline-none transition-all font-bold text-slate-900 appearance-none text-sm"
                      value={formData.gearbox}
                      onChange={e => setFormData({ ...formData, gearbox: e.target.value })}
                    >
                      {GEARBOX_TYPES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      <Gauge className="w-3.5 h-3.5" /> Mileage (km)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500/30 focus:bg-white outline-none transition-all font-bold text-slate-900 text-sm"
                      value={formData.mileage}
                      onChange={e => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                      <Hash className="w-3.5 h-3.5" /> Plate Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500/30 focus:bg-white outline-none transition-all font-bold text-slate-900 uppercase text-sm"
                      value={formData.plate_number}
                      onChange={e => setFormData({ ...formData, plate_number: e.target.value })}
                      placeholder="e.g. AB-123-CD"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">VIN</label>
                      <span className="text-[10px] font-bold text-blue-600/60 italic uppercase tracking-wider">optional · improves accuracy</span>
                    </div>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-blue-500/30 focus:bg-white outline-none transition-all font-bold text-slate-900 uppercase text-sm"
                      value={formData.vin}
                      onChange={e => setFormData({ ...formData, vin: e.target.value })}
                      placeholder="17-digit VIN number"
                    />
                  </div>
                </div>

                <label
                  htmlFor="is_default_modal"
                    className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    id="is_default_modal"
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                    checked={formData.is_default}
                    onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-700 leading-tight">Use as active vehicle</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">AI Mechanic will use this car for diagnosis</p>
                  </div>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 rounded-3xl border border-slate-200 bg-white text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-[2] py-4 rounded-3xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] hover:bg-blue-700 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    {isSaving
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />}
                    {editingVehicle ? 'Update Vehicle' : 'Confirm & Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
