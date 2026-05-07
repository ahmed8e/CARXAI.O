import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, Car, Wrench, DollarSign, MessageSquare, Mic, Bot, Camera, X, CheckCircle, Copy, ExternalLink, Zap, TrendingDown, TrendingUp, Info, Layout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Tone = 'polite' | 'assertive' | 'expert'
type RiskLevel = 'low' | 'medium' | 'high'
type Status = 'fair' | 'expensive' | 'overpriced'

interface MarketBreakdown { parts_range: string; labor_range: string; total_range: string }
interface AIResult {
  detected_issue: string
  status: Status
  overpay_percent: number
  risk_level: RiskLevel
  scam_warning: string | null
  fair_price_range: string
  market_breakdown: MarketBreakdown
  explanation: string
  overpriced_component: 'parts' | 'labor' | 'both' | null
  cheaper_parts_sources: string[]
  negotiation_script: string
  next_steps: string
  smart_replies: Record<Tone, string>
}

const STATUS = {
  fair: { 
    label: 'overpaying.verdict.fair', 
    badge: 'overpaying.verdict.fair_badge', 
    bar: 'from-emerald-500 to-emerald-400', 
    icon: ShieldCheck, 
    ring: 'ring-emerald-500/10', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600' 
  },
  expensive: { 
    label: 'overpaying.verdict.expensive', 
    badge: 'overpaying.verdict.expensive_badge', 
    bar: 'from-amber-500 to-amber-400', 
    icon: AlertTriangle, 
    ring: 'ring-amber-500/10', 
    bg: 'bg-amber-50', 
    text: 'text-amber-600' 
  },
  overpriced: { 
    label: 'overpaying.verdict.overpriced', 
    badge: 'overpaying.verdict.overpriced_badge', 
    bar: 'from-rose-500 to-rose-400', 
    icon: ShieldAlert, 
    ring: 'ring-rose-500/10', 
    bg: 'bg-rose-50', 
    text: 'text-rose-600' 
  },
}

const RISK = {
  low: { label: 'overpaying.risk.low', cls: 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-500/20' },
  medium: { label: 'overpaying.risk.medium', cls: 'text-amber-600 bg-amber-50 ring-1 ring-amber-500/20' },
  high: { label: 'overpaying.risk.high', cls: 'text-rose-600 bg-rose-50 ring-1 ring-rose-500/20' },
}

const fade = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } }

export default function AvoidOverpaying() {
  const { t } = useTranslation()
  const { user, session } = useAuth()
  const [carModel, setCarModel] = useState('')
  const [problemDesc, setProblemDesc] = useState('')
  const [quotedPrice, setQuotedPrice] = useState('')
  const [region, setRegion] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'input' | 'results'>('input')
  const [isChecking, setIsChecking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<AIResult | null>(null)
  const [selectedTone, setSelectedTone] = useState<Tone>('polite')
  const [copied, setCopied] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    async function fetchVehicle() {
      try {
        const { data } = await supabase.from('vehicles').select('year, make, model').eq('user_id', user!.id).eq('is_default', true).maybeSingle() as any
        if (data) { setCarModel(`${data.year} ${data.make} ${data.model}`); return }
        const { data: first } = await supabase.from('vehicles').select('year, make, model').eq('user_id', user!.id).limit(1).maybeSingle() as any
        if (first) setCarModel(`${first.year} ${first.make} ${first.model}`)
      } catch {}
    }
    fetchVehicle()
  }, [user])

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const getToken = async () => {
    if (session?.access_token) return session.access_token
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const callAI = async (extra: { liveTranscript?: string } = {}): Promise<AIResult> => {
    const token = await getToken()
    if (!token) throw new Error('Not signed in')
    const res = await fetch('/api/ai-overpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ carModel, problemDesc, quotedPrice, imageBase64: imagePreview, region, ...extra }),
    })
    if (!res.ok) {
      const text = await res.text()
      let parsed: any = { error: text }
      try { parsed = JSON.parse(text) } catch {}
      throw new Error(parsed?.error || `Server error ${res.status}`)
    }
    return res.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carModel && !problemDesc && !imagePreview) { setErrorMsg(t('overpaying.error_empty')); return }
    setIsChecking(true); setErrorMsg('')
    try { const data = await callAI(); setResult(data); setStep('results') }
    catch (err: any) { setErrorMsg(err.message) }
    finally { setIsChecking(false) }
  }

  const handleToggleRecord = async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr; audioChunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); setIsTranscribing(true)
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader(); r.onloadend = () => resolve((r.result as string).split(',')[1]); r.onerror = reject; r.readAsDataURL(blob)
          })
          const token = await getToken()
          if (!token) throw new Error('Not signed in')
          const transRes = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ audioBase64: base64 }) })
          if (!transRes.ok) throw new Error('Transcription failed')
          const { text: transcript } = await transRes.json()
          setMessages(prev => [...prev, { role: 'user', text: transcript }])
          const aiData = await callAI({ liveTranscript: transcript })
          setMessages(prev => [...prev, { role: 'assistant', text: aiData.smart_replies?.expert || aiData.explanation }])
          setResult(aiData)
        } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}` }])
        } finally { setIsTranscribing(false) }
      }
      mr.start(); setIsRecording(true)
    } catch { alert('Microphone access required.') }
  }

  const reset = () => { setStep('input'); setResult(null); setErrorMsg(''); setImagePreview(null); setMessages([]) }
  const s = result ? STATUS[result.status] : null
  const StatusIcon = s?.icon ?? ShieldCheck

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans text-slate-900">
      {/* Premium Apple-style Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-400/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all">
            <ArrowLeft className="w-5 h-5 rtl:-scale-x-100" />
          </Link>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-0.5">{t('overpaying.price_intelligence')}</p>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('nav.overpaying')}</h1>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100/50 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">

          {/* ── INPUT STEP ── */}
          {step === 'input' && (
            <motion.div key="input" {...fade} transition={{ duration: 0.4 }} className="space-y-6">
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100/50 px-4 py-1.5 rounded-full mb-6 shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('overpaying.expert_analysis')}</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('overpaying.title')}</h2>
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  {t('overpaying.subtitle')}
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold p-4 rounded-2xl shadow-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-white/40 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/40 p-6 rounded-[32px] space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                      <Camera className="w-4 h-4 text-blue-500" />{t('overpaying.photo_label')}
                      <span className="ms-auto font-bold text-slate-300 normal-case tracking-normal">{t('common.optional')}</span>
                    </label>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f) }} />
                    {!imagePreview ? (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 transition-all group">
                        <Camera className="w-6 h-6 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t('overpaying.upload_prompt')}</span>
                      </button>
                    ) : (
                      <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="absolute top-3 end-3 w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      <Car className="w-4 h-4 text-blue-500" />{t('overpaying.vehicle_label')}
                      {carModel && <span className="ms-auto text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{t('overpaying.auto_filled')}</span>}
                    </label>
                    <input type="text" placeholder={t('overpaying.vehicle_placeholder')} value={carModel} onChange={e => setCarModel(e.target.value)} className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 outline-none transition-all shadow-sm text-start" />
                  </div>

                  {/* Problem */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      <Wrench className="w-4 h-4 text-blue-500" />{t('overpaying.problem_label')}
                    </label>
                    <textarea placeholder={t('overpaying.problem_placeholder')} value={problemDesc} onChange={e => setProblemDesc(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 outline-none transition-all resize-none shadow-sm text-start" />
                  </div>

                  {/* Price + Region */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-start">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <DollarSign className="w-4 h-4 text-blue-500" />{t('overpaying.price_label')}
                      </label>
                      <div className="relative">
                        <span className="absolute start-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input type="number" min="0" placeholder="0" value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl ps-10 pe-5 py-4 text-lg font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 outline-none transition-all shadow-sm" />
                      </div>
                    </div>
                    <div className="space-y-2 text-start">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <Info className="w-4 h-4 text-blue-500" />{t('overpaying.region_label')}
                      </label>
                      <input type="text" placeholder={t('overpaying.region_placeholder')} value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isChecking} className="group relative w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 active:scale-[0.98] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {isChecking ? (
                    <><div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />{t('overpaying.running_analysis')}</>
                  ) : (
                    <><Bot className="w-5 h-5" />{t('overpaying.run_analysis')}</>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── RESULTS STEP ── */}
          {step === 'results' && result && s && (
            <motion.div key="results" {...fade} transition={{ duration: 0.5 }} className="space-y-5">

              {/* S1: Verdict Card (Premium Glass) */}
              <div className={`relative overflow-hidden rounded-[40px] bg-white/70 backdrop-blur-2xl border border-white shadow-2xl shadow-slate-200/60 p-8 flex flex-col items-center text-center`}>
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${s.bar}`} />
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${s.bg} border border-slate-100 shadow-sm transition-transform hover:scale-110`}>
                  <StatusIcon className={`w-10 h-10 ${s.text}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 px-3 py-1 rounded-full ${s.bg} ${s.text}`}>{t(s.badge)}</span>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{t(s.label)}</h2>
                
                {result.overpay_percent > 0 && (
                  <div className="inline-flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-2xl mb-2">
                    <TrendingUp className="w-5 h-5 text-rose-500" />
                    <span className="text-rose-600 font-black text-xl">+{result.overpay_percent}% {t('overpaying.above_market')}</span>
                  </div>
                )}
                
                <div className="mt-6 w-full flex items-center justify-between bg-slate-50 border border-slate-100 rounded-3xl p-5">
                  <div className="text-start">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('overpaying.detected_issue')}</p>
                    <p className="text-base font-black text-slate-900 leading-tight">{result.detected_issue}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm ${RISK[result.risk_level].cls}`}>{t(RISK[result.risk_level].label)}</span>
                </div>
              </div>

              {/* S2: Market Breakdown */}
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-xl shadow-slate-200/30">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{t('overpaying.market_comparison')}</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: t('overpaying.parts_cost'), val: result.market_breakdown?.parts_range ?? '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: t('overpaying.labor_cost'), val: result.market_breakdown?.labor_range ?? '—', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: t('overpaying.fair_total'), val: result.market_breakdown?.total_range ?? result.fair_price_range, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map(({ label, val, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 text-center border border-white shadow-sm`}>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1.5">{label}</p>
                      <p className={`text-base font-black ${color}`}>{val}</p>
                    </div>
                  ))}
                </div>
                {result.overpriced_component && (
                  <div className="mt-5 flex items-center gap-3 bg-rose-50 border border-rose-100/50 rounded-2xl px-4 py-3 text-start">
                    <TrendingDown className="w-5 h-5 text-rose-500 shrink-0 rtl:-scale-x-100" />
                    <p className="text-xs text-rose-700 font-bold leading-tight">{t('overpaying.expert_suggestion', { component: t(`overpaying.${result.overpriced_component}`) })}</p>
                  </div>
                )}
              </div>

              {/* S3: Expert Insight */}
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-xl shadow-slate-200/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm"><Bot className="w-5 h-5 text-emerald-600" /></div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{t('overpaying.ai_intelligence')}</h3>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4 text-start">{result.explanation}</p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-start">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">{t('overpaying.next_step_label')}</p>
                  <p className="text-sm font-bold text-slate-900 leading-snug">{result.next_steps}</p>
                </div>
              </div>

              {/* S4: Scam Alert */}
              {result.scam_warning && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-600 text-white rounded-[32px] p-6 shadow-xl shadow-rose-500/20 text-start">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm"><ShieldAlert className="w-6 h-6 text-white" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">{t('overpaying.scam_warning_label')}</p>
                      <p className="text-sm font-bold leading-relaxed">{result.scam_warning}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* S5: Negotiation Suite */}
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-xl shadow-slate-200/30">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm"><MessageSquare className="w-5 h-5 text-indigo-600" /></div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{t('overpaying.negotiation_scripts')}</h3>
                </div>
                
                <div className="relative bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-5 group text-start">
                  <p className="text-sm text-indigo-900 font-bold italic leading-relaxed pe-10">"{result.negotiation_script}"</p>
                  <button onClick={() => copyText(result.negotiation_script, 'neg')} className="absolute top-3 end-3 w-9 h-9 rounded-xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
                    {copied === 'neg' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-indigo-300" />}
                  </button>
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
                  {(['polite', 'assertive', 'expert'] as Tone[]).map(t => (
                    <button key={t} onClick={() => setSelectedTone(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTone === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                  ))}
                </div>

                <div className="relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-start">
                  <p className="text-sm text-slate-600 font-bold italic leading-relaxed pe-10">"{result.smart_replies[selectedTone]}"</p>
                  <button onClick={() => copyText(result.smart_replies[selectedTone], selectedTone)} className="absolute top-3 end-3 w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
                    {copied === selectedTone ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-300" />}
                  </button>
                </div>
              </div>

              {/* S6: Parts Sources */}
              {result.cheaper_parts_sources?.length > 0 && (
                <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-xl shadow-slate-200/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm"><Layout className="w-5 h-5 text-blue-600" /></div>
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{t('overpaying.parts_savings')}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {result.cheaper_parts_sources.map((src, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4 group hover:bg-white hover:border-blue-200 transition-all cursor-default">
                        <span className="text-sm text-slate-700 font-bold">{src}</span>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Assistant (Apple Glass UI) */}
              <div className="bg-white/40 backdrop-blur-2xl border border-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/50 flex flex-col items-center">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] mb-1">{t('overpaying.live_assistant')}</h3>
                <p className="text-xs text-slate-400 font-bold text-center max-w-[220px] mb-6">{t('overpaying.live_desc')}</p>
                
                {messages.length > 0 && (
                  <div className="w-full space-y-3 mb-8 bg-slate-50/50 border border-slate-100 p-4 rounded-3xl max-h-56 overflow-y-auto scrollbar-hide shadow-inner">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                        {m.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm"><Bot className="w-4 h-4 text-emerald-600" /></div>}
                        <div className={`px-4 py-3 rounded-[20px] text-xs font-bold leading-relaxed shadow-sm text-start ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-600'}`}>{m.text}</div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                )}

                <div className="relative">
                   <button onClick={handleToggleRecord} disabled={isTranscribing} className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all z-10 ${isTranscribing ? 'bg-slate-100 text-slate-300' : isRecording ? 'bg-rose-50 text-rose-500 ring-8 ring-rose-500/10' : 'bg-white text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-50 hover:scale-105 active:scale-95'}`}>
                    <Mic className={`w-10 h-10 ${isRecording ? 'animate-pulse' : ''}`} />
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full ring-4 ring-rose-500/30 animate-ping" />
                    )}
                  </button>
                </div>
                
                <p className="text-[10px] uppercase font-black tracking-[0.3em] mt-5 text-slate-400">{isTranscribing ? t('overpaying.analyzing_voice') : isRecording ? t('overpaying.stop_recording') : t('overpaying.start_audit')}</p>
              </div>

              <button onClick={reset} className="w-full bg-white border border-slate-200 hover:border-blue-400 text-slate-500 hover:text-blue-600 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] shadow-sm">
                {t('overpaying.check_another')}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
