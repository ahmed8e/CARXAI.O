import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { speak, stopSpeaking, getUrgencyColor, getUrgencyBadge } from '../lib/utils'
import type { Message, DiagnosticResult } from '../lib/types'
import {
  Bot, Send, Users, Truck, Volume2,
  Loader2, AlertTriangle, Mic, MicOff, RefreshCw, Zap, Lock as LockIcon,
  CircuitBoard, Activity, Disc, Gauge, Thermometer, Battery, Droplets, ImagePlus, Aperture, ShieldAlert, FileText,
  Car, Info, ChevronRight, Sparkles
} from 'lucide-react'
import MechanicReport from '../components/MechanicReport'
import VehicleAddModal from '../components/VehicleAddModal'
import type { Database } from '../lib/types'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

const ISSUE_CHIPS = [
  { label: 'Engine light', value: 'My check engine light is on', icon: Activity },
  { label: 'Car won\'t start', value: 'My car won\'t start', icon: Zap },
  { label: 'Strange noise', value: 'I hear a strange noise from my car', icon: Volume2 },
  { label: 'Brake warning', value: 'My brake warning light is on', icon: Disc },
  { label: 'Flat tire', value: 'I have a flat tire', icon: Gauge },
  { label: 'Overheating', value: 'My car is overheating', icon: Thermometer },
  { label: 'Battery dead', value: 'My car battery seems dead', icon: Battery },
  { label: 'Fluid leak', value: 'I see fluid leaking under my car', icon: Droplets },
]

const SYSTEM_PROMPT = `You are an expert AI automotive mechanic assistant for Carxai. 
When a user describes a car problem, respond in the following JSON format ONLY:
{
  "issueName": "Short name of the issue",
  "likelyCause": "Brief explanation of what's likely causing it (1-2 sentences)",
  "urgencyLevel": "low|medium|high|critical",
  "warning": "Optional short warning (e.g., Do not continue driving) for high urgency",
  "nextStep": "Immediate, clear, actionable next step",
  "followUp": "Optional short follow-up action"
}
Be extremely concise. Structure for a stressed user on mobile. Do not use markdown bold/italic inside JSON values.`

export default function AIMechanic() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const plan = user?.user_metadata?.subscription_tier || 'Basic'
  const isBasic = plan === 'Basic'
  const isPro = plan === 'Pro'
  const reportsUsed = user?.user_metadata?.reports_used || 0
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Describe your issue or tap a common problem to start.',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  
  // Mechanic Report States
  const [showReport, setShowReport] = useState(false)
  const [reportDiagnosis, setReportDiagnosis] = useState<DiagnosticResult | null>(null)

  // Vehicle States
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null)
  const [loadingVehicle, setLoadingVehicle] = useState(true)
  const [showVehicleModal, setShowVehicleModal] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (user) {
      fetchActiveVehicle()
    }
  }, [user])

  const fetchActiveVehicle = async () => {
    setLoadingVehicle(true)
    try {
      if (!user?.id) return

      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle()
      
      if (data) {
        setActiveVehicle(data as Vehicle)
      } else {
        // Take the latest if no default
        const { data: latest } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (latest && latest.length > 0) {
          setActiveVehicle(latest[0] as Vehicle)
        }
      }
    } catch (err) {
      console.error('Error fetching vehicle context:', err)
    } finally {
      setLoadingVehicle(false)
    }
  }

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (event.results[event.results.length - 1].isFinal) {
          setInput(prev => prev ? `${prev} ${transcript}` : transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setIsProcessing(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setIsProcessing(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const addMessage = (msg: Partial<Message>): Message => {
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '',
      timestamp: new Date(),
      ...msg,
    }
    setMessages(prev => [...prev, newMsg])
    return newMsg
  }

  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!content.trim() && !imageUrl) return
    setLoading(true)
    setInput('')
 
    addMessage({ role: 'user', content, imageUrl })

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey || apiKey === 'sk-placeholder') {
        // Demo mode - simulate response
        await new Promise(r => setTimeout(r, 1500))
        const demoResult: DiagnosticResult = {
          issueName: 'Demo Mode Active',
          likelyCause: 'OpenAI API key not configured',
          urgencyLevel: 'low',
          nextStep: 'Add your OpenAI API key to the .env file to enable real AI diagnosis.',
        }
        const demoResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ **Demo Mode**: Add your OpenAI API key to enable real diagnosis.\n\n**Issue**: ${demoResult.issueName}\n**Urgency**: ${demoResult.urgencyLevel}\n**Next Step**: ${demoResult.nextStep}`,
          timestamp: new Date(),
          issueData: demoResult,
        }
        setMessages(prev => [...prev, demoResponse])
        setLoading(false)
        return
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `${SYSTEM_PROMPT}\n\nUSER VEHICLE CONTEXT:\n${
                activeVehicle 
                  ? `Brand: ${activeVehicle.make}, Model: ${activeVehicle.model}, Year: ${activeVehicle.year}, Fuel: ${activeVehicle.fuel_type}, Engine: ${activeVehicle.engine_type || 'N/A'}, Gearbox: ${activeVehicle.gearbox || 'N/A'}, Mileage: ${activeVehicle.mileage || 'N/A'} km.`
                  : "No specific vehicle details provided. Ask the user for car details if crucial for diagnosis."
              }` 
            },
            ...messages.slice(-6).map(m => ({
              role: m.role,
              content: m.imageUrl
                ? [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: m.imageUrl } }]
                : m.content
            })),
            {
              role: 'user',
              content: imageUrl
                ? [{ type: 'text', text: content }, { type: 'image_url', image_url: { url: imageUrl } }]
                : content
            }
          ],
          max_tokens: 500,
        }),
      })

      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content ?? ''

      let issueData: DiagnosticResult | undefined
      let displayContent = rawContent

      try {
        const parsed = JSON.parse(rawContent)
        issueData = parsed
        displayContent = parsed.likelyCause
      } catch {
        // Use raw content if not JSON
      }

      const assistantMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: displayContent,
        timestamp: new Date(),
        issueData,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Save to Supabase
      if (user && issueData) {
        // @ts-ignore - Supabase type inference issue with this table
        await supabase.from('ai_chats').insert({
          user_id: user.id,
          user_message: content,
          ai_response: displayContent,
          issue_name: issueData.issueName,
          likely_cause: issueData.likelyCause,
          urgency_level: issueData.urgencyLevel,
        })
      }
    } catch (err) {
      console.error('AI Error:', err)
      const demoResult: DiagnosticResult = {
        issueName: 'Connection Feedback',
        likelyCause: 'The AI is currently in offline/demo mode. Usually, this would be a real-time diagnosis of your car problem.',
        urgencyLevel: 'medium',
        nextStep: 'Check your internet connection or API settings, then try again.',
      }
      const demoResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: demoResult.likelyCause,
        timestamp: new Date(),
        issueData: demoResult,
      }
      setMessages(prev => [...prev, demoResponse])
    }

    setLoading(false)
  }

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      sendMessage('I\'ve uploaded a photo of my car issue. Please analyze it.', base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSpeak = (text: string) => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      speak(`Carxai says, ${text}`)
      setSpeaking(true)
      setTimeout(() => setSpeaking(false), 10000)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setIsProcessing(true)
      // Small timeout to simulate processing/finishing
      setTimeout(() => setIsProcessing(false), 1000)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (err) {
        console.error('Failed to start recognition:', err)
      }
    }
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-slate-900 mb-1">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.includes('**')) {
        return <p key={i} className="mb-1">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
      }
      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />
    })
  }

  return (
    <div className="flex flex-col h-full max-h-screen relative bg-transparent">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-navy/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-navy/[0.03] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-overlay backdrop-blur-md bg-surface/90 dark:bg-slate-900/90 relative z-10">
        <div className="flex items-center gap-3">
          {/* Brand icon */}
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-navy shadow-md shadow-navy/25">
            <CircuitBoard className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-on-surface italic tracking-tight leading-tight">AI Mechanic</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Online</span>
            </div>
          </div>
        </div>

        {/* Right side: vehicle pill + user avatar */}
        <div className="flex items-center gap-2">
          {loadingVehicle ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-low dark:bg-slate-800 border border-overlay text-[10px] text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
          ) : activeVehicle ? (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate('/dashboard/vehicles')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy/5 border border-navy/10 hover:bg-navy/10 transition-colors group max-w-[180px]"
            >
              <Car className="w-3 h-3 text-navy flex-shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-navy truncate">
                {activeVehicle.make} {activeVehicle.model}
              </span>
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setShowVehicleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Info className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Add Car</span>
            </motion.button>
          )}

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy/70 flex items-center justify-center shadow-sm ring-2 ring-white">
            <span className="text-[11px] font-black text-white uppercase">
              {user?.email?.[0] ?? '?'}
            </span>
          </div>
        </div>
      </div>

      {/* Issue Chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-overlay bg-surface-low/50 dark:bg-slate-900/50 relative z-10">
        {ISSUE_CHIPS.map((chip) => (
          <motion.button
            key={chip.value}
            onClick={() => sendMessage(chip.value)}
            disabled={loading}
            className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold py-2 px-4 rounded-full border border-overlay bg-surface dark:bg-slate-800 text-on-surface hover:border-navy hover:text-navy transition-all"
            whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0, 112, 224, 0.08)' }}
            whileTap={{ scale: 0.96 }}
          >
            <chip.icon className="w-3.5 h-3.5" />
            {chip.label}
          </motion.button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10">

        {/* ── No-vehicle onboarding card ── */}
        {!loadingVehicle && !activeVehicle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-sm"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy/5 via-navy/[0.03] to-transparent border border-navy/10 p-6 bg-surface dark:bg-slate-900">
              {/* Glow orb */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-navy/10 blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-navy/60">Smarter Diagnosis</p>
                    <h4 className="font-display font-black italic text-on-surface leading-tight">Add your vehicle</h4>
                  </div>
                </div>

                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-5">
                  Tell us about your car so the AI can give you precise, model-specific answers — not just generic advice.
                </p>

                <motion.button
                  onClick={() => setShowVehicleModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-navy text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-navy/25"
                  whileHover={{ scale: 1.02, filter: 'brightness(1.08)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles className="w-4 h-4" />
                  Add Vehicle Info
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>

                {/* Skip link — elegant separator style */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-overlay" />
                  <button
                    onClick={() => {}}
                    className="text-[10px] font-bold text-muted hover:text-on-surface transition-colors whitespace-nowrap"
                  >
                    Skip for now
                  </button>
                  <div className="flex-1 h-px bg-overlay" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mr-3 mt-1 bg-surface dark:bg-slate-800 border border-overlay shadow-sm">
                <Bot className="w-5 h-5 text-navy" />
              </div>
            )}
            <div className={`max-w-[85%] lg:max-w-lg ${msg.role === 'user' ? 'order-first' : ''}`}>
              {msg.imageUrl && (
                <div className="relative rounded-2xl overflow-hidden mb-2 shadow-lg border border-slate-100">
                  <img src={msg.imageUrl} alt="Uploaded" className="w-full max-h-60 object-cover" />
                </div>
              )}
              <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-navy text-white rounded-tr-none'
                  : 'bg-surface dark:bg-slate-800 border border-overlay text-on-surface rounded-tl-none'
              }`}>
                {msg.role === 'assistant' ? (
                  msg.issueData ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-display font-bold text-on-surface italic tracking-tight mb-2">{msg.issueData.issueName}</h3>
                        <p className="text-on-surface/80 leading-relaxed font-medium">{msg.issueData.likelyCause}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-overlay">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Immediate Next Step</p>
                          <p className="text-sm font-bold text-navy leading-tight">{msg.issueData.nextStep}</p>
                        </div>
                        
                        {msg.issueData.followUp && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Follow-up</p>
                            <p className="text-xs font-medium text-muted">{msg.issueData.followUp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : formatContent(msg.content)
                ) : (
                  <p className="font-medium">{msg.content}</p>
                )}
              </div>

              {/* Urgency badge + Actions */}
              {msg.issueData && (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border w-fit ${getUrgencyColor(msg.issueData.urgencyLevel)}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {getUrgencyBadge(msg.issueData.urgencyLevel)} Urgency
                    </div>
                    {msg.issueData.warning && (
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100 w-fit">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {msg.issueData.warning}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap pb-2">
                    <motion.button 
                      onClick={() => navigate(isBasic ? '/my-account?upgrade=pro' : '/dashboard/mechanic')} 
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-900 shadow-sm"
                      whileHover={{ y: -1, borderColor: 'rgba(0, 112, 224, 0.5)', color: '#0070E0' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Users className="w-3.5 h-3.5" /> {isBasic ? 'Unlock Mechanic Search' : 'Human Mechanic'}
                    </motion.button>
                    <motion.button 
                      onClick={() => navigate(isBasic ? '/my-account?upgrade=pro' : '/dashboard/towing')} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-navy/20 ${isBasic ? 'bg-slate-400 text-white' : 'bg-navy text-white'}`}
                      whileHover={{ y: -1, filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Truck className="w-3.5 h-3.5" /> {isBasic ? 'Unlock Towing' : 'Get Towing'}
                    </motion.button>
                  </div>

                  <motion.button 
                    onClick={async () => {
                      if (isBasic) return navigate('/my-account?upgrade=pro')
                      if (isPro && reportsUsed >= 3) return navigate('/my-account?upgrade=advanced')
                      
                      if (isPro) {
                        const newCount = reportsUsed + 1
                        await supabase.auth.updateUser({
                          data: { reports_used: newCount }
                        })
                      }

                      setReportDiagnosis(msg.issueData!)
                      setShowReport(true)
                    }}
                    className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                      isBasic || (isPro && reportsUsed >= 3) 
                        ? 'bg-surface-low dark:bg-slate-800 text-muted border border-overlay'
                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FileText className="w-3.5 h-3.5" /> 
                    {isBasic 
                      ? 'Pro Plan Required for Reports' 
                      : (isPro && reportsUsed >= 3) 
                        ? 'Upgrade to Advanced for Unlimited Reports' 
                        : 'Generate Mechanic Report'}
                  </motion.button>
                </div>
              )}

              {msg.role === 'assistant' && !msg.issueData && msg.id !== '0' && (
                <motion.button 
                  onClick={() => {
                    if (isBasic) {
                      navigate('/my-account?upgrade=pro')
                    } else {
                      handleSpeak(msg.content)
                    }
                  }} 
                  className={`mt-2 ml-1 flex items-center gap-2 text-xs font-medium transition-colors ${
                    isBasic ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-navy'
                  }`}
                  whileHover={{ x: 2 }}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isBasic ? 'Unlock Voice Responses' : 'Listen to diagnosis'}
                </motion.button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-start">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center mr-3 bg-surface-low dark:bg-slate-800 border border-overlay">
              <Bot className="w-5 h-5 text-muted" />
            </div>
            <div className="px-5 py-4 rounded-3xl rounded-tl-none bg-surface-low dark:bg-slate-800 border border-overlay flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-navy animate-spin" />
              <span className="text-sm font-medium text-muted">Analyzing data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ══ Composer ══ */}
      <div className="relative z-10 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-overlay pb-[env(safe-area-inset-bottom)]">
        {/* Hidden file pickers */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

        {/* ── Floating card ── */}
        <div className="mx-3 mt-3 mb-2 rounded-[28px] border border-overlay bg-surface dark:bg-slate-800 shadow-sm
                        transition-[border-color,box-shadow] duration-200
                        focus-within:border-navy/25 focus-within:shadow-[0_0_0_4px_rgba(0,71,143,0.06),0_4px_24px_rgba(0,0,0,0.06)]">

          {/* ── Top: text input ── */}
          <div className="px-5 pt-4 pb-3">
            <AnimatePresence mode="wait">
              {isListening ? (
                /* Listening waveform replaces placeholder */
                <motion.div
                  key="waveform"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 h-[52px]"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-navy"
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.9,
                        delay: i * 0.04,
                        ease: 'easeInOut',
                      }}
                      style={{ height: 28, transformOrigin: 'center' }}
                    />
                  ))}
                  <span className="ml-3 text-[13px] font-bold text-navy/70 tracking-wide">Listening…</span>
                </motion.div>
              ) : (
                <motion.textarea
                  key="textarea"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  placeholder="Describe your car issue…"
                  rows={2}
                  style={{ minHeight: 52, maxHeight: 150 }}
                  className="w-full bg-transparent outline-none resize-none
                             text-[16px] font-medium leading-relaxed
                             text-on-surface placeholder:text-muted"
                  disabled={loading}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom: action bar ── */}
          <div className="flex items-center gap-1 px-3 pb-3">
            {/* Left — media actions */}
            <div className="flex items-center gap-0.5 flex-1">
              {/* Upload */}
              <motion.button
                onClick={() => isBasic ? navigate('/my-account?upgrade=pro') : fileInputRef.current?.click()}
                disabled={loading}
                title={isBasic ? 'Pro feature — upgrade to upload' : 'Attach photo'}
                className="relative w-9 h-9 rounded-2xl flex items-center justify-center transition-colors
                           hover:bg-surface-high dark:hover:bg-slate-700 active:bg-surface-highest dark:active:bg-slate-600"
                whileTap={{ scale: 0.9 }}
              >
                <ImagePlus className={`w-[18px] h-[18px] ${isBasic ? 'text-amber-400' : 'text-muted'}`} />
                {isBasic && (
                  <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-amber-400
                                   flex items-center justify-center ring-1 ring-white">
                    <LockIcon className="w-1.5 h-1.5 text-white" />
                  </span>
                )}
              </motion.button>

              {/* Camera */}
              <motion.button
                onClick={() => isBasic ? navigate('/my-account?upgrade=pro') : cameraInputRef.current?.click()}
                disabled={loading}
                title={isBasic ? 'Pro feature — upgrade to use camera' : 'Take photo'}
                className="relative w-9 h-9 rounded-2xl flex items-center justify-center transition-colors
                           hover:bg-slate-50 active:bg-slate-100"
                whileTap={{ scale: 0.9 }}
              >
                <Aperture className={`w-[18px] h-[18px] ${isBasic ? 'text-amber-400' : 'text-muted'}`} />
                {isBasic && (
                  <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-amber-400
                                   flex items-center justify-center ring-1 ring-white">
                    <LockIcon className="w-1.5 h-1.5 text-white" />
                  </span>
                )}
              </motion.button>

              {/* Mic */}
              <motion.button
                onClick={toggleListening}
                disabled={loading || isProcessing}
                title={isListening ? 'Stop listening' : 'Voice input'}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white shadow-sm shadow-red-400/40'
                    : 'text-muted hover:bg-surface-high dark:hover:bg-slate-700 hover:text-on-surface active:bg-surface-highest'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {isProcessing
                  ? <RefreshCw className="w-[18px] h-[18px] animate-spin" />
                  : isListening
                    ? <MicOff className="w-[18px] h-[18px]" />
                    : <Mic className="w-[18px] h-[18px]" />}
              </motion.button>
            </div>

            {/* Right — Send */}
            <motion.button
              onClick={() => sendMessage(input)}
              disabled={loading || (!input.trim() && !isListening)}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                          transition-all duration-200 ${
                input.trim() && !loading
                  ? 'bg-navy text-white shadow-md shadow-navy/30'
                  : 'bg-surface-high dark:bg-slate-700 text-muted'
              }`}
              whileHover={input.trim() && !loading ? { scale: 1.07 } : {}}
              whileTap={{ scale: 0.9 }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4 translate-x-[1px]" />}
            </motion.button>
          </div>
        </div>

        {/* Pro nudge — single understated line */}
        {isBasic && (
          <button
            onClick={() => navigate('/my-account?upgrade=pro')}
            className="w-full py-1.5 pb-2.5 text-center text-[11px] font-semibold
                       text-muted hover:text-amber-500 transition-colors"
          >
            🔒 Unlock photo &amp; camera diagnosis — <span className="underline underline-offset-2">Upgrade to Pro</span>
          </button>
        )}
      </div>

      {/* Mechanic Report Modal */}
      {reportDiagnosis && (
        <MechanicReport 
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          user={user}
          diagnosis={reportDiagnosis}
          messages={messages}
          activeVehicle={activeVehicle}
        />
      )}

      {/* Vehicle Add Modal — opened from header or onboarding card */}
      <VehicleAddModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSaved={(vehicle) => {
          setActiveVehicle(vehicle)
          setShowVehicleModal(false)
        }}
      />
    </div>
  )
}
