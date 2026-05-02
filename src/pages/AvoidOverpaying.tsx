import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, Car, Wrench, DollarSign, MessageSquare, Mic, Bot, Camera, X, CheckCircle, Copy, ExternalLink, Zap, TrendingDown, TrendingUp, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  fair: { label: 'Fair Price', badge: 'Looks Good', bar: 'from-emerald-500 to-teal-500', icon: ShieldCheck, ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  expensive: { label: 'Slightly High', badge: 'Caution', bar: 'from-amber-500 to-orange-500', icon: AlertTriangle, ring: 'ring-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  overpriced: { label: 'Overpriced', badge: 'High Alert', bar: 'from-rose-500 to-red-600', icon: ShieldAlert, ring: 'ring-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400' },
}
const RISK = {
  low: { label: 'Low Risk', cls: 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20' },
  medium: { label: 'Medium Risk', cls: 'text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/20' },
  high: { label: 'High Risk', cls: 'text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/20' },
}
const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }

export default function AvoidOverpaying() {
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
    if (!carModel && !problemDesc && !imagePreview) { setErrorMsg('Please describe the problem or upload a photo.'); return }
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
    <div className="min-h-screen bg-[#0a0f1e] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0d1425]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Price Protection</p>
            <h1 className="text-sm font-black text-white uppercase tracking-wider">Avoid Overpaying</h1>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* ── INPUT STEP ── */}
          {step === 'input' && (
            <motion.div key="input" {...fade} transition={{ duration: 0.3 }} className="space-y-5">
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 ring-1 ring-emerald-500/20 px-4 py-1.5 rounded-full mb-4">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Powered Analysis</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Check Your Quote</h2>
                <p className="text-sm text-white/40">Get expert-level pricing intelligence before you commit.</p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-3 bg-rose-500/10 ring-1 ring-rose-500/20 text-rose-400 text-sm font-medium p-4 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white/5 ring-1 ring-white/10 p-5 rounded-3xl space-y-5">
                  {/* Image Upload */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                      <Camera className="w-4 h-4 text-emerald-400" />Photo of Quote / Damage
                      <span className="ml-auto font-normal text-white/30 normal-case tracking-normal">Optional</span>
                    </label>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f) }} />
                    {!imagePreview ? (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-20 rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-white/60 transition-all">
                        <Camera className="w-5 h-5" /><span className="text-xs font-semibold">Tap to upload</span>
                      </button>
                    ) : (
                      <div className="relative h-32 rounded-2xl overflow-hidden ring-1 ring-white/10">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                      <Car className="w-4 h-4 text-emerald-400" />Your Vehicle
                      {carModel && <span className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 px-2 py-0.5 rounded-full font-bold normal-case tracking-normal">Auto-filled</span>}
                    </label>
                    <input type="text" placeholder="e.g. 2019 Honda Civic" value={carModel} onChange={e => setCarModel(e.target.value)} className="w-full bg-white/5 ring-1 ring-white/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 focus:ring-emerald-500/40 outline-none transition-all" />
                  </div>

                  {/* Problem */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                      <Wrench className="w-4 h-4 text-emerald-400" />What does the mechanic say?
                    </label>
                    <textarea placeholder="e.g. Needs front brake pads and rotors replaced" value={problemDesc} onChange={e => setProblemDesc(e.target.value)} rows={3} className="w-full bg-white/5 ring-1 ring-white/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 focus:ring-emerald-500/40 outline-none transition-all resize-none" />
                  </div>

                  {/* Price + Region */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />Quoted Price
                        <span className="ml-auto font-normal text-white/30 normal-case tracking-normal">Optional</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                        <input type="number" min="0" placeholder="0" value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} className="w-full bg-white/5 ring-1 ring-white/10 rounded-2xl pl-8 pr-4 py-3.5 text-lg font-black text-white placeholder:text-white/20 focus:ring-emerald-500/40 outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                        <Info className="w-4 h-4 text-emerald-400" />Region
                        <span className="ml-auto font-normal text-white/30 normal-case tracking-normal">Optional</span>
                      </label>
                      <input type="text" placeholder="e.g. Texas" value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-white/5 ring-1 ring-white/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-white placeholder:text-white/20 focus:ring-emerald-500/40 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isChecking} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {isChecking ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing with AI...</>) : (<><Bot className="w-5 h-5" />Run AI Price Analysis</>)}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── RESULTS STEP ── */}
          {step === 'results' && result && s && (
            <motion.div key="results" {...fade} transition={{ duration: 0.3 }} className="space-y-4">

              {/* S1: Verdict */}
              <div className={`relative overflow-hidden rounded-3xl ring-2 ${s.ring} bg-[#0d1425] p-6 flex flex-col items-center text-center`}>
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${s.bar}`} />
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${s.bg} ring-2 ${s.ring}`}>
                  <StatusIcon className={`w-8 h-8 ${s.text}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] mb-1 ${s.text}`}>{s.badge}</span>
                <h2 className="text-3xl font-black text-white mb-1">{s.label}</h2>
                {result.overpay_percent > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400 font-black text-lg">+{result.overpay_percent}% above market</span>
                  </div>
                )}
                <div className="mt-4 w-full flex items-center justify-between bg-white/5 rounded-2xl p-3">
                  <div className="text-left">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Detected Issue</p>
                    <p className="text-sm font-bold text-white">{result.detected_issue}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full ${RISK[result.risk_level].cls}`}>{RISK[result.risk_level].label}</span>
                </div>
              </div>

              {/* S2: Market Breakdown */}
              <div className="bg-[#0d1425] ring-1 ring-white/10 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center"><DollarSign className="w-4 h-4 text-blue-400" /></div>
                  <h3 className="font-black text-white text-sm">Market Breakdown</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Parts', val: result.market_breakdown?.parts_range ?? '—', color: 'text-purple-400' },
                    { label: 'Labor', val: result.market_breakdown?.labor_range ?? '—', color: 'text-blue-400' },
                    { label: 'Total', val: result.market_breakdown?.total_range ?? result.fair_price_range, color: 'text-emerald-400' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white/5 rounded-2xl p-3 text-center">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">{label}</p>
                      <p className={`text-sm font-black ${color}`}>{val}</p>
                    </div>
                  ))}
                </div>
                {result.overpriced_component && (
                  <div className="mt-3 flex items-center gap-2 bg-rose-500/10 ring-1 ring-rose-500/20 rounded-xl px-3 py-2">
                    <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-400 font-semibold capitalize"><span className="font-black">{result.overpriced_component}</span> costs appear inflated</p>
                  </div>
                )}
              </div>

              {/* S3: Expert Analysis */}
              <div className="bg-[#0d1425] ring-1 ring-white/10 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Bot className="w-4 h-4 text-emerald-400" /></div>
                  <h3 className="font-black text-white text-sm">Expert Analysis</h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{result.explanation}</p>
                <div className="mt-3 bg-white/5 rounded-2xl p-3">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Next Step</p>
                  <p className="text-sm font-semibold text-white">{result.next_steps}</p>
                </div>
              </div>

              {/* S4: Scam Warning */}
              {result.scam_warning && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-500/10 ring-2 ring-rose-500/30 rounded-3xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5"><ShieldAlert className="w-4 h-4 text-rose-400" /></div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-rose-400 mb-1">⚠ Scam Alert</p>
                      <p className="text-sm text-rose-300 leading-relaxed">{result.scam_warning}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* S5: Negotiation */}
              <div className="bg-[#0d1425] ring-1 ring-white/10 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-indigo-400" /></div>
                  <h3 className="font-black text-white text-sm">Negotiation Script</h3>
                </div>
                <div className="relative bg-indigo-500/5 ring-1 ring-indigo-500/20 rounded-2xl p-4 mb-3">
                  <p className="text-sm text-white/80 italic leading-relaxed pr-8">"{result.negotiation_script}"</p>
                  <button onClick={() => copyText(result.negotiation_script, 'neg')} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                    {copied === 'neg' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                  </button>
                </div>
                <div className="flex gap-2 mb-3">
                  {(['polite', 'assertive', 'expert'] as Tone[]).map(t => (
                    <button key={t} onClick={() => setSelectedTone(t)} className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedTone === t ? 'bg-white text-slate-900' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{t}</button>
                  ))}
                </div>
                <div className="relative bg-white/5 rounded-2xl p-4">
                  <p className="text-sm text-white/70 italic leading-relaxed pr-8">"{result.smart_replies[selectedTone]}"</p>
                  <button onClick={() => copyText(result.smart_replies[selectedTone], selectedTone)} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                    {copied === selectedTone ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                  </button>
                </div>
              </div>

              {/* S6: Cheaper Parts */}
              {result.cheaper_parts_sources?.length > 0 && (
                <div className="bg-[#0d1425] ring-1 ring-white/10 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-xl bg-teal-500/10 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-teal-400" /></div>
                    <h3 className="font-black text-white text-sm">Find Cheaper Parts</h3>
                  </div>
                  <div className="space-y-2">
                    {result.cheaper_parts_sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                        <ExternalLink className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="text-sm text-white/70 font-medium">{src}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Assistant */}
              <div className="bg-[#0d1425] ring-1 ring-white/10 rounded-3xl p-5 flex flex-col items-center">
                <h3 className="font-black text-white text-sm mb-1">Live Assistant</h3>
                <p className="text-xs text-white/40 text-center max-w-[200px] mb-5">At the mechanic now? Record for instant AI feedback.</p>
                {messages.length > 0 && (
                  <div className="w-full space-y-2 mb-5 bg-white/5 p-3 rounded-2xl max-h-44 overflow-y-auto">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                        {m.role === 'assistant' && <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-emerald-400" /></div>}
                        <div className={`px-3 py-2 rounded-2xl text-xs font-medium max-w-[85%] ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70'}`}>{m.text}</div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                )}
                <button onClick={handleToggleRecord} disabled={isTranscribing} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isTranscribing ? 'bg-white/5 text-white/30 cursor-not-allowed' : isRecording ? 'bg-rose-500/10 ring-4 ring-rose-500 text-rose-400 animate-pulse' : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95'}`}>
                  <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
                </button>
                <p className="text-[10px] uppercase font-black tracking-widest mt-3 text-white/30">{isTranscribing ? 'Thinking...' : isRecording ? 'Tap to Stop' : 'Tap to Record'}</p>
              </div>

              <button onClick={reset} className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white py-4 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98]">
                Check Another Quote
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
