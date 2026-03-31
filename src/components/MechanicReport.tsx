import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Download, Copy, Share2,
  Truck, ShieldAlert, CheckCircle2, User,
  Car, Info, AlertTriangle, FileText,
  Calendar, Hash, Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Message, DiagnosticResult, Database } from '../lib/types'
import { getUrgencyBadge } from '../lib/utils'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

interface MechanicReportProps {
  isOpen: boolean
  onClose: () => void
  user: any
  diagnosis: DiagnosticResult
  messages: Message[]
  activeVehicle?: Vehicle | null
}

export default function MechanicReport({ isOpen, onClose, user, diagnosis, messages, activeVehicle }: MechanicReportProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(activeVehicle || null)
  const [loading, setLoading] = useState(true)
  const [reportId] = useState(() => `CX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`)
  const [date] = useState(() => new Date().toLocaleString())

  useEffect(() => {
    if (isOpen && user) {
      fetchDetails()
    }
  }, [isOpen, user, activeVehicle])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      // Fetch Profile
      const { data: profileVal } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      // Fetch Settings (for phone)
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileVal) {
        setProfile({
          ...(profileVal as object),
          phone: (settings as any)?.phone_number || user.user_metadata?.phone_number || 'Not provided'
        })
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          phone: (settings as any)?.phone_number || user.user_metadata?.phone_number || 'Not provided'
        })
      }

      if (activeVehicle) {
        setVehicle(activeVehicle)
      } else {
        // Fetch Vehicle (latest one) if none provided
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (vehicles && vehicles.length > 0) {
          setVehicle(vehicles[0] as Vehicle)
        }
      }
    } catch (err) {
      console.error('Error fetching report details:', err)
    } finally {
      setLoading(false)
    }
  }

  const copySummary = () => {
    const text = `Mechanic Report ${reportId}\nIssue: ${diagnosis.issueName}\nUrgency: ${diagnosis.urgencyLevel}\nDiagnosis: ${diagnosis.likelyCause}\nNext Step: ${diagnosis.nextStep}`
    navigator.clipboard.writeText(text)
    alert('Summary copied to clipboard!')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-full overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[48px] shadow-2xl flex flex-col"
        >
          {/* Header Action Bar */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Mechanic Report Preview</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 pb-24">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-navy animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Assembling Report Data...</p>
              </div>
            ) : (
              <>
                {/* 1. Official Header */}
                <div className="flex flex-col md:flex-row justify-between gap-8 pb-12 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-display font-black text-2xl italic text-slate-900 dark:text-white">Carxai</span>
                    </div>
                    <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">Mechanic Report</h1>
                  </div>
                  <div className="text-left md:text-right space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      <Hash className="w-3 h-3" /> {reportId}
                    </div>
                    <p className="text-xs font-bold text-slate-400 flex items-center justify-start md:justify-end gap-2">
                       <Calendar className="w-3.5 h-3.5" /> {date}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  {/* 2. Customer Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Customer Information</h3>
                    </div>
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Full Name</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{profile?.full_name || user.email?.split('@')[0] || 'Member'}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Phone</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{profile?.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Email</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Vehicle Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Car className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Vehicle Information</h3>
                    </div>
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                      {vehicle ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Brand & Model</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.make} {vehicle.model}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Year</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.year}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Engine Type</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.engine_type || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Gearbox</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.gearbox || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Mileage</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Plate Number</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{vehicle.plate_number || 'N/A'}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 italic">No vehicle data available</p>
                          <button className="text-[10px] font-black text-navy uppercase tracking-widest">Connect Vehicle</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Problem & 5. AI Diagnosis */}
                <div className="grid md:grid-cols-2 gap-12 pt-4">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Info className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Problem Summary</h3>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{messages.find(m => m.role === 'user')?.content || 'User reported vehicle issue'}"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-navy/10 text-navy flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">AI Mechanic Diagnosis</h3>
                    </div>
                    <div className="bg-navy p-6 rounded-3xl text-white shadow-xl shadow-navy/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-125 transition-transform" />
                      <div className="relative z-10">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4 bg-white/20 text-white`}>
                          {getUrgencyBadge(diagnosis.urgencyLevel)} Urgency
                        </div>
                        <h4 className="text-xl font-display font-black italic tracking-tight mb-2">{diagnosis.issueName}</h4>
                        <p className="text-xs font-medium text-blue-100 leading-relaxed">{diagnosis.likelyCause}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Recommended Next Steps */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Recommended Next Steps</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Actionable Step</p>
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{diagnosis.nextStep}</p>
                    </div>
                    {diagnosis.followUp && (
                      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Follow-up Action</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{diagnosis.followUp}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. Attached Media (Mock) */}
                {messages.some(m => m.imageUrl) && (
                  <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Attached Evidence</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {messages.filter(m => m.imageUrl).map((m, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-105">
                          <img src={m.imageUrl} alt="Diagnosis Evidence" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Disclaimer */}
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Disclaimer</h5>
                    <p className="text-xs text-red-800/70 dark:text-red-400/70 font-medium leading-relaxed">
                      This is a preliminary AI-generated report for informational purposes. While highly accurate, this report does not replace a physical inspection. A certified mechanic must confirm the final diagnosis before performing repairs.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Bar Footer */}
          {!loading && (
            <div className="px-6 py-6 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md grid grid-cols-2 md:flex md:items-center md:justify-center gap-3 sticky bottom-0 z-20">
              <button 
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-navy text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy/20 hover:scale-102 transition-transform"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button 
                onClick={copySummary}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Copy className="w-4 h-4" /> Copy Summary
              </button>
              <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button 
                onClick={() => navigate('/dashboard/towing')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:scale-102 transition-transform"
              >
                <Truck className="w-4 h-4" /> Order Towing
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
