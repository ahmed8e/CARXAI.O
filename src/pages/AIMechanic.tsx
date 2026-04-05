import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUrgencyColor, getUrgencyBadge } from '../lib/utils'
import { useTTS } from '../lib/useTTS'
import ListenButton from '../components/ui/ListenButton'
import type { Message, DiagnosticResult } from '../lib/types'
import { Loader2 } from 'lucide-react'
import {
  Bot, Send,
  Mic, RefreshCw, Zap,
  CircuitBoard, Activity, Disc, Gauge, Thermometer, Battery, Droplets, ImagePlus, Aperture,
  Car, AudioLines, AlertTriangle, Wrench
} from 'lucide-react'
import VehicleAddModal from '../components/VehicleAddModal'
import type { Database } from '../lib/types'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

const ISSUE_CHIPS = [
  { label: 'Engine light', value: 'My check engine light is on', icon: Activity },
  { label: 'Car won\'t start', value: 'My car won\'t start', icon: Zap },
  { label: 'Strange noise', value: 'I hear a strange noise from my car', icon: AudioLines },
  { label: 'Brake warning', value: 'My brake warning light is on', icon: Disc },
  { label: 'Flat tire', value: 'I have a flat tire', icon: Gauge },
  { label: 'Overheating', value: 'My car is overheating', icon: Thermometer },
  { label: 'Battery dead', value: 'My car battery seems dead', icon: Battery },
  { label: 'Fluid leak', value: 'I see fluid leaking under my car', icon: Droplets },
]

const SYSTEM_PROMPT = `You are "Sarge," the world's most direct, safety-first AI Automotive Diagnostic Expert.
Your mission: Provide immediate, non-technical safety guidance to drivers in distress, especially those with dashboard warning lights.

CRITICAL RULES:
1. ONLY return raw JSON. No markdown backticks, no conversational filler before or after the JSON.
2. NEVER mention internal systems, searching, or "having trouble." 
3. EXPERT CONFIDENCE: If the image/text shows a likely issue (like a warning light), give the answer directly. Mention uncertainty ONLY if absolutely necessary.
4. RESPONSE STYLE: Short, clear, practical, non-technical, and helpful. No over-explaining.
5. Response structure (STRICT 5-POINT FORMAT):
   - issueName: Short, clear name of the likely problem (e.g., "Traction Control Warning").
   - likelyCause: Non-technical explanation of the issue.
   - canDrive: Boolean (true/false). Safety is priority #1.
   - driveWhy: Direct reasoning for the "Can you keep driving" status (e.g., "Risk of engine seizure").
   - urgencyLevel: low, medium, high, or stop_driving.
   - nextStep: One practical, immediate action (e.g., "Pull over and stop immediately").
   - spokenSummary: A 1-sentence version of the above for voice synthesis.

Format: { "issueName": "...", "likelyCause": "...", "canDrive": true/false, "driveWhy": "...", "urgencyLevel": "...", "nextStep": "...", "spokenSummary": "..." }`;

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
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const { status, stop, prefetch } = useTTS({
    currentAudioRef
  })

  // Vehicle States
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null)
  const [loadingVehicle, setLoadingVehicle] = useState(true)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [diagnosticHistory, setDiagnosticHistory] = useState<string>('')
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isPreparingAudio, setIsPreparingAudio] = useState(false)

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

      // Fetch last 5 diagnostic sessions for context
      if (user?.id) {
        const { data: history } = await supabase
          .from('ai_chats')
          .select('issue_name, likely_cause, created_at')
          .eq('user_id', user.id)
          .not('issue_name', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5)

        if (history && (history as any[]).length > 0) {
          const historySummary = (history as any[]).map(h => 
            `- ${new Date(h.created_at).toLocaleDateString()}: ${h.issue_name} (Cause: ${h.likely_cause})`
          ).join('\n')
          setDiagnosticHistory(historySummary)
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

  const sendMessage = async (content: string, imageUrl?: string, chipLabel?: string) => {
    if (!content.trim() && !imageUrl) return
    stop() // Interrupt any playing audio
    setLoading(true)
    setInput('')

    addMessage({ role: 'user', content, imageUrl })

    try {
      const symptomContext = chipLabel ? `USER SELECTED SYMPTOM: ${chipLabel}` : '';
      
      const vehicleContext = activeVehicle ? `
VEHICLE CONTEXT:
- Brand: ${activeVehicle.make}
- Model: ${activeVehicle.model}
- Year: ${activeVehicle.year}
- Fuel Type: ${activeVehicle.fuel_type || 'Unknown'}
- Engine: ${activeVehicle.engine_type || 'Unknown'}
- Gearbox: ${activeVehicle.gearbox || 'Unknown'}
- Mileage: ${activeVehicle.mileage || 'Unknown'} km
- VIN: ${activeVehicle.vin || 'Not provided'}` 
: 'VEHICLE CONTEXT: Not available. Provide a general diagnosis.'

      const historyContext = diagnosticHistory ? `
DIAGNOSTIC HISTORY (Last 5 events):
${diagnosticHistory}
(Note: Use this history to spot recurring patterns or unresolved issues.)` 
: 'DIAGNOSTIC HISTORY: Initial session. No previous records.'

      // API Logic moved to server-side proxy (/api/chat) for security and CORS

      // Use our serverless proxy to avoid CORS issues and protect the API key
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          stream: true,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'system', content: `${symptomContext}\n\n${vehicleContext}\n\n${historyContext}` },
            ...messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
            {
              role: 'user',
              content: imageUrl ? [
                { type: 'text', text: content || 'Analyze this car issue image.' },
                { type: 'image_url', image_url: { url: imageUrl } }
              ] : content
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 800,
        }),
      })

      if (!response.body) throw new Error('No response body')
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedJSON = ''
      
      setStreamingMessage('Analyzing systems...')

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.replace('data: ', ''))
              const delta = json.choices[0]?.delta?.content || ''
              accumulatedJSON += delta
              
              // Perceived speed: Show the user something is happening
              // Since it's JSON, we can't easily show partial text without regex
              // but we can update a generic status or try to extract likelyCause
              if (accumulatedJSON.includes('"likelyCause": "')) {
                const parts = accumulatedJSON.split('"likelyCause": "')
                if (parts.length > 1) {
                  const likelyCausePartial = parts[1].split('"')[0]
                  if (likelyCausePartial) {
                    setStreamingMessage(likelyCausePartial)
                  }
                }
              }

              // Extract spokenSummary as it appears
              if (accumulatedJSON.includes('"spokenSummary": "')) {
                const parts = accumulatedJSON.split('"spokenSummary": "')
                if (parts.length > 1) {
                  const spokenSummaryPartial = parts[1].split('"')[0]
                  if (spokenSummaryPartial.length > 10 && !isPreparingAudio) {
                    // Start pre-fetching the summary as soon as we have a decent chunk
                    setIsPreparingAudio(true)
                    prefetch(spokenSummaryPartial).finally(() => setIsPreparingAudio(false))
                  }
                }
              }
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      let issueData: DiagnosticResult | undefined
      let finalDisplayContent = ''

      const extractJSON = (text: string) => {
        try {
          return JSON.parse(text.trim())
        } catch (e) {
          const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
          if (match && match[1]) {
            try { return JSON.parse(match[1].trim()) } catch (e2) { }
          }
          const firstBrace = text.indexOf('{')
          const lastBrace = text.lastIndexOf('}')
          if (firstBrace !== -1 && lastBrace !== -1) {
            try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)) } catch (e3) { }
          }
          throw new Error('No valid JSON found')
        }
      }

      const getEmergencyFallback = (input: string): DiagnosticResult | null => {
        const lowerInput = input.toLowerCase()
        if (lowerInput.includes('flat tire') || lowerInput.includes('puncture')) return {
          issueName: 'Flat Tire Detected',
          likelyCause: 'A puncture from road debris or a faulty valve stem.',
          canDrive: false,
          driveWhy: 'Driving on a flat tire will permanently damage your rim and can cause loss of vehicle control.',
          urgencyLevel: 'high',
          nextStep: 'Stop immediately in a safe location and change to a spare or call for professional towing.',
          mechanicRecommended: true,
          towingRecommended: true,
          spokenSummary: 'You have a flat tire. Stop driving immediately to stay safe and protect your rims.'
        }
        if (lowerInput.includes('battery') || lowerInput.includes('won\'t start')) return {
          issueName: 'Potential Battery Failure',
          likelyCause: 'Corroded terminals, battery age, or an alternator issue.',
          canDrive: false,
          driveWhy: 'The engine lacks sufficient power to turn over or may stall unexpectedly.',
          urgencyLevel: 'medium',
          nextStep: 'Check battery terminals for corrosion and attempt a jump-start using high-quality cables.',
          mechanicRecommended: true,
          towingRecommended: false,
          spokenSummary: 'Your battery is likely the culprit. Try a jump-start or check the connections.'
        }
        if (lowerInput.includes('engine light') || lowerInput.includes('check engine')) return {
          issueName: 'Check Engine Indicator',
          likelyCause: 'Varies from a loose gas cap to a critical sensor malfunction.',
          canDrive: true,
          driveWhy: 'The vehicle is likely safe for a short trip to a shop unless the light is flashing.',
          urgencyLevel: 'medium',
          nextStep: 'Ensure your gas cap is tight and get an OBD-II scan at a local garage soon.',
          mechanicRecommended: true,
          towingRecommended: false,
          spokenSummary: 'The check engine light is on. It\'s usually safe for a short drive, but don\'t ignore it.'
        }
        if (lowerInput.includes('overheating') || lowerInput.includes('smoke') || lowerInput.includes('steam')) return {
          issueName: 'Engine Overheating Alert',
          likelyCause: 'Low coolant, a burst hose, or a failing water pump.',
          canDrive: false,
          driveWhy: 'Excessive heat will melt engine components, leading to total engine destruction.',
          urgencyLevel: 'stop_driving',
          nextStep: 'Pull over and shut off the engine IMMEDIATELY. Do not open the hood if steam is present.',
          mechanicRecommended: true,
          towingRecommended: true,
          spokenSummary: 'Your engine is overheating. Pull over and stop immediately to prevent a total rebuild.'
        }
        if (lowerInput.includes('noise') || lowerInput.includes('grinding') || lowerInput.includes('squeak')) return {
          issueName: 'Mechanical Noise Issue',
          likelyCause: 'Likely worn brake pads, a failing wheel bearing, or a loose belt.',
          canDrive: true,
          driveWhy: 'Most noises are early warning signs, but safe for a cautious drive to a mechanic.',
          urgencyLevel: 'medium',
          nextStep: 'Listen for when the noise changes (turning, braking) and book a diagnostic check.',
          mechanicRecommended: true,
          towingRecommended: false,
          spokenSummary: 'That strange noise sounds like a mechanical component wearing out. Get it looked at soon.'
        }
        return null
      }

      try {
        const parsed = extractJSON(accumulatedJSON)
        issueData = parsed
        finalDisplayContent = parsed.likelyCause || parsed.issueName
        setIsPreparingAudio(true)
        prefetch(parsed.spokenSummary || finalDisplayContent).finally(() => setIsPreparingAudio(false))
      } catch (err) {
        console.error('Failed to parse AI JSON:', accumulatedJSON)
        const fallback = getEmergencyFallback(content)
        if (fallback) {
          issueData = fallback
          finalDisplayContent = fallback.likelyCause
        } else {
          finalDisplayContent = "I've analyzed the situation, and while I'm still processing the fine details, my primary advice is to exercise extreme caution. Check your fluid levels and dash lights, then try describing the symptoms again so I can give you a pinpoint diagnosis."
        }
      }

      const assistantMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: finalDisplayContent,
        timestamp: new Date(),
        issueData,
      }
      
      setStreamingMessage('')
      setMessages(prev => [...prev, assistantMsg])

      // Save to Supabase
      if (user && issueData) {
        // @ts-ignore
        await supabase.from('ai_chats').insert({
          user_id: user.id,
          user_message: content,
          ai_response: finalDisplayContent,
          issue_name: issueData.issueName,
          likely_cause: issueData.likelyCause,
          urgency_level: issueData.urgencyLevel,
        })
      }
    } catch (err) {
      console.error('AI Error:', err)
      const errorResult: DiagnosticResult = {
        issueName: 'Diagnosis Unavailable',
        likelyCause: 'I am currently unable to reach the diagnostic analysis server. This could be due to a network interruption or temporary service maintenance.',
        urgencyLevel: 'medium',
        nextStep: 'Please check your internet connection and try submitting your request again in a few moments.',
        canDrive: true,
        driveWhy: 'Connection to diagnostic server interrupted.',
        mechanicRecommended: false,
        towingRecommended: false,
        spokenSummary: 'I am having trouble connecting to my diagnostic systems right now.'
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorResult.likelyCause,
        timestamp: new Date(),
        issueData: errorResult,
      }])
    } finally {
      setLoading(false)
      setStreamingMessage('')
    }
  }

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      sendMessage('I\'ve uploaded a photo of my car issue. Please analyze it.', base64)
    }
    reader.readAsDataURL(file)
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
            {/* Ambient Base — Subtle Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white dark:via-surface-low/40 dark:to-surface-low" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-10 relative z-20"
            >
              {/* The Pulsar — Multi-layered Hero */}
              <div className="relative w-24 h-24 mx-auto mb-8">
                {/* Subtle outer glow */}
                <motion.div
                  className="absolute inset-[-4px] rounded-full bg-navy/[0.02] blur-xl"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
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

              <h2 className="text-2xl font-display font-bold text-on-surface tracking-tight mb-3 leading-none">Diagnostic Center</h2>
              <p className="text-muted font-medium max-w-[240px] mx-auto text-[13px] leading-relaxed tracking-tight">Active session — describe your symptom to begin AI assessment.</p>
            </motion.div>

            {/* Quick Start Grid — Luxury Cockpit Style */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-12 relative z-20">
              {ISSUE_CHIPS.map((chip, idx) => (
                <motion.button
                  key={chip.value}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05, type: 'spring', damping: 20 }}
                  onClick={() => sendMessage(chip.value, undefined, chip.label)}
                  className="group relative flex items-center gap-3.5 p-4 rounded-[24px] bg-white/70 dark:bg-surface-high/70 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-navy/20 dark:hover:border-navy/40 transition-all active:scale-[0.97] overflow-hidden"
                >
                  {/* Subtle Inner Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Icon Orb */}
                  <div className="w-10 h-10 rounded-2xl bg-surface-low dark:bg-surface-low/50 flex items-center justify-center border border-overlay shadow-inner group-hover:bg-navy group-hover:scale-110 transition-all duration-300 relative z-10 overflow-hidden">
                    <chip.icon className="w-5 h-5 text-muted group-hover:text-white transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100" />
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wide leading-none text-on-surface/80 group-hover:text-navy group-hover:translate-x-0.5 transition-all relative z-10">{chip.label}</span>
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
                <div className={`px-6 py-4.5 rounded-[26px] text-sm leading-relaxed shadow-sm transition-all ${msg.role === 'user'
                    ? 'bg-navy text-white rounded-tr-none shadow-navy/20'
                    : 'bg-white dark:bg-surface-high border border-overlay text-on-surface rounded-tl-none shadow-[0_2px_15px_rgba(0,0,0,0.02)]'
                  }`}>
                  {msg.role === 'assistant' ? (
                    msg.issueData ? (
                      <div className="space-y-5">
                        {/* 1. Likely Problem */}
                        <div>
                          <h3 className="text-lg font-bold text-navy tracking-tight mb-1">{msg.issueData.issueName}</h3>
                          <p className="text-on-surface/80 leading-relaxed text-[13px] font-medium">{msg.issueData.likelyCause}</p>
                        </div>

                        {/* 2 & 3. Driving Safety + Why */}
                        <div className="pt-4 border-t border-navy/5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${msg.issueData.canDrive ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                              {msg.issueData.canDrive ? (
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              ) : (
                                <AlertTriangle className={`w-3 h-3 ${msg.issueData.canDrive ? 'text-emerald-500' : 'text-rose-500'}`} />
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/60">Can you keep driving?</p>
                          </div>
                          <div className="flex flex-col gap-1.5 pl-7">
                            <p className={`text-sm font-bold ${msg.issueData.canDrive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {msg.issueData.canDrive ? 'Yes, but be careful' : 'No, stop as soon as safe'}
                            </p>
                            <p className="text-[12px] text-on-surface/60 italic leading-tight">{msg.issueData.driveWhy}</p>
                          </div>
                        </div>

                        {/* 4. Danger Level */}
                        <div className="pt-4 border-t border-navy/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-3.5 h-3.5 text-navy/30" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-navy/60">Danger Level</p>
                          </div>
                          <div className="pl-7">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getUrgencyColor(msg.issueData.urgencyLevel)}`}>
                              {getUrgencyBadge(msg.issueData.urgencyLevel)}
                            </div>
                          </div>
                        </div>

                        {/* 5. Next Step */}
                        <div className="pt-4 border-t border-navy/5 bg-navy/[0.02] -mx-6 -mb-4.5 px-6 pb-4.5 rounded-b-[26px]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Wrench className="w-3.5 h-3.5 text-navy/40" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-navy/40">Next Step</p>
                          </div>
                          <p className="text-[13px] font-bold text-navy leading-snug">{msg.issueData.nextStep}</p>
                        </div>
                      </div>
                    ) : formatContent(msg.content)
                  ) : (
                    <p className="font-semibold">{msg.content}</p>
                  )}
                </div>

                {/* Listen button — plain AI messages & structured diagnoses */}
                {msg.role === 'assistant' && msg.id !== '0' && (
                  <ListenButton
                    currentAudioRef={currentAudioRef}
                    text={
                      msg.issueData
                        ? (msg.issueData.spokenSummary || `${msg.issueData.issueName}. ${msg.issueData.likelyCause} ${msg.issueData.nextStep}`)
                        : msg.content
                    }
                  />
                )}


              </div>
            </motion.div>
          );
        })}

        {(loading || streamingMessage) && (
          <div className="flex justify-start items-start">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center mr-3 bg-navy shadow-lg border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <Bot className="w-4 h-4 text-white relative z-10" />
            </div>
            <div className="space-y-2 max-w-[85%] lg:max-w-lg">
              <div className="px-6 py-4.5 rounded-[26px] rounded-tl-none bg-white dark:bg-surface-high border border-overlay text-on-surface shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="w-3 h-3 text-navy animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy/60">
                      {streamingMessage ? 'Live Analysis' : 'Connecting to Systems'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface/90 font-medium">
                    {streamingMessage || 'Initializing diagnostic modules...'}
                  </p>
                </div>
              </div>

              {isPreparingAudio && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy/5 border border-navy/10 w-fit ml-2"
                >
                  <AudioLines className="w-3 h-3 text-navy animate-pulse" />
                  <span className="text-[10px] font-bold text-navy/70 uppercase tracking-wider">Preparing voice...</span>
                </motion.div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Voice Activity Indicator */}
      <AnimatePresence>
        {(status === 'playing' || status === 'loading') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 dark:bg-surface-high/90 backdrop-blur-xl border border-navy/20 shadow-2xl shadow-navy/10 pointer-events-none"
          >
            <div className="flex items-end gap-1 h-3">
              {[0, 0.1, 0.05, 0.15].map((delay, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-navy"
                  animate={{ height: status === 'playing' ? [4, 12, 4] : [4, 6, 4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay }}
                />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-navy">
              {status === 'playing' ? 'Premium Voice Active' : 'Generating Voice...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
                className={`w-9 h-9 rounded-[16px] flex items-center justify-center transition-all ${isListening
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
                            transition-all duration-300 ${input.trim() && !loading
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
