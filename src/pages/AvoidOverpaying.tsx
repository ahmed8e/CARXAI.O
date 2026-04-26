import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, 
  Car, Wrench, DollarSign, MessageSquare, Mic, 
  Bot, Camera, X, CheckCircle, Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Tone = 'polite' | 'assertive' | 'expert'
type TrustLevel = 'fair' | 'expensive' | 'overpriced' | null
type RiskLevel = 'low' | 'medium' | 'high'

export default function AvoidOverpaying() {
  const { session, user } = useAuth()
  
  const [step, setStep] = useState<'input' | 'results'>('input')
  const [carModel, setCarModel] = useState('')
  const [problemDesc, setProblemDesc] = useState('')
  const [quotedPrice, setQuotedPrice] = useState('')
  
  // Image Upload State

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Status States
  const [isChecking, setIsChecking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  // AI Response States
  const [trustLevel, setTrustLevel] = useState<TrustLevel>(null)
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low')
  const [detectedIssue, setDetectedIssue] = useState('')
  const [fairPriceRange, setFairPriceRange] = useState('')
  const [explanation, setExplanation] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  
  // Replies State
  const [selectedTone, setSelectedTone] = useState<Tone>('polite')
  const [generatedReplies, setGeneratedReplies] = useState<Record<Tone, string>>({
    polite: '', assertive: '', expert: ''
  })

  // Live Assistant State
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Auto-fetch Vehicle Profile
  useEffect(() => {
    async function fetchVehicle() {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('year, make, model')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle() as any

        if (data && !error) {
          setCarModel(`${data.year} ${data.make} ${data.model}`)
        } else {
          // fallback to any vehicle if no default
          const { data: firstVal } = await supabase
            .from('vehicles')
            .select('year, make, model')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle() as any
            
          if (firstVal) {
            setCarModel(`${firstVal.year} ${firstVal.make} ${firstVal.model}`)
          }
        }
      } catch (err) {
        console.warn('Failed to auto-fill vehicle', err)
      }
    }
    fetchVehicle()
  }, [user])

  const getSessionToken = async () => {
    if (session?.access_token) return session.access_token
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCheckPrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carModel && !problemDesc && !imagePreview && !quotedPrice) {
      setErrorMsg('Please provide some details about the problem or a quote.')
      return
    }
    
    setIsChecking(true)
    setErrorMsg('')
    
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('Not authenticated')

      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          carModel, 
          problemDesc, 
          quotedPrice, 
          imageBase64: imagePreview // This includes the data URI prefix if read AsDataURL
        })
      })

      if (!response.ok) {
        const text = await response.text()
        let parsed;
        try { parsed = JSON.parse(text) } catch { parsed = { error: text } }
        throw new Error(parsed?.error || 'Failed to analyze quote')
      }

      const data = await response.json()
      
      setDetectedIssue(data.detected_issue || 'General Maintenance')
      setRiskLevel(data.risk_level || 'medium')
      setTrustLevel(data.status || 'fair')
      setFairPriceRange(data.fair_price_range || 'Unknown')
      setExplanation(data.explanation || 'No detailed explanation provided.')
      setNextSteps(data.next_steps || 'Consult a secondary mechanic.')
      setGeneratedReplies(data.smart_replies || { polite: '', assertive: '', expert: '' })
      
      setStep('results')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error communicating with AI.')
    } finally {
      setIsChecking(false)
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64data = reader.result.split(',')[1]
          resolve(base64data || '')
        } else {
          reject(new Error("Failed to convert blob to base64"))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const handleToggleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }

        mediaRecorder.onstop = async () => {
          setIsTranscribing(true)
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
            const base64Audio = await blobToBase64(audioBlob)
            
            const token = await getSessionToken()
            if (!token) throw new Error('Not authenticated')

            // Transcribe
            const transcribeRes = await fetch('/api/transcribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ audioBase64: base64Audio })
            })

            if (!transcribeRes.ok) throw new Error('Failed to transcribe')
            const transcribeData = await transcribeRes.json()
            const transcript = transcribeData.text

            setMessages(prev => [...prev, { role: 'user', text: transcript }])

            // Negotiate
            const negotiateRes = await fetch('/api/negotiate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                carModel, 
                problemDesc, 
                quotedPrice,
                liveTranscript: transcript,
                imageBase64: imagePreview
              })
            })

            if (!negotiateRes.ok) throw new Error('Analysis failed')
            const aiData = await negotiateRes.json()
            
            const aiReply = aiData.smart_replies?.expert || aiData.explanation || 'Suggest checking standard repair times.'
            setMessages(prev => [...prev, { role: 'assistant', text: aiReply }])

          } catch (err) {
            console.error('Audio processing error:', err)
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I had trouble processing that audio.' }])
          } finally {
            setIsTranscribing(false)
            stream.getTracks().forEach(track => track.stop())
          }
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Mic access denied:', err)
        alert('Microphone access is required for the Live Assistant.')
      }
    }
  }

  const getRiskColor = (level: RiskLevel) => {
    switch(level) {
      case 'low': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
      case 'high': return 'text-rose-600 bg-rose-100 dark:bg-rose-900/30'
    }
  }

  const getRiskIcon = (level: RiskLevel) => {
    switch(level) {
      case 'low': return <CheckCircle className="w-4 h-4" />
      case 'medium': return <AlertTriangle className="w-4 h-4" />
      case 'high': return <ShieldAlert className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-0.5 mt-0.5">Price Protection</p>
            <h1 className="text-sm font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">Avoid Overpaying</h1>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight mb-2">Check Your Mechanic's Quote</h2>
                <p className="text-sm text-slate-500 font-medium">Upload a photo of the quote or part, and we'll analyze it.</p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCheckPrice} className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  
                  {/* Image Upload Area */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                       <Camera className="w-4 h-4 text-emerald-500" />
                       Upload Photo (Invoice / Dashboard / Part)
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
                        className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-400 transition-all active:scale-[0.98]"
                      >
                        <Camera className="w-6 h-6 mb-1 text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Tap to upload</span>
                      </button>
                    ) : (
                      <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                         <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                         <button 
                           type="button"
                           onClick={() => { setImagePreview(null); }}
                           className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 backdrop-blur-sm"
                         >
                           <X className="w-4 h-4" />
                         </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-emerald-500" />
                        Vehicle
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Auto-filled</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., 2018 Toyota Camry"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <Wrench className="w-4 h-4 text-emerald-500" />
                      Problem Description 
                      <span className="text-slate-400 font-normal lowercase">(Optional if photo uploaded)</span>
                    </label>
                    <textarea 
                      placeholder="e.g., Needs front brake pads and rotors replaced"
                      value={problemDesc}
                      onChange={(e) => setProblemDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none h-20"
                    />
                  </div>

                  <div>
                     <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Mechanic's Quoted Price <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-lg font-black text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                </div>

                <button 
                  type="submit" 
                  disabled={isChecking}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:bg-emerald-500/50 transition-all text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      Run Quote Analysis
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'results' && trustLevel && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* 1. Trust Indicator Header */}
              <div className="bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 w-full h-1.5 ${
                  trustLevel === 'fair' ? 'bg-emerald-500' : 
                  trustLevel === 'expensive' ? 'bg-amber-500' : 
                  'bg-rose-500'
                }`} />
                
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  trustLevel === 'fair' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 
                  trustLevel === 'expensive' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 
                  'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                }`}>
                  {trustLevel === 'fair' ? <ShieldCheck className="w-8 h-8" /> : 
                   trustLevel === 'expensive' ? <AlertTriangle className="w-8 h-8" /> : 
                   <ShieldAlert className="w-8 h-8" />}
                </div>

                <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
                  trustLevel === 'fair' ? 'text-emerald-600' : 
                  trustLevel === 'expensive' ? 'text-amber-600' : 
                  'text-rose-600'
                }`}>
                  {trustLevel === 'fair' ? 'Looks Good' : 
                   trustLevel === 'expensive' ? 'Be Careful' : 
                   'High Alert'}
                </div>
                
                <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white capitalize tracking-tight mb-4">
                  {trustLevel === 'fair' ? 'Fair Price' : 
                   trustLevel === 'expensive' ? 'Slightly Expensive' : 
                   'Overpriced'}
                </h2>

                <div className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800 text-left">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Detected Issue</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{detectedIssue}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRiskColor(riskLevel)}`}>
                    {getRiskIcon(riskLevel)} <span>{riskLevel} Risk</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-950 w-full p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estimated Fair Range</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{fairPriceRange}</p>
                </div>
                
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {explanation}
                </p>
              </div>

              {/* 2. Next Steps Action Card */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-5 rounded-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider">What to Do Next</h3>
                </div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
                  {nextSteps}
                </p>
              </div>

              {/* 3. Smart Reply Generator */}
              <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 dark:text-white text-base">Smart Replies</h3>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">How to respond</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['polite', 'assertive', 'expert'] as Tone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTone(t)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        selectedTone === t 
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-1">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <p>"{generatedReplies[selectedTone] || 'Getting suggestion...'}"</p>
                  </div>
                </div>
              </div>

              {/* 4. Live Assistant Mode (Voice UI) */}
              <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <div className="text-center mb-6">
                  <h3 className="font-display font-black text-slate-900 dark:text-white text-base">Live Assistant Mode</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-[250px] mx-auto mt-1">
                    Talking to the mechanic right now? Tap record for live AI suggestions.
                  </p>
                </div>

                {messages.length > 0 && (
                  <div className="w-full space-y-3 mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl h-40 overflow-y-auto border border-slate-100 dark:border-slate-800">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex items-start gap-2 max-w-[85%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
                        {m.role === 'assistant' && (
                          <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                        )}
                        <div className={`p-3 rounded-2xl text-xs font-medium ${
                          m.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-sm ml-auto' 
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={handleToggleRecord}
                  disabled={isTranscribing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isTranscribing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                    isRecording 
                      ? 'bg-rose-50 border-4 border-rose-500 animate-pulse text-rose-500' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
                </button>
                <p className="text-[10px] uppercase font-black tracking-widest mt-4 text-slate-400">
                  {isTranscribing ? 'Thinking...' : isRecording ? 'Listening...' : 'Tap to Listen'}
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    setStep('input')
                    setMessages([])
                    setErrorMsg('')
                    setImagePreview(null)
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all"
                >
                  Check Another Quote
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
