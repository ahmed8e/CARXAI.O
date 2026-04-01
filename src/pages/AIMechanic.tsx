import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { speak, stopSpeaking, getUrgencyColor, getUrgencyBadge } from '../lib/utils'
import type { Message, DiagnosticResult } from '../lib/types'
import {
  Bot, Send, Users, Truck, Volume2,
  Loader2, Mic, RefreshCw, Zap,
  CircuitBoard, Activity, Disc, Gauge, Thermometer, Battery, Droplets, ImagePlus, Aperture, ShieldAlert, FileText,
  Car
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
        return <p key={i} className="font-semibold text-on-surface/90 mb-1">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.includes('**')) {
        return <p key={i} className="mb-1">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
      }
      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />
    })
  }

  return (
    <div className="flex flex-col min-h-full relative bg-transparent">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-navy/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-navy/[0.03] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Header — Slim & Premium — Sticky below global Navbar area */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 border-b border-overlay backdrop-blur-lg bg-white/60 dark:bg-surface-low/60 mt-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-navy shadow-lg shadow-navy/20">
            <CircuitBoard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-on-surface italic tracking-tight leading-none mb-0.5">AI Mechanic</h1>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loadingVehicle ? (
            <div className="w-8 h-6 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-muted" />
            </div>
          ) : activeVehicle ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => navigate('/dashboard/vehicles')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/5 border border-navy/10 hover:bg-navy/10 transition-colors"
            >
              <Car className="w-2.5 h-2.5 text-navy opacity-70" />
              <span className="text-[9px] font-black uppercase tracking-widest text-navy truncate max-w-[100px]">
                {activeVehicle.make}
              </span>
            </motion.button>
          ) : null}

          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-navy/70 flex items-center justify-center shadow-lg ring-2 ring-white">
            <span className="text-[10px] font-black text-white uppercase">{user?.email?.[0] ?? '?'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pt-28 space-y-6 relative z-10">
        
        {/* ── LUXURY Empty State / Diagnostic Pulsar ── */}
        {messages.length === 1 && !loading && (
          <div className="min-h-[55vh] flex flex-col items-center justify-center py-10 px-4 relative overflow-hidden">
            {/* Ambient Base — Tech Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-[0.2] dark:opacity-[0.05]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-surface-low/50 dark:to-surface-low" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-10 relative z-20"
            >
              {/* The Pulsar — Multi-layered Hero */}
              <div className="relative w-24 h-24 mx-auto mb-8">
                {/* Outer Halo Rings */}
                <motion.div 
                  className="absolute inset-0 rounded-full border-2 border-navy/5 shadow-[0_0_40px_rgba(0,18,51,0.05)]"
                  animate={{ scale: [1, 1.15, 1], rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-[-10px] rounded-full border border-navy/5"
                  animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Core Orb — Glassmorphism */}
                <div className="absolute inset-0 rounded-[28px] bg-navy flex items-center justify-center shadow-[0_20px_50px_rgba(0,18,51,0.25)] border border-white/20 z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <Bot className="w-10 h-10 text-white relative z-20" />
                  {/* Internal Glow Pulse */}
                  <motion.div 
                    className="absolute inset-0 bg-blue-400/20 blur-xl"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </div>

              <h2 className="text-3xl font-display font-black text-on-surface italic tracking-tighter mb-3 leading-none">Diagnostic Pulse</h2>
              <p className="text-muted font-medium max-w-[240px] mx-auto text-[13px] leading-relaxed tracking-tight">Active session — specify a symptom to begin AI assessment.</p>
            </motion.div>

            {/* Quick Start Grid — Luxury Cockpit Style */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-12 relative z-20">
              {ISSUE_CHIPS.map((chip, idx) => (
                <motion.button
                  key={chip.value}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05, type: 'spring', damping: 20 }}
                  onClick={() => sendMessage(chip.value)}
                  className="group relative flex items-center gap-3.5 p-4 rounded-[24px] bg-white/70 dark:bg-surface-high/70 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-navy/20 dark:hover:border-navy/40 transition-all active:scale-[0.97] overflow-hidden"
                >
                  {/* Subtle Inner Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Icon Orb */}
                  <div className="w-10 h-10 rounded-2xl bg-surface-low dark:bg-surface-low/50 flex items-center justify-center border border-overlay shadow-inner group-hover:bg-navy group-hover:scale-110 transition-all duration-300 relative z-10 overflow-hidden">
                    <chip.icon className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100" />
                  </div>
                  
                  <span className="text-[11px] font-display font-black italic uppercase tracking-tight leading-none text-on-surface/80 group-hover:text-navy group-hover:translate-x-0.5 transition-all relative z-10">{chip.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Add Vehicle Context — Ultra Minimal Nudge */}
            {!loadingVehicle && !activeVehicle && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowVehicleModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50/80 dark:bg-transparent border border-overlay hover:border-navy/30 text-muted hover:text-navy text-[9px] font-black uppercase tracking-[0.2em] transition-all relative z-20 backdrop-blur-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Configure vehicle context
              </motion.button>
            )}
          </div>
        )}

        {messages.map((msg, idx) => {
          // Skip the initial greeting bubble if we are showing the centered empty state
          if (messages.length === 1 && idx === 0) return null;
          
          return (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-lg border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <Bot className="w-4 h-4 text-white relative z-10" />
                </div>
              )}
              <div className={`max-w-[85%] lg:max-w-lg ${msg.role === 'user' ? 'order-first' : ''}`}>
                {msg.imageUrl && (
                  <div className="relative rounded-[26px] overflow-hidden mb-3 shadow-2xl border border-white/20 ring-1 ring-black/5">
                    <img src={msg.imageUrl} alt="Uploaded" className="w-full max-h-72 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                
                {/* Message Bubble — LUXE */}
                <div className={`px-6 py-4.5 rounded-[26px] text-sm leading-relaxed shadow-sm transition-all ${
                  msg.role === 'user'
                    ? 'bg-navy text-white rounded-tr-none shadow-navy/20'
                    : 'bg-white dark:bg-surface-high border border-overlay text-on-surface rounded-tl-none shadow-[0_2px_15px_rgba(0,0,0,0.02)]'
                }`}>
                  {msg.role === 'assistant' ? (
                    msg.issueData ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-display font-black text-on-surface italic tracking-tight mb-2 leading-none uppercase">{msg.issueData.issueName}</h3>
                          <p className="text-on-surface/80 leading-relaxed font-medium text-[13px]">{msg.issueData.likelyCause}</p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-navy/5">
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-navy/40">Critical Next Step</p>
                            <p className="text-[13px] font-black text-navy leading-tight italic">{msg.issueData.nextStep}</p>
                          </div>
                        </div>
                      </div>
                    ) : formatContent(msg.content)
                  ) : (
                    <p className="font-semibold">{msg.content}</p>
                  )}
                </div>

                {/* ── LUXURY Diagnosis Toolkit 2.0 ── */}
                {msg.issueData && (
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.98, y: 15 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     className="mt-6 p-6 rounded-[34px] bg-white/70 dark:bg-surface-high/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_25px_60px_rgba(0,18,51,0.15)] relative overflow-hidden group/toolkit"
                  >
                    {/* Subtle Scanning Mesh Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(#001233_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-navy/5 flex items-center justify-center border border-navy/10">
                            <Activity className="w-3.5 h-3.5 text-navy" />
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-navy/40 leading-none">Diagnostic Pulse</p>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all duration-500 ${getUrgencyColor(msg.issueData.urgencyLevel)}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {getUrgencyBadge(msg.issueData.urgencyLevel)} Assessment
                        </div>
                      </div>
                      {msg.issueData.warning && (
                        <motion.div 
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50/90 px-3.5 py-2.5 rounded-2xl border border-red-100/50 shadow-sm"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {msg.issueData.warning}
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      <motion.button 
                        onClick={() => navigate('/dashboard/mechanic')} 
                        className="flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-display font-black italic uppercase tracking-tight border transition-all bg-white/80 backdrop-blur-md border-white/60 text-on-surface hover:text-navy hover:border-navy shadow-sm"
                        whileTap={{ scale: 0.97 }}
                      >
                        <Users className="w-4 h-4" /> Human Help
                      </motion.button>
                      <motion.button 
                        onClick={() => navigate('/dashboard/towing')} 
                        className="flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-display font-black italic uppercase tracking-tight transition-all bg-navy text-white shadow-[0_15px_35px_rgba(15,23,42,0.3)] active:brightness-90 active:scale-95"
                        whileTap={{ scale: 0.97 }}
                      >
                        <Truck className="w-4 h-4" /> Emergency
                      </motion.button>
                    </div>

                    <motion.button 
                      onClick={() => {
                        setReportDiagnosis(msg.issueData!)
                        setShowReport(true)
                      }}
                      className="w-full flex items-center justify-center gap-3 py-4.5 rounded-2xl text-[10px] font-display font-black italic uppercase tracking-[0.2em] transition-all relative z-10 bg-emerald-500 text-white shadow-[0_15px_40px_rgba(16,185,129,0.25)] active:brightness-90 active:scale-[0.98]"
                      whileTap={{ scale: 0.98 }}
                    >
                      <FileText className="w-4.5 h-4.5" /> Generate Official Report
                    </motion.button>

                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-navy/5 blur-3xl opacity-0 group-hover/toolkit:opacity-100 transition-opacity" />
                  </motion.div>
                )}

                {/* Voice button */}
                {msg.role === 'assistant' && !msg.issueData && msg.id !== '0' && (
                  <motion.button 
                    onClick={() => handleSpeak(msg.content)} 
                    className="mt-2 ml-1 flex items-center gap-2 text-xs font-medium transition-colors text-muted/70 hover:text-navy"
                    whileHover={{ x: 2 }}
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen to diagnosis
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex justify-start items-start">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center mr-3 bg-surface-low dark:bg-surface-high border border-overlay">
              <Bot className="w-5 h-5 text-muted" />
            </div>
            <div className="px-5 py-4 rounded-3xl rounded-tl-none bg-surface-low dark:bg-surface-high border border-overlay flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-navy animate-spin" />
              <span className="text-sm font-medium text-muted">Analyzing data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ══ Compact Composer ══ */}
      <div className="relative z-10 bg-white/95 dark:bg-surface-low/95 backdrop-blur-md border-t border-overlay pb-[env(safe-area-inset-bottom)]">
        {/* Hidden file pickers */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

        {/* ── Refined Floating Card ── */}
        <div className="mx-4 mt-2.5 mb-2 rounded-[32px] border border-overlay bg-white dark:bg-surface-high shadow-sm
                        transition-all duration-300
                        focus-within:border-navy/30 focus-within:shadow-[0_8px_30px_rgba(0,18,51,0.06)] overflow-hidden">
          
          {/* Pro Nudge Removed — Full Experience Unlocked */}

          {/* ── Top: text input ── */}
          <div className="px-6 pt-3.5 pb-0.5">
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="waveform"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 h-[40px]"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-[2.5px] rounded-full bg-navy"
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.9,
                        delay: i * 0.04,
                        ease: 'easeInOut',
                      }}
                      style={{ height: 20, transformOrigin: 'center' }}
                    />
                  ))}
                  <span className="ml-3 text-[12px] font-black text-navy uppercase tracking-widest italic opacity-80">Listening…</span>
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
                  rows={1}
                  style={{ minHeight: 40, maxHeight: 150 }}
                  className="w-full bg-transparent outline-none resize-none
                             text-[15px] font-medium leading-[1.6]
                             text-on-surface placeholder:text-muted/50"
                  disabled={loading}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom: action bar ── */}
          <div className="flex items-center gap-1.5 px-4 pb-3">
            <div className="flex items-center gap-1 flex-1">
              {/* Media Buttons (Left) */}
              {/* Media Buttons (Left) — Always Unlocked */}
              {[
                { icon: ImagePlus, onClick: () => fileInputRef.current?.click(), title: 'Photo' },
                { icon: Aperture, onClick: () => cameraInputRef.current?.click(), title: 'Camera' },
              ].map((btn, i) => (
                <motion.button
                  key={i}
                  onClick={btn.onClick}
                  disabled={loading}
                  className="relative w-9 h-9 rounded-[16px] flex items-center justify-center transition-all
                             hover:bg-navy/5 active:scale-95 group"
                  whileTap={{ scale: 0.9 }}
                >
                  <btn.icon className="w-[18px] h-[18px] text-muted group-hover:text-navy" />
                </motion.button>
              ))}
            </div>

            {/* Primary Actions (Right) */}
            <div className="flex items-center gap-2">
              {/* Mic — Now grouped with Send */}
              <motion.button
                onClick={toggleListening}
                disabled={loading || isProcessing}
                className={`w-9 h-9 rounded-[16px] flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-400/30'
                    : 'text-muted hover:bg-navy/5 hover:text-navy active:scale-90'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {isProcessing
                  ? <RefreshCw className="w-[18px] h-[18px] animate-spin" />
                  : <Mic className={`w-[18px] h-[18px] ${isListening ? 'text-white' : ''}`} />}
              </motion.button>

              {/* Send Button */}
              <motion.button
                onClick={() => sendMessage(input)}
                disabled={loading || (!input.trim() && !isListening)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
                            transition-all duration-300 ${
                  input.trim() && !loading
                    ? 'bg-navy text-white shadow-xl shadow-navy/20 active:scale-95'
                    : 'bg-surface-low text-muted/30 cursor-not-allowed'
                }`}
                whileHover={input.trim() && !loading ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.95 }}
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Send className="w-5 h-5 translate-x-[1px] translate-y-[-0.5px]" />}
              </motion.button>
            </div>
          </div>
        </div>

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
