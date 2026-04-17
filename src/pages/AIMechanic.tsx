import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUrgencyColor, getUrgencyBadge } from '../lib/utils'
import { useTTS } from '../lib/useTTS'
import ListenButton from '../components/ui/ListenButton'
import type { Message, DiagnosticResult } from '../lib/types'
import {
  Loader2, CheckCircle, Bot, Zap, Activity,
  AlertTriangle, Wrench, Aperture, FileText,
  MapPin, AudioLines, Send, Mic, RefreshCw,
  ImagePlus, Lock, CarFront
} from 'lucide-react'
import VehicleAddModal from '../components/VehicleAddModal'
import MechanicReport from '../components/MechanicReport'
import UpgradeGate from '../components/chat/UpgradeGate'
import { useSubscription } from '../hooks/useSubscription'
import type { Database } from '../lib/types'

type Vehicle = Database['public']['Tables']['vehicles']['Row']

const FREE_MESSAGE_LIMIT = 2
const RESET_WINDOW_HOURS = 5



export default function AIMechanic() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
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
  const [showReport, setShowReport] = useState(false)
  const [reportDiagnosis, setReportDiagnosis] = useState<DiagnosticResult | null>(null)
  const [isGated, setIsGated] = useState(false)
  const [responseMode, setResponseMode] = useState<'fast_answer' | 'expert_answer'>('fast_answer')
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [isImageGated, setIsImageGated] = useState(false)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [isImageProcessing, setIsImageProcessing] = useState(false)
  const { isPaid, isPro, isAdvanced, loading: subLoading, refreshSubscription } = useSubscription()

  // Effect 1: Basic scroll to bottom during typing/user-send
  useEffect(() => {
    if (loading || (messages.length > 0 && messages[messages.length - 1].role === 'user')) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, loading])

  // Effect 2: Center AI response after generation completes
  useEffect(() => {
    if (!loading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        // Find the actual DOM element for the last bubble
        // Using a short timeout to ensure the card is fully rendered and the layout shifted
        setTimeout(() => {
          const bubbles = document.querySelectorAll('.assistant-card-bubble');
          const lastBubble = bubbles[bubbles.length - 1];
          if (lastBubble) {
            // Precise alignment: target the top of the bubble sitting ~100px from screen top
            const topOffset = 110;
            const rect = lastBubble.getBoundingClientRect();
            const scrollContainer = lastBubble.closest('.overflow-y-auto');

            if (scrollContainer) {
              const currentScroll = scrollContainer.scrollTop;
              const targetScroll = currentScroll + rect.top - topOffset;

              scrollContainer.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
              });
            }
          }
        }, 150);
      }
    }
  }, [loading, messages.length])

  useEffect(() => {
    if (user) {
      fetchActiveVehicle()
    }
  }, [user])

  useEffect(() => {
    if (user && !subLoading) {
      if (isPaid) {
        setIsGated(false)
      } else {
        fetchUsageCount()
      }
    }
  }, [isPaid, subLoading, user])

  // Polling for status when gated (Immediate Admin Assignment Sync)
  useEffect(() => {
    if (!isGated) return

    // Poll every 5 seconds while gated to see if an admin upgraded the user
    const interval = setInterval(() => {
      refreshSubscription()
    }, 5000)

    return () => clearInterval(interval)
  }, [isGated, refreshSubscription])

  const [canShareReport, setCanShareReport] = useState(true)

  const fetchUsageCount = async (): Promise<boolean> => {
    await refreshSubscription()
    if (!user || isAdvanced) return false

    try {
      const { data: rawUsage, error: fetchError } = await (supabase as any)
        .from('plan_usage')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      // Initialize if missing
      const usage = rawUsage as any;
      if (!usage) {
        await (supabase as any).from('plan_usage').insert({ user_id: user.id })
        setIsGated(false)
        setCanShareReport(true)
        return false
      }

      // Check Reset Window (5 hours)
      const lastReset = new Date(usage.last_reset_at).getTime()
      const fiveHoursAgo = Date.now() - (RESET_WINDOW_HOURS * 60 * 60 * 1000)

      let chatCount = usage.chat_count
      let reportCount = usage.report_count

      if (lastReset < fiveHoursAgo) {
        // Window expired, reset!
        const { data: resetData, error: resetError } = await (supabase as any)
          .from('plan_usage')
          .update({
            chat_count: 0,
            report_count: 0,
            image_count: 0,
            last_reset_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .maybeSingle()

        if (!resetError && resetData) {
          chatCount = 0
          reportCount = 0
        }
      }

      // Exact Enforcement for Free Plan
      if (!isPaid) {
        const chatGated = chatCount >= FREE_MESSAGE_LIMIT
        const imgGated = usage.image_count >= 1

        setIsLimitReached(chatGated)
        setIsGated(chatGated)
        setIsImageGated(imgGated)
        setCanShareReport(reportCount < 1) // Only 1 report per 5h
        return chatGated
      }

      // Pro Tier Logic (Reports only, AI is unlimited)
      if (isPro) {
        // Pro report limit is handled differently (monthly) but let's keep it simple here
        // We'll stick to the existing monthly check for Pro
        const resetThresholdPro = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { count: monthlyReports } = await supabase
          .from('shared_reports')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .gt('created_at', resetThresholdPro)

        setIsGated(false)
        setCanShareReport((monthlyReports || 0) < 15)
        return false
      }

    } catch (err) {
      console.error('[Carxai] Usage check failed:', err)
    }
    return false
  }

  const incrementUsage = async (type: 'chat' | 'report' | 'image') => {
    if (!user || isAdvanced) return

    try {
      // Get current usage to increment
      const { data: rawUsageInc } = await (supabase as any)
        .from('plan_usage')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      const usage = rawUsageInc as any;
      if (!usage) return

      const update: any = {}
      if (type === 'chat') update.chat_count = usage.chat_count + 1
      if (type === 'report') update.report_count = usage.report_count + 1
      if (type === 'image') update.image_count = usage.image_count + 1

      await (supabase as any)
        .from('plan_usage')
        .update(update)
        .eq('user_id', user.id)
    } catch (err) {
      console.error('[Carxai] Failed to increment usage:', err)
    }
  }

  const fetchActiveVehicle = async () => {
    setLoadingVehicle(true)
    try {
      if (!user?.id) return

      const { data: rawVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)

      const vehicles = rawVehicles as any[] | null;

      if (vehicles && vehicles.length > 0) {
        // Prefer default vehicle, otherwise take latest
        const defaultVehicle = vehicles.find(v => v.is_default) || vehicles[0];
        console.log('[Carxai AI] Active vehicle loaded:', defaultVehicle.make, defaultVehicle.model);
        setActiveVehicle(defaultVehicle as Vehicle)
      } else {
        console.log('[Carxai AI] No active vehicle found for user.');
        setActiveVehicle(null);
      }

      // Fetch last 5 diagnostic sessions for context
      if (user?.id) {
        const { data: history } = await supabase
          .from('ai_chats')
          .select('issue_name, created_at')
          .eq('user_id', user.id)
          .not('issue_name', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5)

        if (history && (history as any[]).length > 0) {
          const historySummary = (history as any[]).map(h =>
            `- ${new Date(h.created_at).toLocaleDateString()}: ${h.issue_name}`
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
          // If we are in "audio mode", we clear any typed text or just replace it
          setInput(transcript)
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
  type AdvancedResolvedKind =
    | 'expert_result'
    | 'followup_result'
    | 'soft_fallback'
    | 'hard_fallback'

  type ParsedPayloadResult = {
    success: boolean
    parsed: any | null
    reason?: string
  }

  const extractStructuredPayload = (raw: string): ParsedPayloadResult => {
    if (!raw || !raw.trim()) {
      return { success: false, parsed: null, reason: 'empty_response' }
    }

    const cleaned = raw.trim()

    try {
      return { success: true, parsed: JSON.parse(cleaned) }
    } catch { }

    const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (fenced?.[1]) {
      try {
        return { success: true, parsed: JSON.parse(fenced[1].trim()) }
      } catch { }
    }

    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return {
          success: true,
          parsed: JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
        }
      } catch { }
    }

    return { success: false, parsed: null, reason: 'json_parse_failed' }
  }

  const normalizeAdvancedDiagnosis = (parsed: any): DiagnosticResult | null => {
    if (!parsed || typeof parsed !== 'object') return null

    if (parsed?.issue && !parsed?.issue_title) parsed.issue_title = parsed.issue
    if (parsed?.towRecommended !== undefined && parsed?.tow_recommended === undefined) {
      parsed.tow_recommended = parsed.towRecommended
    }

    const followupQuestions = Array.isArray(parsed.followup_questions)
      ? parsed.followup_questions.filter(Boolean)
      : []

    const needsFollowup =
      parsed.needs_followup === true || followupQuestions.length > 0

    const inferredMode =
      parsed.mode === 'expert_answer' || parsed.mode === 'fast_answer'
        ? parsed.mode
        : (parsed.issue_title || parsed.normalized_issue || parsed.issueName || parsed.explanation || parsed.next_step)
          ? 'expert_answer'
          : undefined

    const rawSeverity = parsed.severity || parsed.urgency || 'medium'
    const severity: 'low' | 'medium' | 'high' =
      rawSeverity === 'low' ? 'low' :
        rawSeverity === 'high' || rawSeverity === 'emergency' ? 'high' :
          'medium'

    const issueName =
      parsed.issue_title ||
      parsed.normalized_issue ||
      parsed.issueName ||
      parsed.warning_light_name ||
      (needsFollowup ? 'Need More Details' : null)

    const explanation =
      parsed.explanation ||
      parsed.likelyCause ||
      parsed.cause ||
      parsed.diagnosis ||
      null

    const nextStep =
      parsed.next_step ||
      (needsFollowup
        ? 'Please answer the follow-up question so I can refine the diagnosis.'
        : null)

    const hasUsableCore = !!(issueName || explanation || needsFollowup)
    if (!hasUsableCore) return null

    const canDrive =
      typeof parsed.can_drive === 'boolean'
        ? parsed.can_drive
        : !Boolean(parsed.tow_recommended)

    return {
      ...parsed,
      mode: inferredMode || 'expert_answer',
      issueName: issueName || 'Diagnostic Report',
      normalized_issue: parsed.normalized_issue || issueName || 'Diagnostic Report',
      likelyCause: explanation || 'Logic-based diagnostic assessment.',
      explanation: explanation || 'No detailed explanation provided.',
      severity,
      urgencyLevel:
        (severity === 'high' || parsed.tow_recommended) && canDrive === false
          ? 'stop_driving'
          : severity,
      can_drive: canDrive,
      driveWhy: explanation || parsed.driveWhy || 'Safety status based on detected symptoms.',
      next_step: nextStep || 'Consult a professional for further verification.',
      needs_followup: needsFollowup,
      followup_questions: followupQuestions,
      towingRecommended: !!(parsed.tow_recommended ?? parsed.towingRecommended),
      tow_recommended: !!(parsed.tow_recommended ?? parsed.towingRecommended),
      confidence: parsed.confidence || 'medium',
    } as DiagnosticResult
  }

  const validateAdvancedDiagnosis = (
    data: DiagnosticResult | null
  ): { valid: boolean; kind?: AdvancedResolvedKind; reason?: string } => {
    if (!data) return { valid: false, reason: 'normalized_null' }

    if (data.needs_followup) {
      return { valid: true, kind: 'followup_result' }
    }

    const hasCore = !!(data.issueName && data.explanation && data.next_step)
    if (hasCore) {
      return { valid: true, kind: 'expert_result' }
    }

    return { valid: false, reason: 'missing_core_fields' }
  }

  const buildSoftFallback = (imageUrl?: string): DiagnosticResult => ({
    mode: 'expert_answer',
    issueName: imageUrl ? 'Unreadable Dashboard Photo' : 'Need More Details',
    normalized_issue: imageUrl ? 'Unreadable Dashboard Photo' : 'Need More Details',
    explanation: imageUrl
      ? 'We could not confidently read this dashboard photo. The image may be blurry, dark, or incomplete.'
      : 'I need a few more details to refine the diagnosis.',
    can_drive: true,
    severity: 'medium',
    urgencyLevel: 'medium',
    next_step: imageUrl
      ? 'Please upload a clearer close-up dashboard photo or describe the warning light in text.'
      : 'Describe when the issue happens, any noises, smells, warning lights, and whether the car still starts normally.',
    driveWhy: 'Insufficient diagnostic evidence.',
    mechanicRecommended: true,
    towingRecommended: false,
    tow_recommended: false,
    needs_followup: true,
    followup_questions: imageUrl
      ? ['Can you upload a clearer close-up photo of the dashboard?']
      : ['When exactly does the issue happen, and what warning lights are on?'],
  })

  const resolveAdvancedOutcome = (
    normalized: DiagnosticResult | null,
    imageUrl?: string,
    emergencyFallback?: DiagnosticResult | null
  ): { kind: AdvancedResolvedKind; data: DiagnosticResult } => {
    const validation = validateAdvancedDiagnosis(normalized)

    if (validation.valid && normalized) {
      return {
        kind: validation.kind || 'expert_result',
        data: normalized
      }
    }

    if (emergencyFallback) {
      return { kind: 'hard_fallback', data: emergencyFallback }
    }

    return { kind: 'soft_fallback', data: buildSoftFallback(imageUrl) }
  }

  // ── Vague First-Message Detection Layer ──
  // Only fires on the very first user message when it's short, vague,
  // has no image, and contains no specific symptom/danger keywords.
  // Gives a calm, low-stress response with 1 narrowing question,
  // then lets normal diagnostic logic handle everything after.
  const isVagueFirstMessage = (text: string, hasImage: boolean): boolean => {
    // Only applies when there are zero prior messages in this session
    if (messages.length > 0) return false
    if (hasImage) return false

    const trimmed = text.trim().toLowerCase()
    if (trimmed.length === 0) return false

    // If message has substantial detail (>80 chars), not vague
    if (trimmed.length > 80) return false

    // Specific symptom / danger keywords → NOT vague, proceed to full diagnosis
    const specificKeywords = [
      // Sounds & Noises
      'noise', 'grinding', 'squeak', 'rattle', 'clunk', 'thump', 'click', 'knock', 'whistle', 'hiss', 'hum', 'whine',
      // Visual & Smells
      'smoke', 'burning', 'smell', 'steam', 'overheat', 'leak', 'fluid', 'drip', 'oil', 'coolant', 'puddle',
      // Vibrations & Movement
      'vibrat', 'shak', 'wobble', 'pull', 'drift', 'alignment', 'shimmer', 'shudder', 'jerk', 'jump',
      // Dashboard & Electronics
      'light', 'warning', 'check engine', 'dashboard', 'abs', 'airbag', 'esp', 'traction', 'battery', 'charge', 'alternator',
      // Starting & Engine Performance
      'start', 'stall', 'misfire', 'dead', 'die', 'hesitat', 'rough idle', 'power', 'limp mode', 'acceleration',
      // Safety & Critical Parts
      'brake', 'steering', 'suspension', 'tire', 'flat', 'wheel', 'bearing', 'axle', 'belt', 'chain',
      // Specific Systems
      'transmission', 'clutch', 'gear', 'shift', 'ac', 'heat', 'radiator', 'fan', 'exhaust', 'muffler', 'catalytic', 'turbo',
      // Tech/Errors
      'error', 'code', 'p0', 'dtc', 'obd', 'scanner',
      // Incident related
      'accident', 'crash', 'damage', 'dent', 'hit'
    ]

    for (const kw of specificKeywords) {
      if (trimmed.includes(kw)) return false
    }

    return true
  }

  const sendMessage = async (content: string, imageUrl?: string, chipLabel?: string, customContext?: any) => {
    const currentlyGated = await fetchUsageCount()
    if (currentlyGated || isLimitReached) {
      setIsGated(true)
      return
    }

    const finalImageUrl = imageUrl || attachedImage || undefined

    if (!content.trim() && !finalImageUrl) return

    // ── Vague First-Message Intercept ──
    // Calm, reassuring local response — no API call, no usage counted.
    if (isVagueFirstMessage(content, !!finalImageUrl) && !chipLabel) {
      stop()
      setInput('')
      setAttachedImage(null)
      addMessage({ role: 'user', content, imageUrl: finalImageUrl })
      // Small delay to feel natural
      setLoading(true)
      setTimeout(() => {
        const vagueResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `No worries — I'm here to help. Let's figure this out together.\n\nTo point you in the right direction, could you tell me:\n**What's the main thing your car is doing (or not doing) right now?**\n\nFor example: a strange noise, a warning light, trouble starting, or something you noticed while driving.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, vagueResponse])
        setLoading(false)
      }, 800)
      return
    }

    stop() // Interrupt any playing audio
    setLoading(true)
    setInput('')
    setAttachedImage(null) // Clear attachment after send

    addMessage({ role: 'user', content, imageUrl: finalImageUrl })

    try {
      const symptomContext = chipLabel ? `USER SELECTED SYMPTOM: ${chipLabel}` : '';

      const vehicleContext = activeVehicle ? {
        make: activeVehicle.make,
        model: activeVehicle.model,
        year: activeVehicle.year,
        fuel_type: activeVehicle.fuel_type || 'Unknown',
        engine_type: activeVehicle.engine_type || 'Unknown',
        gearbox: activeVehicle.gearbox || 'Unknown'
      } : null;

      console.log('[Carxai AI] Vehicle context for analysis:', vehicleContext);

      const historyContext = diagnosticHistory ? `
DIAGNOSTIC HISTORY (Last 5 events):
${diagnosticHistory}
(Note: Use this history to spot recurring patterns or unresolved issues.)`
        : 'DIAGNOSTIC HISTORY: Initial session. No previous records.'

      // Use a helper for the API call to support retries
      const performAnalysis = async (isRetry = false, customContext?: any) => {
        console.log(`[Carxai AI] Starting analysis (isRetry: ${isRetry})`);
        const sessionResponse = await supabase.auth.getSession();
        const token = sessionResponse.data.session?.access_token;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            stream: false,
            plan: isAdvanced ? 'advanced' : isPro ? 'pro' : 'free',
            response_mode: responseMode,
            followup_context: customContext || null,
            is_retry: isRetry,
            messages: [
              {
                role: 'system',
                content: `VEHICLE CONTEXT: ${vehicleContext ? JSON.stringify(vehicleContext) : 'None provided'}\n\n${symptomContext}\n\n${historyContext}`
              },
              ...messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
              {
                role: 'user',
                content: finalImageUrl ? [
                  { type: 'text', text: content || 'Analyze this automotive image (dashboard, engine, tire, leak, etc.). Read all text and identify any visible faults or abnormalities.' },
                  { type: 'image_url', image_url: { url: finalImageUrl, detail: 'high' } }
                ] : content
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API returned ${response.status}: ${errorText}`)
        }

        const result = await response.json()

        if (!result?.content) {
          throw new Error('Missing content in /api/chat response')
        }

        setStreamingMessage(imageUrl ? 'Analyzing your photo…' : 'Analyzing systems...')

        return JSON.stringify(result.content)
      }

      let accumulatedJSON = await performAnalysis(false, customContext);
        console.log('[Carxai AI] Raw accumulated JSON from OpenAI:', accumulatedJSON);

        let issueData: DiagnosticResult | undefined
        let finalDisplayContent = ''

        const getEmergencyFallback = (input: string): DiagnosticResult | null => {
          const lowerInput = input.toLowerCase()
          if (lowerInput.includes('flat tire') || lowerInput.includes('puncture')) return {
            issueName: 'Flat Tire Detected',
            likelyCause: 'A puncture from road debris or a faulty valve stem.',
            explanation: 'Driving on a flat tire will permanently damage your rim and can cause loss of vehicle control.',
            can_drive: false,
            driveWhy: 'Driving on a flat tire will permanently damage your rim and can cause loss of vehicle control.',
            urgencyLevel: 'high',
            next_step: 'Stop immediately in a safe location and change to a spare or call for professional towing.',
            mechanicRecommended: true,
            towingRecommended: true,
            spokenSummary: 'You have a flat tire. Stop driving immediately to stay safe and protect your rims.'
          }
          if (lowerInput.includes('battery') || lowerInput.includes('won\'t start')) return {
            issueName: 'Potential Battery Failure',
            likelyCause: 'Corroded terminals, battery age, or an alternator issue.',
            explanation: 'The engine lacks sufficient power to turn over or may stall unexpectedly.',
            can_drive: false,
            driveWhy: 'The engine lacks sufficient power to turn over or may stall unexpectedly.',
            urgencyLevel: 'medium',
            next_step: 'Check battery terminals for corrosion and attempt a jump-start using high-quality cables.',
            mechanicRecommended: true,
            towingRecommended: false,
            spokenSummary: 'Your battery is likely the culprit. Try a jump-start or check the connections.'
          }
          if (lowerInput.includes('engine light') || lowerInput.includes('check engine')) return {
            issueName: 'Check Engine Indicator',
            likelyCause: 'Varies from a loose gas cap to a critical sensor malfunction.',
            explanation: 'The vehicle is likely safe for a short trip to a shop unless the light is flashing.',
            can_drive: true,
            driveWhy: 'The vehicle is likely safe for a short trip to a shop unless the light is flashing.',
            urgencyLevel: 'medium',
            next_step: 'Ensure your gas cap is tight and get an OBD-II scan at a local garage soon.',
            mechanicRecommended: true,
            towingRecommended: false,
            spokenSummary: 'The check engine light is on. It\'s usually safe for a short drive, but don\'t ignore it.'
          }
          if (lowerInput.includes('overheating') || lowerInput.includes('steam')) return {
            issueName: 'Engine Overheating Alert',
            likelyCause: 'Low coolant, a burst hose, or a failing water pump.',
            explanation: 'Excessive heat will melt engine components, leading to total engine destruction.',
            can_drive: false,
            driveWhy: 'Excessive heat will melt engine components, leading to total engine destruction.',
            urgencyLevel: 'stop_driving',
            next_step: 'Pull over and shut off the engine IMMEDIATELY. Do not open the hood if steam is present.',
            mechanicRecommended: true,
            towingRecommended: true,
            spokenSummary: 'Your engine is overheating. Pull over and stop immediately to prevent a total rebuild.'
          }
          if (lowerInput.includes('leak') || lowerInput.includes('fluid') || lowerInput.includes('dripping')) return {
            issueName: 'Fluid Leak Detected',
            likelyCause: 'Leaks can range from engine oil to coolant or brake fluid.',
            explanation: 'Loss of vital fluids can lead to component failure or loss of braking/steering capability.',
            can_drive: false,
            driveWhy: 'Loss of vital fluids can lead to component failure or loss of braking/steering capability.',
            urgencyLevel: 'high',
            next_step: 'Identify the color of the fluid and check levels before driving. Do not drive if it is brake fluid.',
            mechanicRecommended: true,
            towingRecommended: true,
            spokenSummary: 'I detected a fluid leak. You should check your fluid levels before driving further.'
          }
          if (lowerInput.includes('smoke') || lowerInput.includes('burning') || lowerInput.includes('smell')) return {
            issueName: 'Burning or Smoke Detected',
            likelyCause: 'Could be electrical short, leaking oil on hot exhaust, or stuck brake.',
            explanation: 'Burning smells or smoke are signs of excessive heat or friction and pose a fire risk.',
            can_drive: false,
            driveWhy: 'Burning smells or smoke are signs of excessive heat or friction and pose a fire risk.',
            urgencyLevel: 'stop_driving',
            next_step: 'Pull over safely and investigate source. Avoid driving until the cause is identified.',
            mechanicRecommended: true,
            towingRecommended: true,
            spokenSummary: 'I detected a burning smell or smoke. This is a potential fire hazard, please stop safely.'
          }
          if (lowerInput.includes('noise') || lowerInput.includes('grinding') || lowerInput.includes('squeak')) return {
            issueName: 'Mechanical Noise Issue',
            likelyCause: 'Likely worn brake pads, a failing wheel bearing, or a loose belt.',
            explanation: 'Most noises are early warning signs, but safe for a cautious drive to a mechanic.',
            can_drive: true,
            driveWhy: 'Most noises are early warning signs, but safe for a cautious drive to a mechanic.',
            urgencyLevel: 'medium',
            next_step: 'Listen for when the noise changes (turning, braking) and book a diagnostic check.',
            mechanicRecommended: true,
            towingRecommended: false,
            spokenSummary: 'That strange noise sounds like a mechanical component wearing out. Get it looked at soon.'
          }
          if (lowerInput.includes('damage') || lowerInput.includes('crash') || lowerInput.includes('accident')) return {
            issueName: 'Vehicle Damage Assessment',
            likelyCause: 'Physical impact or collision.',
            explanation: 'Structural damage or impact may have affected internal components or safety systems.',
            can_drive: false,
            driveWhy: 'Structural damage or impact may have affected internal components or safety systems.',
            urgencyLevel: 'high',
            next_step: 'Check for fluid leaks and ensure no parts are rubbing against tires before attempting to drive.',
            mechanicRecommended: true,
            towingRecommended: true,
            spokenSummary: 'Vehicle damage detected. Please ensure the car is safe to move before driving.'
          }
          return null
        }

        try {
          let parsed: any = null

          let parseResult = extractStructuredPayload(accumulatedJSON)
          console.log('[Carxai AI] RAW API Payload:', accumulatedJSON)
          console.log('[Carxai AI] Parse result:', parseResult)

          if (!parseResult.success) {
            console.warn('[Carxai AI] First parse failed, retrying once...', parseResult.reason)
            accumulatedJSON = await performAnalysis(true, customContext)
            console.log('[Carxai AI] RETRY RAW API Payload:', accumulatedJSON)

            parseResult = extractStructuredPayload(accumulatedJSON)
            console.log('[Carxai AI] Retry parse result:', parseResult)
          }

          parsed = parseResult.parsed

          if (isAdvanced) {
            const emergencyFallback = getEmergencyFallback(content)
            const normalized = normalizeAdvancedDiagnosis(parsed)
            const resolved = resolveAdvancedOutcome(normalized, finalImageUrl, emergencyFallback)

            console.group('[Advanced Diagnosis Pipeline]')
            console.log('RAW:', accumulatedJSON)
            console.log('PARSED:', parsed)
            console.log('NORMALIZED:', normalized)
            console.log('FINAL KIND:', resolved.kind)
            console.log('FINAL DATA:', resolved.data)
            console.groupEnd()

            issueData = resolved.data

            if (resolved.kind === 'followup_result' || issueData.needs_followup) {
              finalDisplayContent = issueData.explanation || 'I need a bit more information to continue.'
            } else {
              finalDisplayContent = issueData.explanation || issueData.likelyCause || ''
            }
          } else {
            if (!parsed) {
              throw new Error('Parsed JSON missing core diagnostic fields')
            }

            const hasValidIssue = (
              parsed.issue_title ||
              parsed.normalized_issue ||
              parsed.issueName ||
              parsed.warning_light_name ||
              parsed.fault_message_text ||
              parsed.needs_followup === true
            )

            if (!hasValidIssue) {
              const emergencyFallback = getEmergencyFallback(content)
              if (emergencyFallback) {
                parsed = emergencyFallback
              } else {
                throw new Error('Parsed JSON missing core diagnostic fields')
              }
            }

            const rawSeverity = parsed.severity || parsed.urgency || 'medium'
            const mappedUrgency =
              (rawSeverity === 'high' || rawSeverity === 'emergency' || parsed.tow_recommended) &&
                parsed.can_drive === false
                ? 'stop_driving'
                : rawSeverity

            const isFollowup = parsed.needs_followup === true

            issueData = {
              ...parsed,
              issueName: parsed.issue_title || parsed.normalized_issue || parsed.issueName || (isFollowup ? 'Seeking Clarification...' : 'Diagnostic Report'),
              likelyCause: parsed.explanation || parsed.likelyCause || 'Logic-based diagnostic assessment.',
              urgencyLevel: mappedUrgency as 'low' | 'medium' | 'high' | 'stop_driving',
              driveWhy: parsed.explanation || parsed.driveWhy || 'Safety status based on detected symptoms.',
              severity: (rawSeverity === 'emergency' ? 'high' : rawSeverity) as 'low' | 'medium' | 'high',
              can_drive: typeof parsed.can_drive === 'boolean' ? parsed.can_drive : true,
              next_step: parsed.next_step || (isFollowup ? 'Please respond to the clarification question.' : 'Consult a professional for further verification.'),
              towingRecommended: parsed.tow_recommended || parsed.towingRecommended || false
            }

            if (isFollowup) {
              finalDisplayContent = `${parsed.explanation || 'To provide a precise diagnosis, I need to know a little more:'}\n\n${parsed.followup_questions?.[0] || ''}`
            } else {
              finalDisplayContent = issueData?.explanation || issueData?.likelyCause || ''
            }
          }

          if (!issueData) {
            issueData = buildSoftFallback(finalImageUrl)
          }

          if (issueData) {
            setIsPreparingAudio(true)

            const speechText = issueData.needs_followup
              ? (issueData.explanation || 'I need a couple of details to continue.')
              : `Diagnosis: ${issueData.issueName}. Severity: ${issueData.severity}. Safety check: ${issueData.can_drive ? 'You can keep driving cautiously.' : 'Stop driving immediately.'} ${issueData.explanation}. Recommended next step: ${issueData.next_step}`

            const sessionResp = await supabase.auth.getSession()
            const ttsToken = sessionResp.data.session?.access_token
            prefetch(speechText, ttsToken).finally(() => setIsPreparingAudio(false))
          }
        } catch (err) {
          console.error('[Carxai AI] Final Logic Catch Triggered:', (err as any)?.message || err)
          console.log('[Carxai AI] Raw accumulatedJSON at time of failure:', accumulatedJSON)

          const textFallback = getEmergencyFallback(content)
          issueData = textFallback || buildSoftFallback(finalImageUrl)

          finalDisplayContent = issueData?.needs_followup
            ? (issueData?.explanation || 'I need more information to continue.')
            : (issueData?.explanation || issueData?.likelyCause || '')
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

        // 4. REMOVE AUTO REPORT POPUP BEHAVIOR
        // We no longer trigger setShowReport(true) automatically.
        // The user must click "Generate Detailed Report" manually.
        if (issueData && !issueData.needs_followup) {
          setReportDiagnosis(issueData)
          try {
            const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              issue_name: issueData.issueName || issueData.issue_title,
              urgency_level: issueData.severity || 'medium',
              diagnostic_data: issueData
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to save report');
          }

          const rawInsertedChat = await response.json();

          const insertedChat = rawInsertedChat as { id: string } | null;

          if (insertedChat && insertedChat.id) {
            // Atomic Usage Increment
            await incrementUsage('chat')
            if (finalImageUrl) {
              await incrementUsage('image')
            }
            const chatId = insertedChat.id;
            issueData.report_id = chatId;

            // Update the message in state so it has the report_id for the UI
            setMessages(prev => prev.map(m =>
              m.id === assistantMsg.id
                ? { ...m, issueData: { ...m.issueData!, report_id: chatId } }
                : m
            ))

            // Also update the active reportDiagnosis state if the user opened the report modal before saving finished!
              setReportDiagnosis(prev => {
                if (prev && prev.issueName === issueData.issueName) {
                  return { ...prev, report_id: chatId }
                }
                return prev
              })
            }
          } catch (chatError) {
            console.error('[Carxai AI] Failed to save chat to DB:', chatError)
          }

          // Final: Re-fetch usage to see if we hit the limit
          await fetchUsageCount()
        }
      } catch (err) {
        console.error('AI Error:', err)
        const errorResult: DiagnosticResult = {
          issueName: 'Diagnosis Unavailable',
          likelyCause: 'I am currently unable to reach the diagnostic analysis server. This could be due to a network interruption or temporary service maintenance.',
          explanation: 'I am currently unable to reach the diagnostic analysis server. This could be due to a network interruption or temporary service maintenance.',
          urgencyLevel: 'medium',
          next_step: 'Please check your internet connection and try submitting your request again in a few moments.',
          can_drive: true,
          driveWhy: 'Connection to diagnostic server interrupted.',
          mechanicRecommended: false,
          towingRecommended: false,
          spokenSummary: 'I am having trouble connecting to my diagnostic systems right now.'
        }
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorResult.likelyCause || '',
          timestamp: new Date(),
          issueData: errorResult,
        }])
      } finally {
        setLoading(false)
        setStreamingMessage('')
      }
    }

  const handleFileUpload = async (file: File) => {
      setIsImageProcessing(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const sessionResp = await supabase.auth.getSession()
        const token = sessionResp.data.session?.access_token

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.error || 'Failed to upload image')
        }

        const { url } = await res.json()
        setAttachedImage(url)
      } catch (err: any) {
        console.error('[Carxai AI] Image upload failed:', err)
        alert(err.message || 'Image upload failed. Please try a different photo and ensure it is under 5MB.')
      } finally {
        setIsImageProcessing(false)
      }
    }

    const toggleListening = () => {
      // 2. HARD MICROPHONE GUARD
      if (!isPaid) {
        setIsGated(true)
        return
      }

      if (isListening) {
        recognitionRef.current?.stop()
        setIsListening(false)
        setIsProcessing(true)

        // If we have content (either recorded or already there with a photo), send it
        setTimeout(() => {
          if (input.trim() || attachedImage) {
            sendMessage(input)
          }
          setIsProcessing(false)
        }, 500)
      } else {
        try {
          // Clear input when starting fresh voice command to satisfy "no text + audio"
          setInput('')
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
      <div className="h-full relative overflow-hidden">
        {/* ── Layer 0: Global Background Decoration ──────────────────── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-navy/[0.02] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />

          {/* Technical Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {/* ── Layer 1: Full-Screen Chat Thread ──────────────────────── */}
        <div className="absolute inset-0 overflow-y-auto scroll-smooth z-10 px-4 md:px-6 overscroll-contain">
          <div className="max-w-2xl mx-auto pt-[calc(10rem_+_env(safe-area-inset-top))] pb-40 relative z-10">
            {/* Welcome State when empty */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center pt-10 pb-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-10 w-full px-6"
                >
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                      <div className="absolute inset-0 bg-navy/[0.02] rounded-3xl" />
                      <Bot className="w-9 h-9 text-navy relative z-20" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-display font-[900] text-navy tracking-tight mb-4">AI Mechanic</h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-transparent via-navy/10 to-transparent mx-auto mb-6" />
                  <p className="text-[17px] font-semibold text-slate-500 max-w-[320px] mx-auto leading-relaxed tracking-tight">
                    High-fidelity diagnostic intelligence. <br />
                    <span className="text-navy/40 text-[13px] font-black uppercase tracking-[0.2em]">Ready for analysis</span>
                  </p>
                </motion.div>

                {/* Mode Selector Segmented Control */}
                <div className="w-full max-w-sm mx-auto mb-10 px-4">
                  <div className="p-1.5 bg-slate-100/80 backdrop-blur-md rounded-full border border-slate-200 shadow-inner flex relative">
                   <motion.div
                      layout
                      className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm border border-slate-200/50 z-0"
                      initial={false}
                      animate={{
                        left: responseMode === 'fast_answer' ? '6px' : 'calc(50%)'
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />

                    <button
                      onClick={() => setResponseMode('fast_answer')}
                      className={`relative z-10 flex-1 py-3 text-[12px] font-black uppercase tracking-wider transition-colors duration-300 flex items-center justify-center gap-2 ${responseMode === 'fast_answer' ? 'text-[#0073e7]' : 'text-slate-500 hover:text-navy/70'}`}
                    >
                      <Zap className={`w-4 h-4 ${responseMode === 'fast_answer' ? 'text-[#0073e7]' : 'text-slate-400'}`} />
                      Fast Answer
                    </button>
                    <button
                      onClick={() => {
                        if (!isAdvanced) {
                          setIsGated(true)
                          return
                        }
                        setResponseMode('expert_answer')
                      }}
                      className={`relative z-10 flex-1 py-3 text-[12px] font-black uppercase tracking-wider transition-colors duration-300 flex items-center justify-center gap-2 ${responseMode === 'expert_answer' ? 'text-indigo-600' : 'text-slate-500 hover:text-navy/70'}`}
                    >
                      <Activity className={`w-4 h-4 ${responseMode === 'expert_answer' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      Expert
                      {!isAdvanced && <div className="hidden ml-1 px-1.5 py-0.5 rounded-full bg-[#0073e7]/10 text-[#0073e7] text-[8px] font-black md:inline-block">PRO</div>}
                    </button>
                  </div>
                </div>

                {!loadingVehicle && (
                  <div className="w-full max-w-xl px-4">
                    {!activeVehicle ? (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setShowVehicleModal(true)}
                        className="w-full relative overflow-hidden rounded-[36px] bg-white border border-slate-200/50 p-7 flex items-center justify-between gap-6 shadow-[0_15px_30px_-5px_rgba(0,18,51,0.03)] transition-all duration-500 group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-16 h-16 rounded-[24px] bg-navy flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(0,18,51,0.5)] relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-700">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                            <Activity className="w-7 h-7 text-white relative z-10" />
                            {/* Status Pulse */}
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-navy animate-pulse" />
                          </div>

                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Configuration Required</span>
                            </div>
                            <h4 className="text-[19px] font-black text-navy leading-none mb-2 tracking-tight">Add Vehicle Details</h4>
                            <p className="text-[12px] font-semibold text-slate-500 leading-snug max-w-[190px]">Enable vehicle-specific logic for 34% more accurate results</p>
                          </div>
                        </div>

                        <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:bg-navy group-hover:border-navy transition-all duration-500 shadow-sm relative z-10">
                          <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:rotate-180 transition-all duration-700" />
                        </div>

                        {/* Interactive Scan Line Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent w-full h-[20%] opacity-0 group-hover:opacity-100"
                          animate={{ top: ['-20%', '120%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full relative overflow-hidden rounded-[32px] bg-white border border-slate-200/60 p-6 flex flex-col items-start shadow-[0_15px_40px_-10px_rgba(0,18,51,0.03)] transition-all duration-500"
                      >
                        <div className="flex items-center gap-5 w-full mb-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0073e7] to-[#004A99] flex items-center justify-center shadow-lg shadow-blue-500/20 relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:10px_10px] opacity-20" />
                            <CarFront className="w-6 h-6 text-white relative z-10" />
                          </div>
                          
                          <div className="text-left flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#0073e7]">Diagnostic Target</span>
                              <div className="px-1.5 py-0.5 rounded-[4px] bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                              </div>
                            </div>
                            <h4 className="text-[20px] font-black text-navy leading-none tracking-tight">
                              {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                            </h4>
                          </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-3">
                          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100/60 flex flex-col justify-center">
                            <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Mileage</span>
                            <span className="text-[13px] font-bold text-navy tracking-tight">{activeVehicle.mileage ? `${activeVehicle.mileage.toLocaleString()} mi` : 'Not Set'}</span>
                          </div>
                          <div className="bg-emerald-50/30 rounded-2xl p-3 border border-emerald-100/50 flex flex-col justify-center">
                            <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/50 mb-1">System Status</span>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-[12px] font-bold text-emerald-700 tracking-tight">Ready for Scan</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Message Thread ────────────────────────────────── */}
            <div className="space-y-6">
              {messages.map((msg, idx) => {
                // Optionally skip greeting if empty state handles it
                if (messages.length === 1 && idx === 0 && msg.id === '0') return null;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-lg border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                        <Bot className="w-4 h-4 text-white relative z-10" />
                      </div>
                    )}
                    <div className={`max-w-[85%] lg:max-w-lg ${msg.role === 'user' ? 'order-first' : ''}`}>
                      {msg.imageUrl && (
                        <div className="relative rounded-2xl overflow-hidden mb-2 shadow-xl border border-white/20 ring-1 ring-black/5 max-w-[280px] ml-auto">
                          <img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      <div className={`transition-all ${msg.role === 'user'
                        ? 'px-5 py-3 rounded-[24px] rounded-tr-none bg-navy text-white shadow-lg shadow-navy/10 text-sm'
                        : 'text-slate-800'
                        }`}>
                        {msg.role === 'assistant' ? (
                          <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[32px] overflow-hidden assistant-card-bubble">
                            {msg.issueData && !msg.issueData.needs_followup ? (
                              msg.issueData.mode === 'fast_answer' ? (
                                <div className="p-5 md:p-8 space-y-6 relative bg-white">
                                  {/* 1. Badge & Title */}
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="pr-2">
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Fast Diagnostic</span>
                                      </div>
                                      <h3 className="text-[24px] leading-tight font-display font-black text-navy tracking-tight">
                                        {msg.issueData.normalized_issue || msg.issueData.issueName}
                                      </h3>
                                    </div>
                                  </div>

                                  {/* 2. Structured Status Banner */}
                                  <div className={`p-5 rounded-[28px] border-2 transition-all shadow-sm ${msg.issueData.can_drive
                                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                                    : 'bg-rose-50/50 border-rose-100 text-rose-700'
                                    }`}>
                                    <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${msg.issueData.can_drive
                                        ? 'bg-white border-emerald-200 text-emerald-600'
                                        : 'bg-white border-rose-200 text-rose-600'
                                        }`}>
                                        {msg.issueData.can_drive ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Safety Status</p>
                                        <p className="text-[18px] font-black leading-none uppercase tracking-tight">
                                          {msg.issueData.can_drive ? 'Drive with Caution' : 'Stop Immediately'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 3. AI Analysis Content */}
                                  <div className="px-1 prose prose-slate">
                                    <p className="text-[15px] md:text-[16px] font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                      {msg.issueData.explanation}
                                    </p>
                                  </div>

                                  {/* 4. Action Grid */}
                                  <div className="pt-2 space-y-3">
                                    <motion.button
                                      whileHover={{ y: -2, scale: 1.01 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        setReportDiagnosis(msg.issueData!);
                                        setShowReport(true);
                                      }}
                                      className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-[22px] bg-navy text-white text-[13px] font-black uppercase tracking-[0.15em] shadow-xl shadow-navy/20 border border-white/10"
                                    >
                                      <FileText className="w-5 h-5 text-white/70" />
                                      Generate Official Report
                                    </motion.button>

                                    <div className="grid grid-cols-2 gap-3">
                                      <motion.button
                                        whileHover={{ y: -2 }}
                                        onClick={() => navigate('/dashboard/mechanic', { state: { initialSearch: msg.issueData!.normalized_issue || msg.issueData!.issueName } })}
                                        className="flex items-center justify-center gap-2 px-3 py-4 rounded-[18px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 text-navy text-[11px]"
                                      >
                                        <MapPin className="w-4 h-4 text-navy/30" />
                                        Find Repair
                                      </motion.button>

                                      {(!msg.issueData.can_drive || msg.issueData.severity === 'high') ? (
                                        <motion.button
                                          whileHover={{ y: -2 }}
                                          onClick={() => navigate('/dashboard/towing', { state: { initialSearch: msg.issueData!.normalized_issue || msg.issueData!.issueName } })}
                                          className="flex items-center justify-center gap-2 px-3 py-4 rounded-[18px] font-bold uppercase tracking-wider bg-red-50 border border-red-100 text-red-600 text-[11px]"
                                        >
                                          <Zap className="w-4 h-4" />
                                          Get Towing
                                        </motion.button>
                                      ) : (
                                        <motion.button
                                          whileHover={{ y: -2 }}
                                          onClick={() => sendMessage("What are the estimated repair costs for this issue?", undefined, undefined, { previous_diagnosis: msg.issueData })}
                                          className="flex items-center justify-center gap-2 px-3 py-4 rounded-[18px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 text-navy text-[11px]"
                                        >
                                          <RefreshCw className="w-4 h-4 text-navy/30" />
                                          Check Costs
                                        </motion.button>
                                      )}
                                    </div>
                                    
                                    <div className="flex justify-center pt-2">
                                      <ListenButton
                                        currentAudioRef={currentAudioRef}
                                        text={msg.issueData.explanation || ''}
                                      />
                                    </div>
                                  </div>

                                  <div className="pt-4 border-t border-slate-50 flex justify-center">
                                    <button 
                                      onClick={() => {
                                        setResponseMode('expert_answer');
                                        setTimeout(() => {
                                          sendMessage("Analyze this in deeper detail with manual investigation steps.", undefined, undefined, { previous_diagnosis: msg.issueData });
                                        }, 50);
                                      }}
                                      className="text-[10px] font-black uppercase tracking-widest text-[#0073e7] opacity-40 hover:opacity-100 transition-opacity"
                                    >
                                      Switch to Expert mode
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`p-6 md:p-8 space-y-8 relative ${msg.issueData.mode === 'expert_answer' ? 'bg-gradient-to-br from-[#0073e7]/5 to-white border-t-4 border-[#0073e7]' : ''}`}>
                                  {/* 1. Header & Priority */}
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="pr-2">
                                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-2 ${msg.issueData.mode === 'expert_answer' ? 'text-[#0073e7] flex items-center gap-1.5' : 'text-navy/30'}`}>
                                        {msg.issueData.mode === 'expert_answer' && <Activity className="w-3.5 h-3.5" />}
                                        {msg.issueData.mode === 'expert_answer' ? 'Master Technician Analysis' : 'AI Diagnostic Analysis'}
                                      </span>
                                      <h3 className="text-[24px] leading-tight font-display font-black text-navy tracking-tight">{msg.issueData.normalized_issue || msg.issueData.issueName}</h3>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-lg border font-black text-[9px] uppercase tracking-widest shrink-0 ${getUrgencyColor((msg.issueData.severity || msg.issueData.urgencyLevel) as string)}`}>
                                      {getUrgencyBadge((msg.issueData.severity || msg.issueData.urgencyLevel) as string)}
                                    </div>
                                  </div>

                                  {/* 2. Dashboard Symbols & Text (Contextual) */}
                                  {(msg.issueData.warning_light_name || msg.issueData.fault_message_text) && (
                                    <div className="flex flex-col gap-4">
                                      {msg.issueData.warning_light_name && (
                                        <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                                            <Aperture className="w-5 h-5 text-navy/40" />
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Detected Symbol</p>
                                            <p className="text-[14px] font-bold text-navy leading-none">{msg.issueData.warning_light_name}</p>
                                          </div>
                                        </div>
                                      )}
                                      {msg.issueData.fault_message_text && (
                                        <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                                            <FileText className="w-5 h-5 text-navy/40" />
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Dashboard Text</p>
                                            <p className="text-[14px] font-bold text-navy leading-tight">“{msg.issueData.fault_message_text}”</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 3. Safety Check - Integrated High-End Block */}
                                  <div className="relative group">
                                    <div className={`p-5 rounded-3xl border transition-all duration-500 ${msg.issueData.can_drive
                                      ? 'bg-emerald-50/30 border-emerald-100/50 hover:bg-emerald-50/50'
                                      : 'bg-rose-50/30 border-rose-100/50 hover:bg-rose-50/50'
                                      }`}>
                                      <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${msg.issueData.can_drive
                                          ? 'bg-white border-emerald-100 text-emerald-600'
                                          : 'bg-white border-rose-100 text-rose-600'
                                          }`}>
                                          {msg.issueData.can_drive ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-navy/30 mb-1">Safety Status</p>
                                          <p className={`text-[16px] font-black leading-tight ${msg.issueData.can_drive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {msg.issueData.can_drive ? 'Safe to drive cautiously' : 'Stop driving immediately'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 4. Deep Analysis */}
                                  <div className="pt-6 border-t border-slate-100 px-1">
                                    <div className="flex items-center gap-2 mb-3 text-navy/30">
                                      <Activity className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">In-depth Analysis</span>
                                    </div>
                                    <p className="text-[17px] font-medium text-slate-600 leading-[1.6] tracking-tight">
                                      {msg.issueData.explanation || msg.issueData.likelyCause}
                                    </p>
                                  </div>

                                  {/* 5. Recommended Action */}
                                  <div className="pt-6 border-t border-slate-100 px-1">
                                    <div className="flex items-center gap-2 mb-3 text-navy/30">
                                      <Wrench className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Recommended Action</span>
                                    </div>
                                    <p className="text-[18px] font-black text-navy leading-snug">
                                      {msg.issueData.next_step}
                                    </p>
                                  </div>

                                  {/* 6. Integrated Premium Actions */}
                                  <div className="pt-4 flex flex-col gap-3">
                                    <motion.button
                                      whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(0,112,224,0.4)" }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        setReportDiagnosis(msg.issueData!);
                                        setShowReport(true);
                                      }}
                                      className="w-full flex items-center justify-center gap-3 px-6 py-6 rounded-[24px] bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] text-white text-[14px] font-black uppercase tracking-[0.15em] shadow-[0_20px_48px_-12px_rgba(0,112,224,0.35)] active:brightness-90 transition-all border border-white/10 ring-1 ring-white/10"
                                    >
                                      <FileText className="w-5.5 h-5.5 text-white/90" />
                                      <span className="font-display">Generate Detailed Report</span>
                                    </motion.button>

                                    {/* Dynamic Action Priority */}
                                    {(() => {
                                      const severity = msg.issueData!.severity || msg.issueData!.urgencyLevel || 'medium';

                                      return (
                                        <div className="grid grid-cols-2 gap-3 w-full">
                                          {severity === 'high' && (
                                            <>
                                              <motion.button
                                                whileHover={{ y: -2, scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => navigate('/dashboard/towing', { state: { initialSearch: msg.issueData!.normalized_issue || msg.issueData!.issueName } })}
                                                className="flex items-center justify-center gap-2.5 px-4 py-4.5 rounded-[20px] font-black uppercase tracking-wider transition-all bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white text-[13px] shadow-[0_15px_35px_-10px_rgba(239,68,68,0.4)] border border-white/20 order-1"
                                              >
                                                <Zap className="w-4 h-4 text-white/90" />
                                                Towing
                                              </motion.button>
                                              <motion.button
                                                whileHover={{ y: -2, scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => navigate('/dashboard/mechanic', { state: { initialSearch: msg.issueData!.normalized_issue || msg.issueData!.issueName } })}
                                                className="flex items-center justify-center gap-2.5 px-4 py-4.5 rounded-[20px] font-black uppercase tracking-wider transition-all bg-white/40 backdrop-blur-md border border-slate-200/50 text-navy text-[11px] shadow-sm shadow-slate-200/40 order-2"
                                              >
                                                <MapPin className="w-4 h-4 text-navy/40" />
                                                Find Mechanic
                                              </motion.button>
                                            </>
                                          )}

                                          {severity === 'medium' && (
                                            <>
                                              <motion.button
                                                whileHover={{ y: -2, scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => navigate('/dashboard/mechanic', { state: { initialSearch: msg.issueData!.normalized_issue || msg.issueData!.issueName } })}
                                                className="flex items-center justify-center gap-2.5 px-4 py-4.5 rounded-[20px] font-black uppercase tracking-wider transition-all bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] text-white text-[13px] shadow-[0_15px_35px_-10px_rgba(0,112,224,0.4)] border border-white/20 order-1"
                                              >
                                                <MapPin className="w-4 h-4 text-white/90" />
                                                Find Mechanic
                                              </motion.button>
                                              <motion.button
                                                whileHover={{ y: -2, scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => sendMessage("I will continue driving with caution. Are there any specific signs I should watch out for?", undefined, undefined, { previous_diagnosis: msg.issueData })}
                                                className="flex items-center justify-center gap-2.5 px-4 py-4.5 rounded-[20px] font-black uppercase tracking-wider transition-all bg-white/40 backdrop-blur-md border border-slate-200/50 text-navy text-[11px] shadow-sm shadow-slate-200/40 order-2"
                                              >
                                                <Activity className="w-4 h-4 text-navy/40" />
                                                Drive w/ Caution
                                              </motion.button>
                                            </>
                                          )}

                                          {(!severity || severity === 'low') && (
                                            <>
                                              <motion.button
                                                whileHover={{ y: -2, scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => sendMessage("How should I best monitor this issue?", undefined, undefined, { previous_diagnosis: msg.issueData })}
                                                className="flex items-center justify-center gap-2.5 px-4 py-4.5 rounded-[20px] font-black uppercase tracking-wider transition-all bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] text-white text-[13px] shadow-[0_15px_35px_-10px_rgba(0,112,224,0.4)] border border-white/20 order-1"
                                              >
                                                <Activity className="w-4 h-4 text-white/90" />
                                                Monitor Issue
                                              </motion.button>
                                              <motion.button
                                                whileHover={{ y: -2, scale: 1.02 }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => navigate('/dashboard/mechanic', { state: { initialSearch: msg.issueData!.normalized_issue || msg.issueData!.issueName } })}
                                                className="flex items-center justify-center gap-2.5 px-4 py-4.5 rounded-[20px] font-black uppercase tracking-wider transition-all bg-white/40 backdrop-blur-md border border-slate-200/50 text-navy text-[11px] shadow-sm shadow-slate-200/40 order-2"
                                              >
                                                <MapPin className="w-4 h-4 text-navy/40" />
                                                Find Mechanic
                                              </motion.button>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    <div className="pt-6 flex justify-center">
                                      <ListenButton
                                        currentAudioRef={currentAudioRef}
                                        text={`Diagnosis: ${msg.issueData.normalized_issue}. Severity: ${msg.issueData.severity}. Safety check: ${msg.issueData.can_drive ? 'You can keep driving cautiously.' : 'No, stop as soon as it is safe.'} ${msg.issueData.explanation}. Next step: ${msg.issueData.next_step}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className={`px-6 py-5 relative ${isAdvanced ? 'border border-[#0073e7]/10 bg-gradient-to-br from-[#0073e7]/5 to-white shadow-lg shadow-[#0073e7]/5 assistant-card-bubble' : 'text-[15px] font-medium text-slate-700 leading-relaxed assistant-card-bubble'}`}>
                                {isAdvanced && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <Activity className="w-4 h-4 text-[#0073e7]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#0073e7]">Diagnostic Interrogation</span>
                                  </div>
                                )}
                                <div className="space-y-3">
                                  <p className={isAdvanced ? "text-[16px] font-medium text-slate-700 leading-relaxed tracking-tight" : ""}>
                                    {formatContent(msg.issueData?.explanation || msg.content)}
                                  </p>
                                </div>

                                  {/* Render Structured or Legacy Follow-ups */}
                                  {(msg.issueData?.followup_questions || []).map((item: any, qIdx: number) => {
                                    const isObj = typeof item === 'object' && item !== null && 'question' in item;
                                    // If it's a legacy string array, we only render the first item as the question title conceptually if at all, but normally legacy just had chips.
                                    // Let's render the question text if it's structured:
                                    const questionText = isObj ? item.question : (qIdx === 0 ? item : null);
                                    const optionsList = isObj ? (item.options || []) : (qIdx === 0 ? msg.issueData!.followup_questions : []);

                                    if (!isObj && qIdx > 0) return null; // Only render legacy strings once grouping them

                                    if (!questionText && optionsList.length === 0) return null;

                                    return (
                                      <div key={qIdx} className="mt-4">
                                        {questionText && (
                                          <p className="text-[14px] font-bold text-[#0073e7] mb-3">
                                            {questionText}
                                          </p>
                                        )}
                                        {optionsList.length > 0 && (
                                          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                            {optionsList.map((opt: string, optIdx: number) => (
                                              <motion.button
                                                key={optIdx}
                                                whileHover={{ y: -2, scale: 1.02, backgroundColor: '#0073e7', color: '#fff' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => sendMessage(opt, undefined, undefined, {
                                                  original_issue: messages.find(m => m.role === 'user')?.content,
                                                  previous_followup_question: questionText,
                                                  selected_option: opt,
                                                  finalize: true
                                                })}
                                                className={`px-4 py-3 rounded-2xl border transition-all shadow-sm w-full text-center ${isAdvanced ? 'bg-white border-[#0073e7]/20 text-[#0073e7] text-[13px] font-bold hover:shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 text-[13px] font-bold'}`}
                                              >
                                                {opt}
                                              </motion.button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="font-semibold">{msg.content}</p>
                        )}
                      </div>

                      {msg.role === 'assistant' && !msg.issueData && (
                        <div className="mt-2 flex justify-start pl-2">
                          <ListenButton
                            currentAudioRef={currentAudioRef}
                            text={msg.content}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Loading / Streaming Status ─────────────────────── */}
            {(loading || streamingMessage) && (
              <div className="flex justify-start items-start mt-6">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mr-3 bg-navy shadow-lg border border-white/10 relative overflow-hidden transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <Bot className="w-4 h-4 text-white relative z-10" />
                </div>
                <div className="space-y-2 max-w-[85%] lg:max-w-lg">
                  <div className="px-6 py-4.5 rounded-[26px] rounded-tl-none bg-white border border-slate-100 text-slate-800 shadow-[0_2px_15px_rgba(0,18,51,0.03)] assistant-card-bubble">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Loader2 className="w-3 h-3 text-navy animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-navy/60">
                          {streamingMessage ? 'Live Analysis' : 'Connecting to Systems'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600 font-medium">
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
          </div>

          <div ref={messagesEndRef} className="h-8" />
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

        {/* ── Layer 2: Fixed Composer ────────────────────────────── */}
        <div className="fixed bottom-0 left-0 lg:left-[232px] right-0 z-30 bg-mesh border-t border-slate-100/50 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] pt-4 relative z-10">
            {/* Hidden file pickers */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

            {/* ══ Attachment Preview ══ */}
            <AnimatePresence mode="wait">
              {isImageProcessing ? (
                <motion.div
                  key="loading-image"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-3 flex justify-start"
                >
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                  </div>
                </motion.div>
              ) : attachedImage ? (
                <motion.div
                  key="attachment"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="mb-3 flex justify-start"
                >
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-[22px] overflow-hidden border-2 border-white shadow-2xl ring-1 ring-black/5">
                      <img src={attachedImage || undefined} alt="Attachment" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => setAttachedImage(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg active:scale-90 transition-transform"
                    >
                      <RefreshCw className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>



            <div className="relative flex items-end gap-2.5 bg-white border border-slate-100 rounded-[28px] p-2.5 pr-4 shadow-[0_4px_24px_rgba(15,23,42,0.02)] focus-within:shadow-[0_8px_32px_rgba(15,23,42,0.06)] transition-all duration-500">
              {/* Left: Camera */}
              <div className="flex items-center self-center pl-1">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={loading || isGated || isImageGated || isImageProcessing}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 disabled:opacity-50"
                >
                  <Aperture className="w-[20px] h-[20px]" />
                </button>
              </div>

              {/* Center: Textarea / Waveform */}
              <div className="flex-1 min-h-[44px] flex items-center py-2 px-1">
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div
                      key="waveform"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 h-[32px] px-2"
                    >
                      {Array.from({ length: 16 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-[3px] rounded-full bg-blue-600"
                          animate={{ scaleY: [0.3, 1, 0.3] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            delay: i * 0.05,
                            ease: 'easeInOut',
                          }}
                          style={{ height: 16, transformOrigin: 'center' }}
                        />
                      ))}
                      <span className="ml-3 text-[10px] font-display font-black text-blue-600 uppercase tracking-widest italic animate-pulse">Listening...</span>
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
                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage(input)
                        }
                      }}
                      placeholder="Describe your issue or ask a question..."
                      rows={1}
                      style={{ minHeight: 24, maxHeight: 200 }}
                      className="w-full bg-transparent outline-none resize-none
                               text-[15px] font-medium leading-relaxed
                               text-slate-900 placeholder:text-slate-400/80"
                      disabled={loading || isGated}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 self-center">
                {!isListening && (
                  <button
                    onClick={() => {
                      if (isLimitReached || isImageGated) {
                        setIsGated(true)
                        return
                      }
                      fileInputRef.current?.click()
                    }}
                    disabled={loading || isImageProcessing}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 disabled:opacity-50"
                  >
                    <ImagePlus className="w-[18px] h-[18px]" />
                  </button>
                )}

                <AnimatePresence mode="popLayout">
                  {(!input.trim() && !attachedImage && !isListening) ? (
                    <motion.button
                      key="mic"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => {
                        if (!isPaid) {
                          setIsGated(true)
                          return
                        }
                        toggleListening()
                      }}
                      disabled={loading || isProcessing}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 relative"
                      whileTap={{ scale: 0.9 }}
                    >
                      {isProcessing
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : (<><Mic className="w-4 h-4" />{!isPaid && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-50 rounded-full flex items-center justify-center border border-white shadow-sm"><Lock className="w-2 h-2 text-amber-600" /></div>}</>)}
                    </motion.button>
                  ) : (
                    <motion.button
                      key="send"
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      onClick={() => isListening ? toggleListening() : sendMessage(input)}
                      disabled={loading || (!input.trim() && !attachedImage && !isListening)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                        : (input.trim() || attachedImage) && !loading
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isListening ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Send className="w-4 h-4 translate-x-[1px]" />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Popup Gate */}
        <UpgradeGate
          isOpen={isGated}
          onClose={() => setIsGated(false)}
        />

        {/* Vehicle Add Modal — opened from header or onboarding card */}
        <VehicleAddModal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          onSaved={(vehicle) => {
            setActiveVehicle(vehicle)
            setShowVehicleModal(false)
          }}
        />

        {/* Mechanic Report Modal — Stage 2 Actions inside */}
        {reportDiagnosis && (
          <MechanicReport
            isOpen={showReport}
            onClose={() => setShowReport(false)}
            user={user}
            diagnosis={reportDiagnosis!}
            messages={messages}
            activeVehicle={activeVehicle}
            currentAudioRef={currentAudioRef}
            isLimitReached={!canShareReport}
          />
        )}
      </div>
    )
  }

