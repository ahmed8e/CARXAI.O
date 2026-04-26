import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, 
  Car, Wrench, DollarSign, MessageSquare, Mic, 
  Bot
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Tone = 'polite' | 'assertive' | 'expert'
type TrustLevel = 'fair' | 'expensive' | 'overpriced' | null

export default function AvoidOverpaying() {
  const { session } = useAuth()
  const [step, setStep] = useState<'input' | 'results'>('input')
  const [carModel, setCarModel] = useState('')
  const [problemDesc, setProblemDesc] = useState('')
  const [quotedPrice, setQuotedPrice] = useState('')
  
  // Loading & Error State
  const [isChecking, setIsChecking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  // Real AI Results State
  const [trustLevel, setTrustLevel] = useState<TrustLevel>(null)
  const [fairPriceRange, setFairPriceRange] = useState('')
  const [explanation, setExplanation] = useState('')
  
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

  const getSessionToken = async () => {
    if (session?.access_token) return session.access_token
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const handleCheckPrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!carModel || !problemDesc || !quotedPrice) return
    
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
        body: JSON.stringify({ carModel, problemDesc, quotedPrice })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to analyze quote')
      }

      const data = await response.json()
      
      setTrustLevel(data.status)
      setFairPriceRange(data.fair_price_range)
      setExplanation(data.explanation)
      setGeneratedReplies(data.smart_replies)
      
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
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Check for proper split for base64
          const base64data = reader.result.split(',')[1];
          resolve(base64data || '');
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

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

            // 1. Transcribe via Whisper
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

            // 2. Fetch negotiated real-time reply
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
                liveTranscript: transcript
              })
            })

            if (!negotiateRes.ok) throw new Error('Analysis failed')
            const aiData = await negotiateRes.json()
            
            // The Live feedback could just be the short explanation or expert reply
            const aiReply = aiData.explanation || aiData.smart_replies.polite
            setMessages(prev => [...prev, { role: 'assistant', text: aiReply }])

          } catch (err) {
            console.error('Audio processing error:', err)
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I had trouble processing that audio.' }])
          } finally {
            setIsTranscribing(false)
            // Stop tracks completely to release microphone
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Premium Header */}
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
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight mb-2">Check Your Mechanic's Quote</h2>
                <p className="text-sm text-slate-500 font-medium">Enter your repair details below and our AI will tell you if you're getting a fair deal.</p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border border-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCheckPrice} className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <Car className="w-4 h-4 text-emerald-500" />
                      Vehicle Make & Model
                    </label>
                    <input 
                      type="text" 
                      required
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
                    </label>
                    <textarea 
                      required
                      placeholder="e.g., Needs front brake pads and rotors replaced"
                      value={problemDesc}
                      onChange={(e) => setProblemDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                    />
                  </div>

                  <div>
                     <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Mechanic's Quoted Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        required
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
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Verify Quote Price
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
              className="space-y-6"
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
                
                <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white capitalize mb-4 tracking-tight">
                  {trustLevel === 'fair' ? 'Fair Price' : 
                   trustLevel === 'expensive' ? 'Slightly Expensive' : 
                   'Overpriced'}
                </h2>
                
                <div className="bg-slate-50 dark:bg-slate-950 w-full p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Estimated Fair Range</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{fairPriceRange}</p>
                </div>
                
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {explanation}
                </p>
              </div>

              {/* 2. Smart Reply Generator */}
              <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 dark:text-white text-base">Smart Reply Generator</h3>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">What to say to the mechanic</p>
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

                <div className="space-y-3 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 relative group">
                    <p>"{generatedReplies[selectedTone] || 'Getting suggestion...'}"</p>
                  </div>
                </div>
              </div>

              {/* 3. Live Assistant Mode (Voice UI) */}
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

              <div className="pt-4">
                <button 
                  onClick={() => {
                    setStep('input')
                    setMessages([])
                    setErrorMsg('')
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
