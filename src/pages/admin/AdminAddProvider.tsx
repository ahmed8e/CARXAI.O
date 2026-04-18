import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import UserSelect from '../../components/admin/UserSelect'
import { Save, ArrowLeft, Loader2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react'

interface ProviderForm {
  Business_name: string
  Category: string
  Address: string
  City: string
  State: string
  PostalCode: string
  Country: string
  Phone: string
  Website_url: string
  Email: string
  Rating: string
  Review: string
  image1: string
  Lat: string
  Long: string
   BusinessDescription: string
   Working_hour: string
   MapLink: string
   assigned_user_id: string | null
 }
 
const INITIAL: ProviderForm = {
  Business_name: '', Category: 'Mécanicien', Address: '', City: '', State: '', PostalCode: '',
  Country: 'Morocco', Phone: '', Website_url: '', Email: '', Rating: '', Review: '',
  image1: '', Lat: '', Long: '', BusinessDescription: '', Working_hour: '', MapLink: '',
  assigned_user_id: null
}

const CATEGORIES = [
  'Mécanicien', 'Garage automobile', 'Réparation automobile', 'Carrosserie',
  'Service de remorquage', 'Dépannage automobile', 'Transporteur de véhicules',
  'Électricité automobile', 'Pneus et jantes', 'Contrôle technique', 'Other'
]

function Field({ label, name, value, onChange, type = 'text', placeholder = '', required = false, info = '' }: {
  label: string; name: keyof ProviderForm; value: string; onChange: (k: keyof ProviderForm, v: string) => void
  type?: string; placeholder?: string; required?: boolean; info?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-widest text-muted mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 bg-surface-low border border-overlay rounded-xl text-sm text-on-surface focus:border-navy/30 focus:ring-2 focus:ring-navy/10 focus:outline-none transition-all"
      />
      {info && <p className="text-[10px] text-muted mt-1">{info}</p>}
    </div>
  )
}

export default function AdminAddProvider() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditing = Boolean(editId)

  const [form, setForm] = useState<ProviderForm>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    if (!editId) return
    ;(supabase as any).from('service_providers_raw').select('*').eq('id', editId).single().then(({ data }: any) => {
      if (data) {
        setForm({
          Business_name: data.Business_name ?? '',
          Category: data.Category ?? '',
          Address: data.Address ?? '',
          City: data.City ?? '',
          State: data.State ?? '',
          PostalCode: data.PostalCode ?? '',
          Country: data.Country ?? '',
          Phone: data.Phone ?? '',
          Website_url: data.Website_url ?? '',
          Email: data.Email ?? '',
          Rating: data.Rating ? String(data.Rating) : '',
          Review: data.Review ? String(data.Review) : '',
          image1: data.image1 ?? '',
          Lat: data.Lat ?? '',
          Long: data.Long ?? '',
          BusinessDescription: data.BusinessDescription ?? '',
          Working_hour: data.Working_hour ?? '',
          MapLink: data.MapLink ?? '',
          assigned_user_id: data.assigned_user_id ?? null,
        })
      }
      setLoading(false)
    })
  }, [editId])

  const handleChange = (key: keyof ProviderForm, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.Business_name.trim()) { setError('Provider name is required.'); return }
    if (!form.City.trim()) { setError('City is required.'); return }

    setSaving(true)
    setError('')

    const payload = {
      ...form,
      Rating: form.Rating ? parseFloat(form.Rating) : null,
      Review: form.Review ? parseInt(form.Review) : null,
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: isEditing ? 'update' : 'insert',
          id: editId,
          provider: payload
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save provider')

      setSaved(true)
      setTimeout(() => { navigate('/admin/providers') }, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate('/admin/providers')}
          className="w-9 h-9 rounded-xl bg-white border border-overlay flex items-center justify-center text-muted hover:text-navy hover:border-navy/20 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-black text-on-surface tracking-tight">
            {isEditing ? 'Edit Provider' : 'Add New Provider'}
          </h1>
          <p className="text-sm text-muted">{isEditing ? 'Update provider details in the network' : 'Manually add a new provider to the Carxai network'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-overlay p-6 space-y-4">
          <h2 className="text-sm font-display font-black text-on-surface mb-1">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Provider Name" name="Business_name" value={form.Business_name} onChange={handleChange} required placeholder="e.g. Garage Excellence" />
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-muted mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <select value={form.Category} onChange={e => handleChange('Category', e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-low border border-overlay rounded-xl text-sm text-on-surface focus:border-navy/30 focus:outline-none transition-all">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Field label="Business Description" name="BusinessDescription" value={form.BusinessDescription} onChange={handleChange} placeholder="Short description of services offered" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Working Hours" name="Working_hour" value={form.Working_hour} onChange={handleChange} placeholder="Mon–Fri 8am–6pm" />
            <UserSelect
              selectedUserId={form.assigned_user_id}
              onSelect={(uid) => setForm(f => ({ ...f, assigned_user_id: uid }))}
              label="Assigned User"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl border border-overlay p-6 space-y-4">
          <h2 className="text-sm font-display font-black text-on-surface mb-1">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" name="Phone" value={form.Phone} onChange={handleChange} type="tel" placeholder="+212 5xx-xxxxxx" />
            <Field label="Email" name="Email" value={form.Email} onChange={handleChange} type="email" placeholder="info@provider.com" />
            <Field label="Website URL" name="Website_url" value={form.Website_url} onChange={handleChange} type="url" placeholder="https://..." />
            <Field label="Google Maps Link" name="MapLink" value={form.MapLink} onChange={handleChange} type="url" placeholder="https://maps.google.com/..." />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-overlay p-6 space-y-4">
          <h2 className="text-sm font-display font-black text-on-surface mb-1">Location</h2>
          <Field label="Address" name="Address" value={form.Address} onChange={handleChange} placeholder="Street address" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Field label="City" name="City" value={form.City} onChange={handleChange} required placeholder="Casablanca" />
            </div>
            <Field label="Postal Code" name="PostalCode" value={form.PostalCode} onChange={handleChange} placeholder="20000" />
            <Field label="Country" name="Country" value={form.Country} onChange={handleChange} placeholder="Morocco" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" name="Lat" value={form.Lat} onChange={handleChange} type="text"
              placeholder="33.5731" info="Required for distance sorting" />
            <Field label="Longitude" name="Long" value={form.Long} onChange={handleChange} type="text"
              placeholder="-7.5898" info="Required for distance sorting" />
          </div>
          <div className="flex items-start gap-2 px-3 py-2.5 bg-navy/5 rounded-xl">
            <MapPin className="w-4 h-4 text-navy mt-0.5 shrink-0" />
            <p className="text-xs text-navy/70 font-medium">Latitude and Longitude are critical for showing this provider in the nearby help experience. Get them from <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="underline font-bold">Google Maps</a>.</p>
          </div>
        </div>

        {/* Media & Social */}
        <div className="bg-white rounded-2xl border border-overlay p-6 space-y-4">
          <h2 className="text-sm font-display font-black text-on-surface mb-1">Media & Ratings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Image URL" name="image1" value={form.image1} onChange={handleChange} type="url" placeholder="https://image.com/provider.jpg" />
            <div /> {/* spacer */}
            <Field label="Rating" name="Rating" value={form.Rating} onChange={handleChange} type="number" placeholder="4.5" info="0–5 scale" />
            <Field label="Review Count" name="Review" value={form.Review} onChange={handleChange} type="number" placeholder="123" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Success */}
        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 font-bold">Provider saved! Redirecting…</p>
          </motion.div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/providers')}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-white border border-overlay text-muted hover:text-on-surface hover:border-on-surface/20 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={saving || saved}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-navy text-white shadow-sm shadow-navy/20 hover:bg-navy/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Add Provider'}
          </button>
        </div>
      </form>
    </div>
  )
}
