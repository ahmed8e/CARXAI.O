import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Car, ShieldAlert, ShieldCheck, Truck, 
  CheckCircle, Loader2, ArrowRight
} from 'lucide-react'
import { BrandLockup } from '../components/ui/Brand'
import { supabase } from '../lib/supabase'
import { getUrgencyBadge } from '../lib/utils'
import MechanicLeadModal from '../components/MechanicLeadModal'
import ListenButton from '../components/ui/ListenButton'
import ErrorBoundary from '../components/ErrorBoundary'

export default function SharedReport() {
  const { shareId, token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportData, setReportData] = useState<any>(null)
  
  // Lead Capture Modal State
  const [showLeadModal, setShowLeadModal] = useState(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    async function fetchSharedReport() {
      const activeIdentifier = token || shareId
      if (!activeIdentifier) {
        setError('Invalid share link.')
        setLoading(false)
        return
      }

      try {
        // Alignment: Check both token (new canonical) and share_id (legacy)
        const queryField = token ? 'token' : 'share_id'
        
        const { data, error: fetchErr } = await supabase
          .from('shared_reports')
          .select('*')
          .eq(queryField, activeIdentifier)
          .single()

        if (fetchErr) throw fetchErr
        if (!data) throw new Error('Report not found')

        setReportData(data)
        
        // Show modal only once per session for this report
        const modalShownKey = `car safety_lead_modal_shown_${activeIdentifier}`
        if (!sessionStorage.getItem(modalShownKey)) {
          setTimeout(() => setShowLeadModal(true), 1500) // Delay modal slightly for premium feel
          sessionStorage.setItem(modalShownKey, 'true')
        }

      } catch (err) {
        console.error('Error fetching shared report:', err)
        setError('This shared report link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedReport()
  }, [shareId, token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0070E0] animate-spin" />
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-[#F4F7FF] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Report Not Found</h2>
        <p className="text-slate-600 mb-8">{error}</p>
        <Link 
          to="/"
          className="px-6 py-3 bg-[#0070E0] text-white rounded-xl font-bold transition-all hover:scale-105"
        >
          Go to Homepage
        </Link>
      </div>
    )
  }

  const { vehicle_data: vehicle, diagnosis_data: diagnosis } = reportData

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F4F7FF] flex flex-col relative font-sans text-slate-900 selection:bg-[#0070E0] selection:text-white">
        
        {/* Premium Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex justify-between items-center">
            <div className="relative z-10 group cursor-pointer" onClick={() => window.location.href = '/'}>
              <BrandLockup size="lg" />
            </div>

            <Link
              to="/register"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0E3882] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#0A2A66] transition-colors"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-32 pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] shadow-[0_20px_70px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 py-8 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-display font-black text-[#0E1B39] tracking-tight mb-2">
                  Diagnostic Report
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  ID: {reportData.share_id} <span className="w-1 h-1 bg-slate-300 rounded-full" /> {new Date(reportData.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <ListenButton 
                currentAudioRef={currentAudioRef}
                text={`Diagnosis: ${diagnosis.issueName}. Summary: ${diagnosis.likelyCause}. Safety check: ${diagnosis.canDrive ? 'You can keep driving, but be careful.' : 'No, do not drive. Stop as soon as it is safe.'} ${diagnosis.driveWhy}. Danger level: ${diagnosis.urgencyLevel.replace('_', ' ')}. Recommended next step: ${diagnosis.nextStep}`}
              />
            </div>

            <div className="p-8 md:p-12 space-y-12">
              
              {/* Vehicle & Customer Specs Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#0070E0]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Vehicle Info</h3>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                      <p className="text-lg font-bold text-slate-900 mb-1">{vehicle.make} {vehicle.model}</p>
                      <p className="text-sm font-medium text-slate-500">Year: {vehicle.year}</p>
                  </div>
                </div>
              </div>

              {/* Core Diagnosis Card */}
              <div className="bg-[#F0F7FF] rounded-[40px] p-8 md:p-10 border border-[#0070E0]/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <CheckCircle className="w-32 h-32 text-[#0070E0]" />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI Diagnosis Result</p>
                    <h4 className="text-3xl font-display font-black tracking-tight italic mb-3 text-[#0E1B39]">
                      {diagnosis.issueName}
                    </h4>
                    {diagnosis.urgencyLevel && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        diagnosis.urgencyLevel === 'stop_driving' || diagnosis.urgencyLevel === 'high'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                        {getUrgencyBadge(diagnosis.urgencyLevel)}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-lg text-[#0E1B39]/90 leading-relaxed font-medium">
                      {diagnosis.likelyCause}
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white border border-[#0070E0]/20 shadow-sm">
                    <p className="text-[10px] font-bold text-[#0070E0] uppercase tracking-widest mb-2">Recommended Next Step</p>
                    <p className="text-base font-bold text-slate-900">{diagnosis.nextStep}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${
                      diagnosis.canDrive 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {diagnosis.canDrive ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      {diagnosis.canDrive ? 'Safe to Drive' : 'Do Not Drive'}
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

            </div>
          </motion.div>
          
          <div className="mt-8 text-center">
              <p className="text-sm font-medium text-slate-500">Want to generate your own AI reports? <Link to="/register" className="text-[#0070E0] hover:underline font-bold">Join Car Safety.</Link></p>
          </div>
        </main>

        {/* Lead Capture Modal Overridden Logic */}
        <MechanicLeadModal 
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          sharedLinkId={reportData.id}
        />
      </div>
    </ErrorBoundary>
  )
}
