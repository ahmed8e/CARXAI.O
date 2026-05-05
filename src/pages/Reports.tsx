import { Loader2, ArrowLeft, ShieldCheck, Clock, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Reports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-navy tracking-tight italic mb-2">
            Diagnostic Reports
          </h1>
          <p className="text-sm font-medium text-slate-500">
            View your official AI diagnostic assessments.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Reports Yet</h3>
          <p className="text-slate-500 mb-6">You haven't generated any diagnostic reports yet.</p>
          <Link 
            to="/dashboard/ai-mechanic" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-navy text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-navy/20 hover:scale-105 transition-transform"
          >
            Start Diagnosis
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const diag = report.diagnosis_data
            const veh = report.vehicle_data
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[24px] p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                    diag.canDrive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {diag.canDrive ? 'Safe' : 'Danger'}
                  </div>
                </div>

                <h3 className="text-lg font-black text-navy leading-tight mb-2 line-clamp-2">
                  {diag.issueName}
                </h3>
                
                {veh && (
                  <p className="text-sm font-medium text-slate-500 mb-6">
                    {veh.year} {veh.make} {veh.model}
                  </p>
                )}

                <button
                  onClick={() => navigate(`/report/${report.token || report.share_id}`)}
                  className="w-full py-3 rounded-xl bg-slate-50 text-navy text-xs font-black uppercase tracking-widest group-hover:bg-navy group-hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  View Report
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
