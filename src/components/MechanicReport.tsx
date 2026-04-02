import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Download, Copy, Share2,
  Truck, ShieldAlert, User,
  Car, Info, AlertTriangle, FileText,
  Calendar, Hash, Loader2,
  ShieldCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Message, DiagnosticResult, Database } from '../lib/types'
import { getUrgencyBadge } from '../lib/utils'
import ListenButton from './ui/ListenButton'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

interface MechanicReportProps {
  isOpen: boolean
  onClose: () => void
  user: any
  diagnosis: DiagnosticResult
  messages: Message[]
  activeVehicle?: Vehicle | null
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>
}

export default function MechanicReport({ 
  isOpen, 
  onClose, 
  user, 
  diagnosis, 
  messages, 
  activeVehicle,
  currentAudioRef
}: MechanicReportProps) {
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
    const text = `Carxai Mechanic Report ${reportId}\n\nVehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}\n\nDiagnosis: ${diagnosis.issueName}\nSeverity: ${diagnosis.urgencyLevel}\nLikely Cause: ${diagnosis.likelyCause}\nRecommended Action: ${diagnosis.nextStep}`
    navigator.clipboard.writeText(text)
    alert('Report summary copied to clipboard!')
  }

  const handleShare = async () => {
    const shareData = {
      title: `Carxai Mechanic Report - ${diagnosis.issueName}`,
      text: `Diagnostic report for ${vehicle?.make} ${vehicle?.model}. Issue: ${diagnosis.issueName}.`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        copySummary()
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
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
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm print:hidden"
        />
        
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-report, #printable-report * {
              visibility: visible;
            }
            #printable-report {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            @page {
              margin: 2cm;
            }
            div {
              break-inside: auto;
            }
            h1, h2, h3, h4 {
              break-after: avoid;
            }
          }
        `}} />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          id="printable-report"
          className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.3)] flex flex-col border border-white/10 print:max-h-none print:overflow-visible print:rounded-none"
        >
          {/* 1. Strong Top Header */}
          <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 print:hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center shadow-xl shadow-navy/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Mechanic Report</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Hash className="w-3 h-3" /> {reportId}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" /> {date}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ListenButton 
                currentAudioRef={currentAudioRef}
                text={diagnosis.spokenSummary || `${diagnosis.issueName}. ${diagnosis.likelyCause}`}
              />
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95 group"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 pb-24">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-navy animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-muted/70">Assembling Report Data...</p>
              </div>
            ) : (
              <>
                {/* 2. Customer Information & 3. Vehicle Information */}
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Customer Left Column */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-navy" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Customer Data</h3>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-5">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</p>
                        <p className="text-[15px] font-bold text-slate-900 dark:text-white">{profile?.full_name || user.email?.split('@')[0] || 'Verified Member'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</p>
                        <p className="text-[15px] font-bold text-slate-900 dark:text-white">{profile?.phone}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Record Email</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Right Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-navy" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Vehicle Specification</h3>
                    </div>

                    <div className="p-8 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                      {vehicle ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Brand & Model</p>
                            <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{vehicle.make} {vehicle.model}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Model Year</p>
                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">{vehicle.year}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Plate Number</p>
                            <p className="text-[15px] font-bold text-slate-900 dark:text-white tracking-widest">{vehicle.plate_number || '---'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Engine Type</p>
                            <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 uppercase">{vehicle.engine_type || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Gearbox</p>
                            <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 uppercase">{vehicle.gearbox || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mileage</p>
                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '---'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No vehicle data on file</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Problem Summary */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Problem Summary</h3>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[32px] border border-amber-100 dark:border-amber-900/20">
                    <p className="text-lg font-bold text-amber-900 dark:text-amber-100 italic leading-relaxed">
                      "{messages.find(m => m.role === 'user')?.content || 'User reported vehicle issue'}"
                    </p>
                  </div>
                </div>

                {/* 5. Diagnosis Result */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-navy" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Diagnostic Result</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-12 gap-6 bg-slate-900 dark:bg-black rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                    {/* Decorative element */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-navy/20 rounded-full blur-[100px] group-hover:bg-navy/30 transition-colors" />
                    
                    <div className="md:col-span-12 lg:col-span-7 space-y-6 relative z-10">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identified Issue</label>
                          <h4 className="text-3xl font-display font-bold tracking-tight">{diagnosis.issueName}</h4>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Root Cause Analysis</label>
                          <p className="text-blue-100/80 leading-relaxed font-medium">{diagnosis.likelyCause}</p>
                        </div>
                        {diagnosis.missingInfo && (
                          <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 border-dashed">
                            <label className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Clarification Needed</label>
                            <p className="text-sm text-orange-100 mt-1">{diagnosis.missingInfo}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-4 relative z-10">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-3">Critical Status / Severity</p>
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider">
                          {getUrgencyBadge(diagnosis.urgencyLevel)}
                        </div>
                        
                        {/* Safety Status Mini-Badge */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            diagnosis.canDrive 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/20'
                          }`}>
                            {diagnosis.canDrive ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            {diagnosis.canDrive ? 'Safe to Drive' : 'Do Not Drive'}
                          </div>

                          {diagnosis.towingRecommended && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/20">
                              <Truck className="w-3 h-3" />
                              Towing Required
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Recommended Next Step</p>
                        <p className="text-sm font-bold text-emerald-50 leading-snug">{diagnosis.nextStep}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Attached Media (Mock) */}
                {messages.some(m => m.imageUrl) && (
                  <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-on-surface/90 dark:text-white">Attached Evidence</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {messages.filter(m => m.imageUrl).map((m, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-overlay shadow-sm transition-transform hover:scale-105">
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

          {/* 6. Action Section (Organized & Unified) */}
          {!loading && (
            <div className="px-10 py-10 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/50 backdrop-blur-xl z-30 print:hidden">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-navy text-white text-[11px] font-bold uppercase tracking-widest shadow-2xl shadow-navy/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Official PDF
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/towing')}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Truck className="w-4 h-4" /> Order Pro Towing
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 pt-6 lg:pt-0 lg:pl-6">
                  <button 
                    onClick={copySummary}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-7 py-5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-[0.95]"
                  >
                    <Copy className="w-4 h-4 text-slate-400" /> Copy
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-7 py-5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-[0.95]"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" /> Share
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
