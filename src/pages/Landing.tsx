import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { ScrollProgress } from '../components/ui/scroll-progress-1'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Logo, Wordmark } from '../components/ui/Brand'
import CarxGradientBg from '../components/ui/CarxGradientBg'

// Lazy loaded components for bundle optimization
const Pricing = lazy(() => import('../components/Pricing'))
const ReviewsSlider = lazy(() => import('../components/ReviewsSlider'))
const BrandSlider = lazy(() => import('../components/BrandSlider'))
const StoryModal = lazy(() => import('../components/StoryModal'))
const SymptomCarousel = lazy(() => import('../components/ui/SymptomCarousel'))
const TrustSection = lazy(() => import('../components/TrustSection'))

import { 
  Bot, Users, Truck, CheckCircle2, Zap, Clock, CheckCircle, Activity, 
  Aperture, MapPin, Mic, ImagePlus, ShieldAlert,
  UserCircle, X, ChevronRight, DollarSign, LayoutDashboard, User, LogOut, 
  Send, ChevronDown, HelpCircle, Camera, AlertTriangle, Star
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// IMMERSIVE SCROLL DEMO COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const CHAT_SEQUENCE = [
  { 
    id: 1, 
    type: 'user', 
    content: "My ABS light just came on while driving. Is it safe to keep going?", 
    image: "/dashboard_abs_warning_light.png",
    timestamp: "10:12 AM" 
  },
  { 
    id: 2, 
    type: 'ai', 
    sender: 'AI Mechanic',
    content: "I can see the ABS warning light on your dashboard. Your normal brakes still work — but the anti-lock system is off, so your wheels could lock up under hard braking. When did you first notice it?", 
    timestamp: "10:12 AM" 
  },
  { 
    id: 3, 
    type: 'user', 
    content: "About 10 minutes ago. It started raining and the light came on after I braked hard at a traffic light.", 
    timestamp: "10:13 AM" 
  },
  { 
    id: 4, 
    type: 'ai', 
    sender: 'AI Mechanic',
    content: "That timing is helpful. Hard braking in wet conditions can trigger an ABS fault if a wheel speed sensor loses signal. Has the light stayed on continuously since then, or does it come and go?", 
    timestamp: "10:13 AM"
  },
  { 
    id: 5, 
    type: 'user', 
    content: "It's stayed on the whole time. Should I pull over?", 
    timestamp: "10:14 AM" 
  },
  { 
    id: 6, 
    type: 'ai', 
    sender: 'AI Mechanic',
    content: "You don't need to pull over immediately — your main brakes are fine. But avoid sudden stops and drive below 50 km/h until you can get it scanned. Here's my full assessment:", 
    timestamp: "10:14 AM",
    action: "Diagnostic Analysis Complete"
  },
  { 
    id: 7, 
    type: 'ai-card',
    title: "Diagnostic Report",
    severity: "Medium",
    finding: "ABS Module — Wheel Speed Sensor Fault",
    advice: "Most likely cause: a dirty or failing front wheel speed sensor. Common on this model after 50k km. Not urgent, but should be scanned within the next few days.",
    mechanic: "Schneider Automotive",
    mechanicReason: "Specializes in ABS & braking systems",
    timestamp: "10:15 AM"
  }
];

// Render a single user message - Messenger Style
const UserBubble = ({ msg }: { msg: any }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    className="flex flex-col items-end gap-2"
  >
      {msg.image && (
        <div className="w-full rounded-2xl overflow-hidden border border-slate-100 shadow-md aspect-video bg-slate-100">
          <img 
            src={msg.image.replace('.png', '.webp')} 
            alt="Dashboard scan" 
            className="w-full h-auto object-cover max-h-[130px]" 
            width={340}
            height={130}
            fetchPriority="high"
          />
        </div>
      )}
    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-[4px] bg-[#0084FF] text-white text-[11px] font-medium leading-relaxed shadow-sm">
      {msg.content}
    </div>
  </motion.div>
);

// Render a single AI message - Messenger Style
const AiBubble = ({ msg }: { msg: any }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    className="flex flex-col items-start"
  >
    <div className="flex items-center gap-2 mb-1.5 opacity-60">
      <div className="w-4.5 h-4.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
        <Bot size={11} />
      </div>
      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Carsafety Assistant</span>
    </div>
    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-[4px] bg-[#F0F2F5] text-[#1C1E21] text-[11px] font-medium leading-relaxed border border-slate-100/50">
      {msg.content}
    </div>
    {msg.action && (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-600 mt-2.5 shadow-sm">
        <CheckCircle size={10} />
        <span className="text-[7px] font-bold uppercase tracking-widest">Analysis Linked</span>
      </div>
    )}
  </motion.div>
);

// Render the diagnostic report card - Premium Messenger Style
const DiagnosticCard = ({ msg }: { msg: any }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, y: 12 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="p-4 rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col gap-3 relative overflow-hidden ring-1 ring-slate-50"
  >
    <div className="flex items-center justify-between mb-0.5">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0084FF] animate-pulse" />
        <span className="text-[8px] font-black text-[#0084FF] uppercase tracking-widest">Report Ready</span>
      </div>
      <div className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[7px] font-black uppercase tracking-wider border border-orange-100/50">
        {msg.severity} Priority
      </div>
    </div>
    <h4 className="font-display font-bold text-[12px] leading-tight text-slate-900 pr-4">{msg.finding}</h4>
    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50 text-[9px] text-slate-600 font-medium leading-relaxed">
      {msg.advice}
    </div>
    <div className="p-2.5 rounded-2xl bg-[#F0F7FF] border border-blue-100/50 flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#0084FF] shadow-sm border border-blue-50 mt-0.5 flex-shrink-0">
        <MapPin size={12} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold text-slate-800">{msg.mechanic}</span>
        <span className="text-[8px] text-slate-500 font-medium leading-tight">{msg.mechanicReason}</span>
      </div>
    </div>
    <button className="w-full py-2.5 rounded-xl bg-[#0084FF] text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all text-[9px] font-black uppercase tracking-widest">
      <MapPin size={11} />
      Open Map
    </button>
  </motion.div>
);

// Refined delays for a snappy replay feel
const MESSAGE_DELAYS = [
  400,   // msg 1: fast intro
  1600,  // msg 2: ai response time
  2400,  // msg 3: user context
  1800,  // msg 4: ai follow up
  2200,  // msg 5: user urgency
  1600,  // msg 6: ai safety advice
  1200,  // card: final report reveal
];

const ScrollChatDemo = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-play replay logic: Snappy reveal, no typing indicators
  useEffect(() => {
    const totalMessages = CHAT_SEQUENCE.length;
    let currentIndex = 0;
    let timeoutId: any;

    const showNext = () => {
      if (currentIndex < totalMessages) {
        const delay = MESSAGE_DELAYS[currentIndex] || 1500;
        
        timeoutId = setTimeout(() => {
          setVisibleCount(currentIndex + 1);
          currentIndex++;
          showNext();
        }, delay);
      } else {
        // Continuous Replay: Pause at end then restart
        timeoutId = setTimeout(() => {
          setVisibleCount(0);
          currentIndex = 0;
          showNext();
        }, 6000);
      }
    };

    showNext();
    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-scroll chat container when new messages appear
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleCount]);

  return (
    <div className="relative w-full max-w-[280px] md:max-w-[340px] aspect-[9/19] mx-auto scale-[0.82] md:scale-100 pb-12">
      <div className="absolute inset-0 bg-[#0F0F0F] rounded-[54px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)] ring-[6px] ring-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-[10px] bg-white rounded-[44px] overflow-hidden flex flex-col">
          
          {/* Top Bezel Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-[#0F0F0F] rounded-full z-[100] flex items-center justify-center gap-3 shadow-inner">
             <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] shadow-inner" />
             <div className="w-8 h-1 bg-[#1A1A1A] rounded-full opacity-50" />
          </div>

          {/* Messenger-Like Header */}
          <div className="pt-11 pb-3 px-5 flex items-center justify-between border-b border-slate-50/80 bg-white/95 backdrop-blur-md z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[25%] overflow-hidden shadow-md">
                <Logo size="100%" />
              </div>
              <div className="flex flex-col leading-none">
                <Wordmark size="sm" className="mb-0.5" />
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Live Replay</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-300">
                <UserCircle className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Chat Replay Stream */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto relative bg-white scrollbar-hide px-4 py-5" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-col gap-5">
              {CHAT_SEQUENCE.slice(0, visibleCount).map((msg) => {
                if (msg.type === 'user') return <UserBubble key={msg.id} msg={msg} />;
                if (msg.type === 'ai') return <AiBubble key={msg.id} msg={msg} />;
                if (msg.type === 'ai-card') return <DiagnosticCard key={msg.id} msg={msg} />;
                return null;
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Static Clean Input Bar */}
          <div className="px-4 py-4 bg-white border-t border-slate-50 mt-auto pb-8">
            <div className="h-10 w-full rounded-full bg-[#F0F2F5] flex items-center px-4 gap-3 text-slate-400 opacity-60">
              <span className="text-[10px] font-medium flex-1">Recorded Session Replay</span>
              <div className="flex items-center gap-3">
                <Mic size={14} className="text-slate-300" />
                <div className="w-7 h-7 rounded-full bg-[#E4E6EB] flex items-center justify-center text-white scale-90">
                  <Send size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Realistic Side Buttons */}
        <div className="absolute right-[-4px] top-[100px] w-1 h-12 bg-[#1A1A1A] rounded-l-md" />
        <div className="absolute left-[-4px] top-[100px] w-1 h-8 bg-[#1A1A1A] rounded-r-md" />
        <div className="absolute left-[-4px] top-[148px] w-1 h-8 bg-[#1A1A1A] rounded-r-md" />
      </div>
    </div>
  )
}

const features = [
  { icon: Activity, title: 'AI Diagnosis', desc: 'Instant breakdown analysis' },
  { icon: Zap, title: 'Warning Light Help', desc: 'Understand dashboard alerts' },
  { icon: Users, title: 'Provider Discovery', desc: 'Discover trusted local options' },
  { icon: Truck, title: 'Towing Options', desc: 'Find nearby visibility options' },
  { icon: Aperture, title: 'Nearby Help Map', desc: 'Explore providers on a map' },
  { icon: ShieldAlert, title: 'Urgency Detection', desc: 'Know if it\'s an emergency' },
  { icon: ImagePlus, title: 'Photo Analysis', desc: 'AI visual damage check' },
  { icon: CheckCircle2, title: 'Clear Guidance', desc: 'Step-by-step next steps' },
]

const reviews = [
  { name: 'Jason M.', car: 'Toyota RAV4 • Sensor Fault', rating: 5, text: 'Saved me from an unnecessary garage visit. It analyzed my dashboard photo instantly and explained the sensor issue in plain English.', date: '1 month ago', image: '/JBJ RIV 1.jpg' },
  { name: 'Jessica W.', car: 'BMW 3 Series • Warning Light', rating: 5, text: 'Carx.ai helped me understand the warning light in seconds and showed me the right next step without confusing jargon.', date: '3 weeks ago', image: '/JBJ RIV 2.jpg' },
  { name: 'Sarah J.', car: 'VW Golf • Overheating', rating: 5, text: 'My temperature gauge spiked. The AI told me exactly what to check safely and helped me find a nearby tow truck immediately. A total lifesaver.', date: '2 weeks ago', image: '/JBJ RIV 3.jpg' },
  { name: 'Michael B.', car: 'Audi A3 • No-Start Issue', rating: 5, text: 'Simple, clear, and actually useful. My car wouldn\'t turn over, and the breakdown analysis pointed right to the battery instead of the starter.', date: '1 month ago', image: '/JBJ RIV 4.jpg' },
  { name: 'Robert T.', car: 'Mercedes C-Class • Stranded', rating: 5, text: 'I broke down at night and needed visibility fast. The nearby help map found an open mechanic and towing option much faster than standard searching.', date: '5 days ago', image: '/JBJ RIV 5.jpg' },
  { name: 'Ryan K.', car: 'Peugeot 208 • Strange Noise', rating: 5, text: 'I uploaded a 10-second audio clip of a grinding sound. It correctly identified worn brake pads and told me to get them changed this week.', date: '2 months ago', image: '/JBJ RIV 6.jpg' },
]

const faqData = [
  {
    question: "Is the diagnosis accurate?",
    answer: "Our system provides highly accurate estimates based on real-world car issues and data. While it’s very reliable, we always recommend confirming with a professional mechanic."
  },
  {
    question: "Is this service free?",
    answer: "Yes, the basic diagnosis is completely free. Additional premium features may be added in the future."
  },
  {
    question: "How long does it take?",
    answer: "Less than 60 seconds. Just answer a few questions and get your results instantly."
  },
  {
    question: "What types of cars are supported?",
    answer: "We support most common car brands and models, including petrol, diesel, and hybrid vehicles."
  },
  {
    question: "What should I do after getting the result?",
    answer: "You’ll receive recommendations and next steps. You can either fix the issue yourself or contact a nearby mechanic."
  },
  {
    question: "Can I find a mechanic through the platform?",
    answer: "Yes, we help you connect with nearby trusted mechanics based on your location."
  },
  {
    question: "Is my data safe?",
    answer: "Yes, your information is secure and never shared with third parties without your consent."
  },
  {
    question: "What if the diagnosis is wrong?",
    answer: "Our system gives the most likely causes, but cars can be complex. Always confirm with a professional for final verification."
  },
  {
    question: "Does it work on mobile?",
    answer: "Absolutely. Our platform is fully optimized for mobile devices."
  }
]

const FAQItem = ({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) => (
  <div className="border-b border-slate-100 last:border-0 px-6">
    <button
      onClick={onClick}
      className="w-full py-6 flex items-center justify-between gap-4 text-left group"
    >
      <span className={`text-base md:text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-[#0070E0]' : 'text-slate-900 group-hover:text-[#0070E0]'}`}>
        {question}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${isOpen ? 'bg-[#0070E0] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}
      >
        <ChevronDown size={18} />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="pb-6 text-sm md:text-base text-slate-500 font-medium leading-relaxed pr-8">
            {answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

export default function Landing() {
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  const userInitial = user?.email?.[0].toUpperCase() ?? 'U'
  const [storyOpen, setStoryOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(-1)
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"]
  });

  const scrollProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Natural Hero - Scroll-Driven Focus
  const textY = useTransform(scrollProgress, [0, 0.5], [0, -50]);
  const initialFadeOut = useTransform(scrollProgress, [0, 0.4], [1, 0]);
  const phoneRotate = useTransform(scrollProgress, [0, 0.5, 1], [0, -3, 0]);
  const phoneScale = useTransform(scrollProgress, [0, 0.5], [1, 1.08]);
  const phoneY = useTransform(scrollProgress, [0, 0.5, 0.95, 1], [0, -180, -185, -260]); 




  return (
    <div className="relative min-h-screen bg-white text-on-surface selection:bg-navy/10 transition-colors duration-300">
      {/* Global atmospheric gradient background */}
      <CarxGradientBg />

      <div className="relative z-10">
        <ScrollProgress variant="carx" size="sm" showPercentage={false} />
        
        <Navbar 
          showNavLinks 
          onMenuClick={() => setMobileMenuOpen(true)} 
          onStoryClick={() => setStoryOpen(true)} 
        />

        <main id="main-content">

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-surface/98 dark:bg-surface-low backdrop-blur-2xl flex flex-col items-center justify-center gap-8 p-8"
            >
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-surface-low dark:bg-surface-high/40 flex items-center justify-center text-muted"
              >
                <X className="w-6 h-6" />
              </button>

              {[
                { name: 'Features', id: 'features' },
                { name: 'How it works', id: 'how-it-works' },
                { name: 'Pricing', id: 'pricing' },
                { name: 'Reviews', id: 'reviews' },
                { name: 'FAQ', id: 'faq' },
              ].map((link) => (
                <a 
                  key={link.id}
                  href={`/#${link.id}`} 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }); 
                    setMobileMenuOpen(false);
                  }} 
                  className="text-2xl font-bold text-on-surface"
                >
                  {link.name}
                </a>
              ))}
              
              {user ? (
                <div className="flex flex-col items-center gap-4 w-full px-10">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center text-white text-4xl font-display font-bold shadow-2xl shadow-navy/20 ring-4 ring-surface-low dark:ring-surface-low/80 border border-navy/10 mb-4 relative overflow-hidden">
                    <span className="relative z-10">{userInitial}</span>
                    <div className="absolute inset-0 bg-white/10" />
                  </div>
                  <div className="text-center mb-8">
                    <p className="text-on-surface font-bold text-xl mb-1">{user.email?.split('@')[0]}</p>
                    <p className="text-muted text-sm font-medium tracking-wide">{user.email}</p>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <Link to="/dashboard" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-navy text-white font-bold shadow-xl shadow-navy/20" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-5 h-5" />
                      Go to Dashboard
                    </Link>
                    <Link to="/my-account" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-overlay bg-surface dark:bg-surface-high/40 text-on-surface font-bold" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-5 h-5" />
                      My Account
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-red-100 bg-red-50/30 text-red-500 font-bold">
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full px-10">
                  <Link to="/auth?mode=login" className="text-lg text-muted" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  <Link to="/auth" className="w-full py-4 rounded-2xl bg-navy text-white font-bold text-center shadow-lg shadow-navy/20" onClick={() => setMobileMenuOpen(false)}>Start Free Trial</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Immersive Scroll Hero Section */}
        <section ref={heroRef} className="relative min-h-[100dvh] md:min-h-[85vh] w-full flex items-start md:items-center justify-center pt-[120px] md:pt-16 pb-16 px-6 md:overflow-hidden touch-action-pan-y">
          <div className="max-w-7xl mx-auto w-full relative z-10 mt-0 md:-mt-10">
              <div className="grid lg:grid-cols-2 gap-4 md:gap-8 lg:gap-20 items-center">
                
                {/* Left Column: Fixed Headlines */}
                <motion.div style={{ y: textY }} className="text-center lg:text-left">
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: initialFadeOut }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-[#0070E0]/20 bg-gradient-to-r from-[#0070E0]/5 to-transparent backdrop-blur-md shadow-[0_0_15px_rgba(0,112,224,0.1)] relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="w-5 h-5 rounded-full bg-[#0070E0]/10 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-[#0070E0]" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-[#0070E0] to-[#004A99] font-black pr-1">Instant Car Diagnosis</span>
                  </motion.div>

                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: initialFadeOut }}
                    transition={{ delay: 0.1 }}
                    className="font-display font-bold text-4xl md:text-7xl lg:text-8xl leading-[1.05] mb-4 md:mb-8 text-[#0F172A] tracking-tight"
                  >
                    Stop Overpaying for <br />
                    <span className="text-[#0070E0]">Car Repairs.</span>
                  </motion.h1>

                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: initialFadeOut }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 text-base md:text-lg lg:text-xl mb-10 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed"
                  >
                    Diagnose your car problem in 30 seconds — no mechanic needed.
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: initialFadeOut }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4"
                  >
                    {/* Primary CTA — Premium Gradient */}
                    <button 
                      onClick={() => navigate('/auth?mode=register')} 
                      className="w-full sm:w-auto relative group"
                    >
                      <div className="relative px-8 py-5 flex items-center justify-center gap-2.5 rounded-[20px] font-black uppercase tracking-wider text-white text-[14px] transition-all duration-300 bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] shadow-[0_15px_35px_-10px_rgba(0,115,231,0.4)] border border-white/20 group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_45px_-10px_rgba(0,115,231,0.5)]">
                        Start Free Diagnosis
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                    </button>

                    {/* Secondary CTA — Refined Glass */}
                    <button 
                      onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} 
                      className="w-full sm:w-auto px-8 py-4 md:py-5 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm text-slate-600 font-bold text-[15px] hover:border-[#0070E0]/30 hover:text-[#0070E0] hover:bg-[#F0F7FF]/60 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      View Pricing
                    </button>
                  </motion.div>

                  {/* Trust Line */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ opacity: initialFadeOut }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-6"
                  >
                    <span>Trusted by drivers</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                    <span>Instant results</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                    <span>No signup required</span>
                  </motion.div>
                </motion.div>

                {/* Right Column: Scroll-Synced Phone Demo */}
                <div className="relative flex justify-center perspective-1000 -mt-2 md:mt-0">
                  <motion.div 
                    style={{ 
                      rotateY: phoneRotate, 
                      scale: phoneScale,
                      y: phoneY 
                    }}
                    className="w-full flex justify-center"
                  >
                    <ScrollChatDemo />
                  </motion.div>
                </div>

              </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div 
              style={{ opacity: initialFadeOut }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scroll for more</span>
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-8 rounded-full bg-gradient-to-b from-[#0070E0] to-transparent"
              />
            </motion.div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="relative py-20 md:py-24 px-6 bg-slate-50/60 backdrop-blur-sm overflow-hidden border-t border-slate-100">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">The Problem</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-12 tracking-tight leading-tight text-on-surface">Car trouble gets <br className="md:hidden" /> stressful fast</h2>
            <div className="grid md:grid-cols-3 gap-5 w-full">
              {[
                { title: 'Confusing warning lights', desc: 'Hard to understand fast', icon: ShieldAlert },
                { title: 'Expensive diagnostics', desc: 'Simple answers cost too much', icon: DollarSign },
                { title: 'Hard to find help', desc: 'You lose time when it matters', icon: Clock }
              ].map((prob, i) => (
                <div key={i} className="group p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-[#0070E0]/20 hover:shadow-xl transition-all text-left flex flex-col items-start gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#0070E0]/5 flex items-center justify-center border border-[#0070E0]/10 group-hover:bg-[#0070E0] group-hover:text-white transition-all duration-300">
                    <prob.icon className="w-6 h-6 text-[#0070E0] group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold text-lg leading-tight mb-1">{prob.title}</div>
                    <div className="text-sm text-slate-500 font-medium">{prob.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-navy font-black mt-12 text-sm tracking-[0.2em] uppercase opacity-80">Carsafety gives you immediate clarity and helps discover nearby options.</p>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative py-24 md:py-28 px-6 bg-gradient-to-b from-slate-50/50 to-white overflow-hidden border-t border-slate-100">
          <div className="max-w-6xl mx-auto flex flex-col relative z-10">
            <div className="text-center flex flex-col items-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">How It Works</span>
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] text-slate-900 max-w-3xl">
                From Confusion to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#0070E0]">Clarity</span> — <br className="hidden md:block" />
                in Seconds
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 w-full relative">
              {/* Card 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.1 }}
                className="group relative flex flex-col bg-white p-8 md:p-10 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-400"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0070E0] mb-6 flex items-center justify-center border border-blue-100/50 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Upload a Photo <br/> or Sound</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-6">Show us the problem — no technical skills needed.</p>
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    <Mic className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[60%] bg-[#0070E0] rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2 }}
                className="group relative flex flex-col bg-white p-8 md:p-10 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-400"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mb-6 flex items-center justify-center border border-amber-100/50 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">See the Real Problem + Risk Level</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-6">We identify the issue exactly and show how serious it is right now.</p>
                
                <div className="mt-auto pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-emerald-500 opacity-20" />
                    <div className="flex-1 h-2 rounded-full bg-amber-400 opacity-20" />
                    <div className="flex-1 h-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                  </div>
                  <div className="flex justify-between mt-2.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <span>Safe</span>
                    <span>Warning</span>
                    <span className="text-red-500">Dangerous</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.3 }}
                className="group relative flex flex-col bg-white p-8 md:p-10 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-400"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-6 flex items-center justify-center border border-emerald-100/50 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Know What <br/> to Do Next</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-6">See if you can keep driving, and get matched with a trusted mechanic.</p>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    <div className="flex -space-x-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-[11px] font-black text-slate-700">4.8</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100/50">Top-Rated</span>
                </div>
              </motion.div>
            </div>

            {/* Bottom CTA Block */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="max-w-2xl mx-auto text-center mt-20 pt-10 border-t border-slate-200/60"
            >
              <p className="text-xl md:text-2xl font-bold text-slate-800 mb-10 leading-snug">
                We don’t just detect the problem — we tell you <span className="text-[#0070E0]">how serious it is</span> and what to do next.
              </p>
              
              <button 
                onClick={() => navigate('/auth')} 
                className="group relative inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-[20px] font-black uppercase tracking-widest text-white text-[14px] transition-all duration-300 bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] shadow-[0_15px_35px_-10px_rgba(0,115,231,0.4)] border border-white/20 hover:-translate-y-1 hover:shadow-[0_20px_45px_-10px_rgba(0,115,231,0.5)] active:scale-[0.98]"
              >
                Check Now
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Free</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>60 Seconds</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span>No Sign-up</span>
              </div>
            </motion.div>

          </div>
        </section>

        <Suspense fallback={<div className="h-96 w-full animate-pulse-slow bg-slate-50/50" />}>
          <TrustSection onStoryClick={() => setStoryOpen(true)} />
        </Suspense>

        {/* Brand Compatibility Slider */}
        <Suspense fallback={<div className="h-32 w-full animate-pulse-slow" />}>
          <BrandSlider />
        </Suspense>

        {/* Features */}
        <section id="features" className="relative py-20 md:py-24 px-0 overflow-hidden bg-white/70 backdrop-blur-sm border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Platform Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface">Everything you need</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">Smart assistance at every turn.</p>
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-muted">
              <div className="w-8 h-px bg-overlay" />
              Swipe to explore
              <div className="w-8 h-px bg-overlay" />
            </div>
          </div>

          <div className="relative">
            {/* Gradient Mask for Fade Effect */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <motion.div 
              className="flex gap-6 px-6 md:px-0"
              animate={{
                x: [0, -2400],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear",
                },
              }}
              style={{ width: "fit-content" }}
            >
              {[...features, ...features, ...features].map((feature, i) => (
                <article 
                  key={i} 
                  className="flex-shrink-0 w-[280px] p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-[#0070E0]/20 hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-[#0070E0] group-hover:text-white transition-all shadow-sm">
                    <feature.icon className="w-7 h-7 text-[#0070E0] group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Symptom Library Carousel */}
        <section id="guides" className="relative py-24 md:py-24 px-6 bg-[#F8FAFC]/50 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-12 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 bg-blue-50 border border-blue-100">
               <Activity className="w-3.5 h-3.5 text-[#0070E0]" />
               <span className="text-[10px] uppercase tracking-[0.2em] text-[#0070E0] font-black">Symptom Library</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-[#0F172A] mb-6">
              Common problems we help <span className="text-[#0070E0]">diagnose.</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Browse our high-trust guides for common symptoms and warning lights. Learn what they mean, how urgent they are, and how Carsafety can help.
            </p>
          </div>
          <Suspense fallback={<div className="h-[600px] w-full animate-pulse-slow bg-slate-50/50 rounded-[4rem]" />}>
            <SymptomCarousel />
          </Suspense>
        </section>

        {/* Reviews */}
        <section id="reviews" className="relative py-24 md:py-24 px-0 bg-slate-50/60 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-12 md:mb-16 text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Trusted by Drivers</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface italic">What drivers say <br className="md:hidden" /> about Carsafety</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">Real experiences from our community of supported drivers.</p>
          </div>

          <Suspense fallback={<div className="h-96 w-full animate-pulse-slow" />}>
            <ReviewsSlider reviews={reviews} />
          </Suspense>
        </section>

        <Suspense fallback={<div className="h-96 w-full animate-pulse-slow bg-slate-50/50" />}>
          <Pricing />
        </Suspense>

        {/* FAQ Section */}
        <section id="faq" className="relative py-24 md:py-24 px-6 bg-white/70 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
                <HelpCircle className="w-3.5 h-3.5 text-navy" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Help Center</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface mb-6">Common Questions</h2>
              <p className="text-muted text-lg md:text-xl font-medium">Everything you need to know about Carsafety.</p>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-2 md:p-4">
              {faqData.map((faq, index) => (
                <FAQItem 
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaqIndex === index}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 md:py-28 px-6 text-center flex flex-col items-center bg-slate-50/60 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Get Started</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-display font-bold mb-8 leading-tight tracking-tight text-on-surface">Ready for clarity and <br className="hidden md:block" /> peace of mind?</h2>
            <p className="text-muted text-xl md:text-2xl font-medium mb-14 max-w-2xl mx-auto">Get AI diagnostics, clear step-by-step guidance, and nearby provider discovery in one smart platform.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-10 py-5 rounded-[20px] font-black uppercase tracking-wider text-white text-[15px] transition-all duration-300 bg-gradient-to-br from-[#0073e7] via-[#005BB5] to-[#004A99] shadow-[0_15px_35px_-10px_rgba(0,115,231,0.4)] border border-white/20 hover:-translate-y-1 hover:shadow-[0_20px_45px_-10px_rgba(0,115,231,0.5)] active:scale-95"
              >
                Start Free Trial
              </button>
               <button 
                onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-overlay bg-surface dark:bg-surface-high/40 text-on-surface font-bold hover:bg-surface-low transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>
        </main>
        {/* Footer */}
        <Footer onStoryClick={() => setStoryOpen(true)} />
      </div>

      {/* Premium Story Modal */}
      <Suspense fallback={null}>
        <StoryModal
          isOpen={storyOpen}
          onClose={() => setStoryOpen(false)}
          onCTAClick={() => navigate('/auth?mode=register')}
        />
      </Suspense>
    </div>
  )
}
