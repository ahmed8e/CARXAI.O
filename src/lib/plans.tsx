import { 
  MessageCircle, ImageIcon, FileText, Zap, MapPin, 
  ShieldCheck, Activity, Brain, Mic, Star 
} from 'lucide-react'
import type { PlanType } from '../hooks/useSubscription'

export interface PlanFeature {
  text: string
  icon: React.ReactNode
  highlight?: boolean
}

export interface Plan {
  id: PlanType
  name: string
  tagline: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  trial?: string
  cta: string
  popular: boolean
  accentColor: string
  badgeLabel?: string
  features: PlanFeature[]
  includes: string[]
}

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try it out, no commitment',
    description: 'Basic AI access to get started with automotive diagnosis.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: 'Get Started Free',
    popular: false,
    accentColor: 'slate',
    features: [
      { text: '2 AI messages every 5 hours', icon: <MessageCircle size={16} /> },
      { text: '1 image analysis every 5 hours', icon: <ImageIcon size={16} /> },
      { text: '1 report share every 5 hours', icon: <FileText size={16} /> },
      { text: 'Basic AI mechanic access', icon: <Zap size={16} /> },
    ],
    includes: [
      'Free includes:',
      'Fast Answer mode',
      'Dashboard photo analysis',
      'Diagnostic report generation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For frequent drivers & car owners',
    description: 'Unlimited AI chat with smarter guidance and expanded reports.',
    monthlyPrice: 12,
    yearlyPrice: 9,
    trial: '3-Day Free Trial',
    cta: 'Start Free Trial',
    popular: false,
    accentColor: 'blue',
    features: [
      { text: 'Unlimited AI chat sessions', icon: <MessageCircle size={16} /> },
      { text: 'Full image & dashboard analysis', icon: <ImageIcon size={16} /> },
      { text: '15 shareable reports / month', icon: <FileText size={16} /> },
      { text: 'Avoid Overpaying protection', icon: <ShieldCheck size={16} /> },
      { text: 'Standard support', icon: <ShieldCheck size={16} /> },
    ],
    includes: [
      'Everything in Free, plus:',
      'Expert Answer mode',
      'Voice input (microphone)',
      'Advanced follow-up flow',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    tagline: 'The complete AI mechanic experience',
    description: 'Full diagnostic power with image AI, voice, and Expert analysis.',
    monthlyPrice: 29,
    yearlyPrice: 24,
    cta: 'Get Advanced',
    popular: true,
    accentColor: 'blue',
    badgeLabel: 'Most Powerful',
    features: [
      { text: 'Fast + Expert Answer modes', icon: <Activity size={16} />, highlight: true },
      { text: 'Advanced diagnostic logic', icon: <Brain size={16} />, highlight: true },
      { text: 'Image-based diagnosis', icon: <ImageIcon size={16} />, highlight: true },
      { text: 'Voice input & TTS readback', icon: <Mic size={16} />, highlight: true },
      { text: 'Structured follow-up flow', icon: <Star size={16} />, highlight: true },
      { text: 'Priority support', icon: <ShieldCheck size={16} /> },
    ],
    includes: [
      'Everything in Pro, plus:',
      'Unlimited report sharing',
      'Advanced cost estimation',
    ],
  },
]
