import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { speak, stopSpeaking, getUrgencyColor, getUrgencyBadge } from '../lib/utils'
import type { Message, DiagnosticResult } from '../lib/types'
import {
  Bot, Send, Upload, Camera, Users, Truck, Volume2,
  VolumeX, Loader2, AlertTriangle, Mic, MicOff, RefreshCw, Zap,
  CircuitBoard, Activity, Disc, Gauge, Thermometer, Battery, Droplets, ImagePlus, Aperture, ShieldAlert
} from 'lucide-react'

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

const SYSTEM_PROMPT = `You are an expert AI automotive mechanic assistant for carx.ai. 
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
            { role: 'system', content: SYSTEM_PROMPT },
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
      const errMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
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
      speak(`carx.ai says, ${text}`)
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
        return <p key={i} className="font-semibold text-soft mb-1">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.includes('**')) {
        return <p key={i} className="mb-1">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
      }
      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />
    })
  }

  return (
    <div className="flex flex-col h-full max-h-screen relative" style={{
      backgroundImage: `linear-gradient(rgba(6, 43, 61, 0.94), rgba(6, 43, 61, 0.94)), url('/section-bg.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md bg-navy/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-navy border border-[#CDFF00]/10 shadow-[0_0_20px_rgba(205,255,0,0.05)]">
            <CircuitBoard className="w-5 h-5 text-[#CDFF00]" />
          </div>
          <div>
            <h1 className="font-display font-black text-white italic tracking-tight">AI Mechanic</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Chips */}
      <div className="px-4 py-3 flex gap-2 flex-wrap border-b border-white/5 bg-navy/20">
        {ISSUE_CHIPS.map((chip) => (
          <motion.button
            key={chip.value}
            onClick={() => sendMessage(chip.value)}
            disabled={loading}
            className="chip flex items-center gap-1.5 text-[11px] font-bold !py-2 !px-3 border-white/5 bg-white/[0.03] hover:bg-white/[0.08]"
            whileHover={{ y: -2, borderColor: 'rgba(205, 255, 0, 0.2)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <chip.icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            {chip.label}
          </motion.button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1 bg-navy border border-[#CDFF00]/20">
                <Bot className="w-4 h-4" fill="#CDFF00" stroke="#CDFF00" />
              </div>
            )}
            <div className={`max-w-sm lg:max-w-lg ${msg.role === 'user' ? 'order-first' : ''}`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Uploaded" className="rounded-2xl mb-2 max-h-40 object-cover" />
              )}
              <div className={`px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-soft rounded-br-lg'
                  : 'text-on-surface rounded-bl-lg'
              }`} style={msg.role === 'user'
                ? { background: '#CDFF00', color: '#062B3D', fontWeight: 600 }
                : { background: 'rgba(13,58,82,0.6)', border: '1px solid rgba(87,214,232,0.08)' }
              }>
                {msg.role === 'assistant' ? (
                  msg.issueData ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-black text-white italic tracking-tight mb-2">{msg.issueData.issueName}</h3>
                        <p className="text-white/70 leading-relaxed font-medium">{msg.issueData.likelyCause}</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Immediate Next Step</p>
                          <p className="text-sm font-bold text-[#CDFF00] leading-tight">{msg.issueData.nextStep}</p>
                        </div>
                        
                        {msg.issueData.followUp && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Follow-up</p>
                            <p className="text-xs font-medium text-white/80">{msg.issueData.followUp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : formatContent(msg.content)
                ) : msg.content}
              </div>

              {/* Urgency badge + Actions */}
              {msg.issueData && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit ${getUrgencyColor(msg.issueData.urgencyLevel)}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {getUrgencyBadge(msg.issueData.urgencyLevel)} Urgency
                    </div>
                    {msg.issueData.warning && (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 w-fit">
                        <ShieldAlert className="w-3 h-3" />
                        {msg.issueData.warning}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap pt-1">
                    <motion.button 
                      onClick={() => navigate('/dashboard/mechanic')} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-navy shadow-sm" 
                      style={{ background: '#CDFF00' }}
                      whileHover={{ y: -1, boxShadow: '0 4px 15px rgba(205, 255, 0, 0.3)' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Users className="w-3 h-3" /> Human Mechanic
                    </motion.button>
                    <motion.button 
                      onClick={() => navigate('/dashboard/towing')} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-navy shadow-sm" 
                      style={{ background: '#CDFF00' }}
                      whileHover={{ y: -1, boxShadow: '0 4px 15px rgba(205, 255, 0, 0.3)' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Truck className="w-3 h-3" /> Get Towing
                    </motion.button>
                    <motion.button 
                      onClick={() => handleSpeak(msg.content)} 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${speaking ? 'bg-cyan-DEFAULT/20 text-cyan-DEFAULT border border-cyan-DEFAULT/30' : 'bg-white/5 text-muted border border-white/10 hover:text-soft'}`}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {speaking ? 'Stop' : 'Listen'}
                    </motion.button>
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && !msg.issueData && msg.id !== '0' && (
                <motion.button 
                  onClick={() => handleSpeak(msg.content)} 
                  className="mt-1.5 flex items-center gap-1 text-xs text-muted hover:text-cyan-DEFAULT transition-colors"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Volume2 className="w-3 h-3" />
                  Listen
                </motion.button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2" style={{ background: 'rgba(87,214,232,0.1)' }}>
              <Bot className="w-4 h-4 text-cyan-DEFAULT" />
            </div>
            <div className="px-4 py-3 rounded-3xl rounded-bl-lg flex items-center gap-2" style={{ background: 'rgba(13,58,82,0.6)', border: '1px solid rgba(87,214,232,0.08)' }}>
              <Loader2 className="w-4 h-4 text-cyan-DEFAULT animate-spin" />
              <span className="text-sm text-muted">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 flex gap-3 border-t border-white/5 bg-navy/20">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="chip flex-1 justify-center gap-2 !py-2.5 !rounded-xl border-white/5 bg-white/[0.04] text-[11px] font-black uppercase tracking-widest text-white/60"
          disabled={loading}
          whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}
          whileTap={{ scale: 0.97 }}
        >
          <ImagePlus className="w-4 h-4" /> Upload
        </motion.button>
        <motion.button
          onClick={() => cameraInputRef.current?.click()}
          className="chip flex-1 justify-center gap-2 !py-2.5 !rounded-xl border-white/5 bg-white/[0.04] text-[11px] font-black uppercase tracking-widest text-white/60"
          disabled={loading}
          whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }}
          whileTap={{ scale: 0.97 }}
        >
          <Aperture className="w-4 h-4" /> Take Photo
        </motion.button>
      </div>

      {/* Input */}
      <div className="p-4 pt-2 border-t border-white/5">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder={isListening ? "Listening..." : "Describe your car issue..."}
              rows={1}
              className="input-field resize-none pr-12"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={loading}
            />
            {isListening && (
              <div className="absolute left-0 bottom-full mb-2 w-full animate-pulse flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#CDFF00]/10 border border-[#CDFF00]/20">
                <div className="w-1.5 h-1.5 rounded-full bg-[#CDFF00]" />
                <span className="text-[10px] uppercase tracking-wider text-[#CDFF00] font-bold">Recording Speech...</span>
              </div>
            )}
          </div>
          
          <motion.button
            onClick={toggleListening}
            disabled={loading || isProcessing}
            className={`p-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center ${
              isListening 
                ? 'bg-[#CDFF00] text-navy shadow-[#CDFF00]/40' 
                : 'bg-navy border border-white/10 text-muted hover:text-soft'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? {
              boxShadow: [
                "0 0 0px rgba(205,255,0,0)",
                "0 0 20px rgba(205,255,0,0.4)",
                "0 0 0px rgba(205,255,0,0)"
              ]
            } : {}}
            transition={isListening ? {
              repeat: Infinity,
              duration: 2
            } : {}}
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </motion.button>

          <motion.button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim() || isListening}
            className="p-3 flex-shrink-0 rounded-xl text-navy font-bold shadow-[0_0_15px_rgba(205,255,0,0.3)] disabled:opacity-50"
            style={{ background: '#CDFF00' }}
            whileHover={!loading && input.trim() && !isListening ? { 
              scale: 1.05, 
              boxShadow: '0 0 25px rgba(205,255,0,0.5)',
              filter: 'brightness(1.1)' 
            } : {}}
            whileTap={!loading && input.trim() && !isListening ? { scale: 0.92 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
