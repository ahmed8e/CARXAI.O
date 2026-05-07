import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  Car, Plus, Edit2, Trash2, 
  CheckCircle2, Loader2,
  Gauge, Fuel, Settings,
  Hash, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/types'
import VehicleAddModal from '../components/VehicleAddModal'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

export default function Vehicles() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    if (user) fetchVehicles()
  }, [user])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setVehicles((data as Vehicle[]) || [])
    } catch (err) {
      console.error('Error fetching vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (v?: Vehicle) => {
    setEditingVehicle(v ?? null)
    setShowModal(true)
  }

  const handleSaved = () => {
    fetchVehicles()
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('app.vehicles.delete_confirm'))) return
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/vehicles?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete vehicle');
      fetchVehicles()
    } catch (err) {
      console.error('Error deleting vehicle:', err)
    }
  }

  const handleSetDefault = async (v: Vehicle) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'set_default',
          id: v.id
        })
      });
      if (!response.ok) throw new Error('Failed to set default vehicle');
      fetchVehicles()
    } catch (err) {
      console.error('Error setting default:', err)
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-navy animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-navy/70">{t('app.vehicles.manager')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-on-surface italic tracking-tight">{t('app.vehicles.title')}</h1>
          <p className="text-muted/70 font-medium mt-2">{t('app.vehicles.track_desc')}</p>
        </div>

        <motion.button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-navy text-white shadow-xl shadow-navy/20 font-bold hover:scale-[1.02] transition-transform"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" /> {t('app.vehicles.add_button')}
        </motion.button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-navy animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-muted">{t('app.vehicles.loading_garage')}</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-surface dark:bg-surface-low border-2 border-dashed border-overlay rounded-[32px] p-20 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-low dark:bg-surface-high/40 border border-overlay hover:bg-surface-high transition-all text-left font-bold text-on-surface/80 flex items-center justify-between group">
            <Car className="w-10 h-10 text-muted" />
          </div>
          <h3 className="text-2xl font-display font-bold text-on-surface mb-2">{t('app.vehicles.add_first')}</h3>
          <p className="text-muted max-w-md mx-auto mb-8 font-medium">
            {t('app.vehicles.track_desc')}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-8 py-3 rounded-xl bg-navy/5 text-navy font-bold hover:bg-navy/10 transition-colors"
          >
            {t('app.vehicles.add_button')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative bg-surface dark:bg-surface-low rounded-[32px] p-8 border transition-all duration-300 ${
                v.is_default
                  ? 'border-navy shadow-xl shadow-navy/5'
                  : 'border-overlay hover:border-navy/20 hover:shadow-lg hover:shadow-navy/5'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${v.is_default ? 'bg-navy/10' : 'bg-surface-low dark:bg-surface-high'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Car className={`w-7 h-7 ${v.is_default ? 'text-navy' : 'text-muted'}`} />
                </div>
                {v.is_default && (
                  <div className="px-3 py-1 rounded-full bg-navy text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 shadow-lg shadow-navy/20">
                    <ShieldCheck className="w-3 h-3" /> {t('app.vehicles.active_badge')}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-display font-black italic text-on-surface tracking-tight leading-tight">
                  {v.year} {v.make}
                </h3>
                <p className="text-lg font-display font-bold text-muted italic mt-0.5">{v.model}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-muted" />
                  <span className="text-xs font-bold text-on-surface/80 truncate">{v.fuel_type || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted" />
                  <span className="text-xs font-bold text-on-surface/80 truncate">{v.mileage ? `${v.mileage.toLocaleString()} km` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted" />
                  <span className="text-xs font-bold text-on-surface/80 truncate">{v.gearbox || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted" />
                  <span className="text-xs font-bold text-on-surface/80 truncate">{v.plate_number || 'No Plate'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-6 border-t border-overlay">
                {!v.is_default ? (
                  <button
                    onClick={() => handleSetDefault(v)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-low dark:bg-surface-high/40 text-[10px] font-black uppercase tracking-widest text-muted hover:bg-navy hover:text-white transition-all underline-offset-4"
                  >
                    {t('app.vehicles.make_primary')}
                  </button>
                ) : (
                  <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-navy text-center flex items-center justify-center gap-1 font-display">
                    <CheckCircle2 className="w-3 h-3" /> {t('app.vehicles.default')}
                  </div>
                )}
                <button
                  onClick={() => handleOpenModal(v)}
                  className="p-2.5 rounded-xl border border-overlay hover:bg-surface-high dark:hover:bg-surface-high/40 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-muted" />
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="p-2.5 rounded-xl border border-overlay hover:bg-red-500/10 group/del transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4 text-muted group-hover/del:text-red-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Shared Vehicle Add/Edit Modal */}
      <VehicleAddModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
        editingVehicle={editingVehicle}
      />
    </div>
  )
}
