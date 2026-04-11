import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Download, Copy, Share2,
  Truck, ShieldAlert, User,
  Car, Info, AlertTriangle, FileText,
  Calendar, Hash, Loader2,
  ShieldCheck, Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Message, DiagnosticResult, Database } from '../lib/types'
import { getUrgencyBadge } from '../lib/utils'
import ListenButton from './ui/ListenButton'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

// Helper to generate a unique share ID
const generateShareId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'CX-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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
  const [profile, setProfile] = useState<any>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(activeVehicle || null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [token] = useState(() => generateShareId())
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
        .maybeSingle()
      
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
    const text = `Carxai Mechanic Report ${token}\n\nVehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}\n\nDiagnosis: ${diagnosis.issueName || 'Diagnostic Assessment'}\nSeverity: ${getUrgencyBadge(diagnosis.urgencyLevel || 'low')}\nLikely Cause: ${diagnosis.likelyCause || 'Ongoing analysis'}\nRecommended Action: ${diagnosis.next_step}`
    navigator.clipboard.writeText(text)
    alert('Report summary copied to clipboard!')
  }

  const handleShare = async () => {
    console.log('[Carxai Share Flow] 1. Share Button Clicked')
    
    // We no longer wait for report_id. We share instantly using current memory data.
    const currentReportId = diagnosis.report_id || null
    console.log('[Carxai Share Flow] 2. Report ID present:', currentReportId ? 'YES' : 'NO (Omit from payload)')

    setSharing(true)
    
    console.group('[Carxai Share Flow] 3. Execution Details')
    console.log('Report Object:', diagnosis)

    const payload: any = {
      token: token,
      created_by: user?.id,
      vehicle_data: vehicle || { make: 'Unknown', model: 'Unknown', year: '' },
      diagnosis_data: diagnosis,
      messages: messages,
      customer_data: {
        email: user?.email,
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Customer'
      },
      summary: `Diagnostic report for ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}. Issue: ${diagnosis.issueName || 'Issue detected'}. Likely cause: ${diagnosis.likelyCause || 'Seeking clarification'}. Recommended action: ${diagnosis.next_step}`
    }

    // Only add report_id if it exists to link to history, but the system doesn't require it
    if (currentReportId) {
      payload.report_id = currentReportId
    }
    
    console.log('Insert Payload:', payload)
    console.groupEnd()

    try {
      console.log('[Carxai Share Flow] 4. Requesting Supabase insert into `shared_reports`...')
      const { error: shareError } = await supabase
        .from('shared_reports')
        .insert([payload] as any)

      if (shareError && shareError.code !== '23505') {
        console.error('[Carxai Share Flow] 5. Supabase insert failed', shareError)
        throw shareError
      }
      console.log('[Carxai Share Flow] 5. Supabase insert successful')

      const shareUrl = `${window.location.origin}/shared-report/${token}`
      const shareData = {
        title: `Carxai Mechanic Report - ${diagnosis.issueName || 'Diagnostic Assessment'}`,
        text: `Diagnostic report for ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'car'}. Issue: ${diagnosis.issueName || 'Issue detected'}.`,
        url: shareUrl
      }

      console.log('[Carxai Share Flow] 6. Share URL Generated:', shareUrl)

      // Fallback executor function
      const executeClipboardFallback = async () => {
        try {
          console.log('[Carxai Share Flow] 7. Attempting Clipboard Fallback...')
          await navigator.clipboard.writeText(`Carxai Mechanic Report\n\nIssue: ${diagnosis.issueName || 'Diagnostic Assessment'}\nView report: ${shareUrl}`)
          alert('Public report link copied to clipboard!')
          console.log('[Carxai Share Flow] 8. Clipboard success')
        } catch (clipErr) {
          console.error('[Carxai Share Flow] 8. Clipboard failed as well:', clipErr)
          alert(`Your report is ready, but we couldn't copy the link automatically. Please manually copy this url: ${shareUrl}`)
        }
      }

      if (navigator.share) {
        try {
          console.log('[Carxai Share Flow] 7. Attempting Native navigator.share...')
          await navigator.share(shareData)
          console.log('[Carxai Share Flow] 8. Native Share Sheet executed')
        } catch (shareErr: any) {
          console.error('[Carxai Share Flow] Native Share Promise failed:', shareErr)
          // AbortError means user swiped closed the share sheet, do not fallback
          if (shareErr?.name !== 'AbortError') {
             await executeClipboardFallback()
          } else {
             console.log('[Carxai Share Flow] 8. User cancelled native share sheet')
          }
        }
      } else {
        await executeClipboardFallback()
      }

    } catch (err: any) {
      console.error('[Carxai Share Flow] Fatal Error:', err)
      if (err?.code === '42P01') {
        alert("Database structure missing. Please run the SQL migrations in Supabase to create the `shared_reports` table.")
      } else {
        alert(`There was an issue creating the share link. Please try again. Detailed error: ${err.message || 'Unknown Error'}`)
      }
    } finally {
      console.log('[Carxai Share Flow] 10. Flow completes, cleaning up state')
      setSharing(false)
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
          className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden bg-white rounded-[32px] shadow-[0_20px_70px_rgba(0,0,0,0.08)] flex flex-col border border-slate-200 print:max-h-none print:overflow-visible print:rounded-none"
        >
          {/* 1. Strong Top Header */}
          <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20 print:hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0070E0] flex items-center justify-center shadow-xl shadow-[#0070E0]/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">Mechanic Report</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Hash className="w-3 h-3" /> {token}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" /> {date}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ListenButton 
                currentAudioRef={currentAudioRef}
                text={`Diagnosis: ${diagnosis.issueName || 'Diagnostic Assessment'}. Summary: ${diagnosis.likelyCause || 'Ongoing analysis'}. Safety check: ${diagnosis.can_drive ? 'You can keep driving, but be careful.' : 'No, do not drive. Stop as soon as it is safe.'} ${diagnosis.driveWhy || ''}. Danger level: ${(diagnosis.urgencyLevel || 'low').replace('_', ' ')}. Recommended next step: ${diagnosis.next_step}`}
              />
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all active:scale-95 group"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 pb-24 bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-[#0070E0] animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Assembling Report Data...</p>
              </div>
            ) : (
              <>
                {/* 2. Customer Information & 3. Vehicle Information */}
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Customer Left Column */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-[#0070E0]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Customer Data</h3>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-5">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</p>
                        <p className="text-[15px] font-bold text-slate-900">{profile?.full_name || user.email?.split('@')[0] || 'Verified Member'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</p>
                        <p className="text-[15px] font-bold text-slate-900">{profile?.phone}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Record Email</p>
                        <p className="text-xs font-bold text-slate-600 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Right Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-[#0070E0]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Vehicle Specification</h3>
                    </div>

                    <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                      {vehicle ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Brand & Model</p>
                            <p className="text-[15px] font-bold text-slate-900 leading-tight">{vehicle.make} {vehicle.model}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Model Year</p>
                            <p className="text-[15px] font-bold text-slate-900">{vehicle.year}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Plate Number</p>
                            <p className="text-[15px] font-bold text-slate-900 tracking-widest">{vehicle.plate_number || '---'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Engine Type</p>
                            <p className="text-[13px] font-bold text-slate-600 uppercase">{vehicle.engine_type || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Gearbox</p>
                            <p className="text-[13px] font-bold text-slate-600 uppercase">{vehicle.gearbox || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mileage</p>
                            <p className="text-[15px] font-bold text-slate-900">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '---'}</p>
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

                {/* 4. Unified Diagnostic Analysis */}
                <div className="space-y-8 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0070E0]/5 flex items-center justify-center border border-[#0070E0]/10">
                      <ShieldAlert className="w-4 h-4 text-[#0070E0]" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Official Diagnostic Analysis</h3>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-8">
                    {/* Main Analysis Column */}
                    <div className="lg:col-span-12 space-y-8">
                      {/* Issue Reported Card */}
                      <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Info className="w-16 h-16 text-[#0070E0]" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Issue Reported by User</p>
                        <p className="text-xl font-display font-medium text-slate-900 italic leading-relaxed relative z-10">
                          "{messages.find(m => m.role === 'user')?.content || 'Vehicle performance issue reported'}"
                        </p>
                      </div>

                      {/* Professional Diagnosis Card — The Core Result (Light Premium Redesign) */}
                      <div className="bg-[#F0F7FF] rounded-[40px] p-10 text-slate-900 shadow-[0_15px_50px_rgba(0,112,224,0.08)] relative overflow-hidden group border border-[#0070E0]/10">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0070E0]/5 rounded-full blur-[100px]" />
                        
                        <div className="grid md:grid-cols-2 gap-10 relative z-10">
                          <div className="space-y-8">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Diagnosis</p>
                              <h4 className="text-3xl font-display font-black tracking-tight italic mb-2 text-[#0E1B39]">
                                {diagnosis.issueName || 'Diagnostic Assessment'}
                              </h4>
                              {diagnosis.urgencyLevel && (
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                  diagnosis.urgencyLevel === 'stop_driving' || diagnosis.urgencyLevel === 'high'
                                    ? 'bg-red-50 text-red-600 border-red-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                  <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                                  {getUrgencyBadge(diagnosis.urgencyLevel || 'low')}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Likely Root Cause</p>
                              <p className="text-lg text-[#0E1B39]/90 leading-relaxed font-medium">
                                {diagnosis.likelyCause || 'Ongoing professional analysis...'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="p-7 rounded-3xl bg-white shadow-sm border border-[#0070E0]/20">
                              <p className="text-[10px] font-bold text-[#0070E0] uppercase tracking-widest mb-3">Action Required Now</p>
                              <p className="text-base font-bold text-slate-900 leading-snug">
                                {diagnosis.next_step}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                diagnosis.can_drive 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                  : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                {diagnosis.can_drive ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {diagnosis.can_drive ? 'Safe to Drive' : 'Do Not Drive'}
                              </div>

                              {diagnosis.towingRecommended && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-100">
                                  <Truck className="w-4 h-4" />
                                  Towing Recommended
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Certification Seal */}
                        <div className="mt-10 pt-8 border-t border-[#0070E0]/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center p-1 opacity-70">
                               <Zap className="w-5 h-5 text-[#0070E0]" fill="currentColor" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Certified AI Assessment</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Verification ID: {token}</p>
                            </div>
                          </div>
                          <div className="hidden md:block">
                             <p className="text-[8px] italic text-slate-400">Document generated by Carxai Automotive Intelligence Engine v4.0</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Attached Media */}
                {messages.some(m => m.imageUrl) && (
                  <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Attached Evidence</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {messages.filter(m => m.imageUrl).map((m, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-105">
                          <img src={m.imageUrl} alt="Diagnosis Evidence" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Disclaimer Column Style */}
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div>
                    <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Disclaimer</h5>
                    <p className="text-xs text-red-900/60 font-medium leading-relaxed">
                      This is a preliminary AI-generated report for informational purposes. While highly accurate, this report does not replace a physical inspection. A certified mechanic must confirm the final diagnosis before performing repairs.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 6. Action Section (Premium Light Mode Flow) */}
          {!loading && (
            <div className="px-10 py-10 border-t border-slate-200 bg-white sticky bottom-0 z-30 print:hidden">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Primary Action */}
                <div className="w-full lg:w-auto">
                  <motion.button 
                    whileHover={{ y: -2, boxShadow: '0 15px 50px rgba(0,112,224,0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.print()}
                    className="relative overflow-hidden w-full lg:w-auto flex items-center justify-center gap-3 px-12 py-5 rounded-[20px] bg-[#0070E0] text-white text-[12px] font-bold uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(0,112,224,0.18)] transition-all duration-300 group"
                  >
                    {/* Sophisticated White Sheen Sweep */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <Download className="w-5 h-5 stroke-[2.5]" /> Download Official PDF
                  </motion.button>
                </div>

                {/* Secondary Utility Actions */}
                <div className="flex items-center gap-4 w-full lg:w-auto lg:border-l border-slate-200 lg:pl-8 pt-6 lg:pt-0 border-t lg:border-t-0">
                  <motion.button 
                    whileHover={{ y: -1, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', borderColor: '#0070E0' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleShare}
                    disabled={sharing}
                    className={`flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-[20px] bg-white border border-[#E2E8F0] text-[#0E1B39] text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${sharing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} 
                    {sharing ? 'Sharing...' : 'Share Report'}
                  </motion.button>
                  <motion.button 
                    whileHover={{ y: -1, boxShadow: '0 8px 30px rgba(0,0,0,0.06)', borderColor: '#0070E0' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={copySummary}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-[20px] bg-white border border-[#E2E8F0] text-[#0E1B39] text-[10px] font-bold uppercase tracking-widest transition-all duration-300"
                  >
                    <Copy className="w-4 h-4" /> Copy Summary
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
