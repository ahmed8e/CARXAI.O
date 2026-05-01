import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft,
  Car, Wrench, DollarSign, MessageSquare, Mic,
  Bot, Camera, X, CheckCircle, Activity, TrendingDown
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tone = 'polite' | 'assertive' | 'expert'
type RiskLevel = 'low' | 'medium' | 'high'

interface AIResult {
  detected_issue: string
  risk_level: RiskLevel
  fair_price_range: string
  status: 'fair' | 'expensive' | 'overpriced'
  overpay_percent: number
  explanation: string
  next_steps: string
  smart_replies: Record<Tone, string>
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  fair: {
    label: 'Fair Price',
    badge: 'Looks Good',
    color: 'emerald',
    icon: ShieldCheck,
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
    badgeColor: 'text-emerald-600',
  },
  expensive: {
    label: 'Slightly Expensive',
    badge: 'Be Careful',
    color: 'amber',
    icon: AlertTriangle,
    bar: 'bg-amber-500',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
    badgeColor: 'text-amber-600',
  },
  overpriced: {
    label: 'Overpriced',
    badge: 'High Alert',
    color: 'rose',
    icon: ShieldAlert,
    bar: 'bg-rose-500',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30',
    badgeColor: 'text-rose-600',
  },
}

const RISK_CONFIG = {
  low: { label: 'Low Risk', cls: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  medium: { label: 'Medium Risk', cls: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle },
  high: { label: 'High Risk', cls: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30', icon: ShieldAlert },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AvoidOverpaying() {
  const { user, session } = useAuth()

  // Form state
  const [carModel, setCarModel] = useState('')
  const [problemDesc, setProblemDesc] = useState('')
  const [quotedPrice, setQuotedPrice] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI state
  const [step, setStep] = useState<'input' | 'results'>('input')
  const [isChecking, setIsChecking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // AI result
  const [result, setResult] = useState<AIResult | null>(null)
  const [selectedTone, setSelectedTone] = useState<Tone>('polite')

  // Live assistant
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // ── Auto-fill vehicle from profile ──
  useEffect(() => {
    if (!user) return
    async function fetchVehicle() {
      try {
        const { data } = await supabase
          .from('vehicles')
          .select('year, make, model')
          .eq('user_id', user!.id)
          .eq('is_default', true)
          .maybeSingle() as any

        if (data) {
          setCarModel(`${data.year} ${data.make} ${data.model}`)
          return
        }
        // fallback: any vehicle
        const { data: first } = await supabase
          .from('vehicles')
          .select('year, make, model')
          .eq('user_id', user!.id)
          .limit(1)
          .maybeSingle() as any

        if (first) setCarModel(`${first.year} ${first.make} ${first.model}`)
      } catch {
        // silently skip — user can type manually
      }
    }
    fetchVehicle()
  }, [user])

  // Scroll messages to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Helpers ──
  const getToken = async () => {
    if (session?.access_token) return session.access_token
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  const callAI = async (extra: { liveTranscript?: string } = {}): Promise<AIResult> => {
    const token = await getToken()
    if (!token) throw new Error('Not signed in')

    const res = await fetch('/api/ai-overpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        carModel,
        problemDesc,
        quotedPrice,
        imageBase64: imagePreview,
        ...extra,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      let parsed: any = { error: text }
      try { parsed = JSON.parse(text) } catch { }
      throw new Error(parsed?.error || `Server error ${res.status}`)
    }

    return res.json()
  }

  // ── Handle image upload ──
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── Submit form ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carModel && !problemDesc && !imagePreview) {
      setErrorMsg('Please describe the problem or upload a photo.')
      return
    }
    setIsChecking(true)
    setErrorMsg('')
    try {
      const data = await callAI()
      setResult(data)
      setStep('results')
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsChecking(false)
    }
  }

  // ── Voice recording ──
  const handleToggleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setIsTranscribing(true)
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader()
            r.onloadend = () => resolve((r.result as string).split(',')[1])
            r.onerror = reject
            r.readAsDataURL(blob)
          })

          const token = await getToken()
          if (!token) throw new Error('Not signed in')

          // Transcribe via existing /api/transcribe
          const transRes = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ audioBase64: base64 }),
          })
          if (!transRes.ok) throw new Error('Transcription failed')
          const { text: transcript } = await transRes.json()

          setMessages(prev => [...prev, { role: 'user', text: transcript }])

          // Run analysis with transcript
          const aiData = await callAI({ liveTranscript: transcript })
          const reply = aiData.smart_replies?.expert || aiData.explanation
          setMessages(prev => [...prev, { role: 'assistant', text: reply }])

          // Update result with latest analysis
          setResult(aiData)
        } catch (err: any) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', text: `Sorry, I couldn't process that audio: ${err.message}` },
          ])
        } finally {
          setIsTranscribing(false)
        }
      }

      mr.start()
      setIsRecording(true)
    } catch {
      alert('Microphone access is required for Live Assistant.')
    }
  }

  const resetForm = () => {
    setStep('input')
    setResult(null)
    setErrorMsg('')
    setImagePreview(null)
    setMessages([])
  }

  // ── Render helpers ──
  const statusCfg = result ? STATUS_CONFIG[result.status] : null
  const riskCfg = result ? RISK_CONFIG[result.risk_level] : null
  const RiskIcon = riskCfg?.icon ?? CheckCircle
  const StatusIcon = statusCfg?.icon ?? ShieldCheck

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Price Protection</p>
            <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Avoid Overpaying</h1>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* ══════════════════ INPUT STEP ══════════════════ */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="space-y-5"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                  Check Your Mechanic's Quote
                </h2>
                <p className="text-sm text-slate-500">
                  Get an AI-powered price analysis before you commit.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium p-4 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">

                  {/* Image upload */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <Camera className="w-4 h-4 text-emerald-500" />
                      Photo of Quote / Damage
                      <span className="ml-auto font-normal text-slate-400 lowercase normal-case tracking-normal">Optional</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {!imagePreview ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all active:scale-[0.98]"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-xs font-semibold">Tap to upload photo</span>
                      </button>
                    ) : (
                      <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <Car className="w-4 h-4 text-emerald-500" />
                      Your Vehicle
                      {carModel && (
                        <span className="ml-auto text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 px-2 py-0.5 rounded-full font-bold normal-case tracking-normal">
                          Auto-filled
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2019 Honda Civic"
                      value={carModel}
                      onChange={e => setCarModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {/* Problem */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <Wrench className="w-4 h-4 text-emerald-500" />
                      What does the mechanic say?
                    </label>
                    <textarea
                      placeholder="e.g. Needs front brake pads and rotors replaced"
                      value={problemDesc}
                      onChange={e => setProblemDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Their Quoted Price
                      <span className="ml-auto font-normal text-slate-400 lowercase normal-case tracking-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={quotedPrice}
                        onChange={e => setQuotedPrice(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-lg font-black text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 transition-all text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isChecking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      Run AI Price Analysis
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ══════════════════ RESULTS STEP ══════════════════ */}
          {step === 'results' && result && statusCfg && riskCfg && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >

              {/* ── Verdict card ── */}
              <div className="bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1.5 ${statusCfg.bar}`} />

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${statusCfg.iconBg}`}>
                  <StatusIcon className="w-8 h-8" />
                </div>

                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${statusCfg.badgeColor}`}>
                  {statusCfg.badge}
                </p>

                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                  {statusCfg.label}
                </h2>

                {/* Detected issue + risk */}
                <div className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-left mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Detected Issue</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{result.detected_issue}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${riskCfg.cls}`}>
                    <RiskIcon className="w-3.5 h-3.5" />
                    {riskCfg.label}
                  </div>
                </div>

                {/* Fair range + overpay% */}
                <div className="w-full grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Fair Range</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{result.fair_price_range}</p>
                  </div>
                  {result.overpay_percent > 0 ? (
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-left">
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">Overpay</p>
                      <p className="text-base font-black text-rose-600 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        +{result.overpay_percent}%
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-left">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Overpay</p>
                      <p className="text-base font-black text-emerald-600">None 👍</p>
                    </div>
                  )}
                </div>

                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* ── Next steps ── */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-5 rounded-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                    What to Do Next
                  </h3>
                </div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{result.next_steps}</p>
              </div>

              {/* ── Smart replies ── */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">What to Say</h3>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Choose your tone</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {(['polite', 'assertive', 'expert'] as Tone[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTone(t)}
                      className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedTone === t
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{result.smart_replies[selectedTone]}"
                </div>
              </div>

              {/* ── Live Assistant ── */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <h3 className="font-black text-slate-900 dark:text-white text-sm mb-1">Live Assistant</h3>
                <p className="text-xs text-slate-500 text-center max-w-[220px] mb-5">
                  At the mechanic now? Record what they say for instant AI feedback.
                </p>

                {messages.length > 0 && (
                  <div className="w-full space-y-2 mb-5 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl max-h-44 overflow-y-auto border border-slate-100 dark:border-slate-800">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                        {m.role === 'assistant' && (
                          <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-xs font-medium max-w-[85%] ${m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                          }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                )}

                <button
                  onClick={handleToggleRecord}
                  disabled={isTranscribing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isTranscribing
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                      : isRecording
                        ? 'bg-rose-50 border-4 border-rose-500 text-rose-500 animate-pulse'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95'
                    }`}
                >
                  <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
                </button>
                <p className="text-[10px] uppercase font-black tracking-widest mt-3 text-slate-400">
                  {isTranscribing ? 'Thinking...' : isRecording ? 'Tap to Stop' : 'Tap to Record'}
                </p>
              </div>

              {/* ── Check another ── */}
              <button
                onClick={resetForm}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all"
              >
                Check Another Quote
              </button>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
