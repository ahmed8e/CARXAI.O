import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { ScrollProgress } from '../components/ui/scroll-progress-1'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Pricing from '../components/Pricing'
import ReviewsSlider from '../components/ReviewsSlider'
import StoryModal from '../components/StoryModal'
import { 
  Bot, 
  Users, 
  Truck, 
  CheckCircle2, 
  Zap,
  Clock,
  CheckCircle, Activity,
  Aperture,
  MapPin, Mic,
  ImagePlus, ShieldAlert,
  MessageSquare, Sparkles,
  UserCircle, X, ChevronRight, 
  DollarSign, LayoutDashboard, User, LogOut, Cpu, ShieldCheck, BadgeCheck, Send
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
      <div className="w-full rounded-2xl overflow-hidden border border-slate-100 shadow-md">
        <img src={msg.image} alt="Dashboard scan" className="w-full h-auto object-cover max-h-[130px]" />
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
      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">CarxAI Assistant</span>
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
    <div className="relative w-full max-w-[280px] md:max-w-[340px] aspect-[9/19] mx-auto scale-[0.91] md:scale-100 pb-12">
      <div className="absolute inset-0 bg-[#0F0F0F] rounded-[54px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)] ring-[6px] ring-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-[10px] bg-white rounded-[44px] overflow-hidden flex flex-col">
          
          {/* Top Bezel Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-[#0F0F0F] rounded-full z-[100] flex items-center justify-center gap-3 shadow-inner">
             <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] shadow-inner" />
             <div className="w-8 h-1 bg-[#1A1A1A] rounded-full opacity-50" />
          </div>

          {/* Messenger-Like Header */}
          <div className="pt-11 pb-3 px-5 flex items-center justify-between border-b border-slate-50/80 bg-white/95 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0084FF] to-[#00C6FF] flex items-center justify-center text-white shadow-md">
                <Zap size={13} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xs tracking-tight text-[#0F172A] leading-none mb-0.5">CarxAI Mechanic</span>
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider leading-none">Live Replay</span>
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

const steps = [
  { num: '01', title: 'Describe the issue', desc: 'Use text, voice, or a photo to explain the problem.', icon: MessageSquare },
  { num: '02', title: 'Get AI diagnosis', desc: 'Receive instant analysis and digital guidance.', icon: Cpu },
  { num: '03', title: 'Understand urgency', desc: 'Know how severe it is and see clear next steps.', icon: ShieldAlert },
  { num: '04', title: 'Explore options', desc: 'Discover nearby mechanic and towing providers if needed.', icon: MapPin },
]

export default function Landing() {
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  const userInitial = user?.email?.[0].toUpperCase() ?? 'U'
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [storyOpen, setStoryOpen] = useState(false)
  const timerRef = useRef<any>(null)

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % steps.length)
    }, 5000)
  }

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
  // Initial state is a clean, composed layout (y:0, scale:1)
  // Scroll drives the phone upward into a full-focus focal point
  const textY = useTransform(scrollProgress, [0, 0.5], [0, -50]);
  const initialFadeOut = useTransform(scrollProgress, [0, 0.4], [1, 0]);
  const phoneRotate = useTransform(scrollProgress, [0, 0.5, 1], [0, -3, 0]);
  const phoneScale = useTransform(scrollProgress, [0, 0.5], [1, 1.08]);
  const phoneY = useTransform(scrollProgress, [0, 0.5, 0.95, 1], [0, -180, -185, -260]); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isMobile])



  return (
    <div className="relative min-h-screen bg-surface dark:bg-surface-low text-on-surface selection:bg-navy/10 transition-colors duration-300">
      {/* Background is now localized to specific sections (e.g. Hero) */}

      <div className="relative z-10">
        <ScrollProgress variant="carx" size="sm" showPercentage={false} />
        
        <Navbar showNavLinks onMenuClick={() => setMobileMenuOpen(true)} />

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
                  <Link to="/auth" className="w-full py-4 rounded-2xl bg-navy text-white font-bold text-center shadow-lg shadow-navy/20" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Immersive Scroll Hero Section - Light SaaS Aesthetic */}
        <section ref={heroRef} className="relative h-[160vh] bg-white">
          <div className="sticky top-0 h-screen w-full flex items-start md:items-center justify-center px-6 overflow-hidden">
             {/* Light SaaS Background Elements */}
            <div className="absolute inset-0 z-0 bg-white">
               {/* Subtle Dot Grid — Refined for unification */}
               <div className="absolute inset-0 opacity-[0.08] pointer-events-none" 
                 style={{ 
                   backgroundImage: 'radial-gradient(circle, #0070E0 0.5px, transparent 0.5px)', 
                   backgroundSize: '48px 48px' 
                 }} 
               />
               {/* Soft Blue Glow — Identical to Pricing for unification */}
               <div className="absolute inset-0 z-0"
                 style={{
                   background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,112,224,0.06) 0%, transparent 80%)',
                 }}
               />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10 pt-20 md:pt-0">
              <div className="grid lg:grid-cols-2 gap-4 md:gap-8 lg:gap-20 items-center">
                
                {/* Left Column: Fixed Headlines */}
                <motion.div style={{ y: textY }} className="text-center lg:text-left">
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: initialFadeOut }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-blue-100 bg-blue-50/50 backdrop-blur-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#0070E0]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#0070E0] font-black">Interactive Product Tour</span>
                  </motion.div>

                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: initialFadeOut }}
                    transition={{ delay: 0.1 }}
                    className="font-display font-bold text-4xl md:text-7xl lg:text-8xl leading-[1.05] mb-4 md:mb-8 text-[#0F172A] tracking-tight"
                  >
                    Car trouble? <br />
                    <span className="text-[#0070E0]">Find clarity fast.</span>
                  </motion.h1>

                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ opacity: initialFadeOut }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 text-base md:text-xl lg:text-2xl mb-6 md:mb-12 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
                  >
                    Experience how CarxAI guides you from a warning light to a reliable fix, instantly. Scroll to see the demo.
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
                      className="relative w-full sm:w-auto overflow-hidden rounded-2xl group"
                    >
                      <div
                        className="relative px-8 py-4 md:py-5 flex items-center justify-center gap-2.5 font-black text-[15px] text-white transition-all duration-300 group-hover:-translate-y-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #0070E0 0%, #0050C4 100%)',
                          boxShadow: '0 1px 0 0 rgba(255,255,255,0.15) inset, 0 20px 48px -8px rgba(0,112,224,0.45)',
                        }}
                      >
                        {/* Shimmer line */}
                        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        Start 3 Days Free
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
          </div>
        </section>

        {/* Problem Section — Standardized Background */}
        <section id="problem" className="relative py-20 md:py-32 px-6 bg-slate-50 overflow-hidden border-t border-slate-100">
          {/* Section Glow Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-60"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,112,224,0.08) 0%, transparent 70%)',
            }}
          />
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
            <p className="text-navy font-black mt-12 text-sm tracking-[0.2em] uppercase opacity-80">Carxai gives you immediate clarity and helps discover nearby options.</p>
          </div>
        </section>

        {/* How It Works — Standardized Background */}
        <section id="how-it-works" className="relative py-20 md:py-32 px-0 overflow-hidden bg-white border-t border-slate-100">
          {/* Section Glow Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,112,224,0.08) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface">From breakdown to backup</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-xl mx-auto mt-4">Four steps. Minutes, not hours.</p>
          </div>

          {/* Steps Grid / Carousel */}
          <div className="relative overflow-hidden md:overflow-visible py-4">
            <motion.div 
              className="flex md:grid md:grid-cols-4 gap-6 px-6 md:px-0 md:max-w-6xl md:mx-auto"
              drag={isMobile ? "x" : false}
              dragConstraints={{ 
                right: 0, 
                left: isMobile ? -(steps.length - 1) * (window.innerWidth - 24) : 0 
              }}
              animate={{ x: isMobile ? -activeIndex * (window.innerWidth - 24) : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onDragEnd={(_, info) => {
                resetTimer();
                const shift = info.offset.x;
                if (shift < -50 && activeIndex < steps.length - 1) setActiveIndex(prev => prev + 1);
                if (shift > 50 && activeIndex > 0) setActiveIndex(prev => prev - 1);
              }}
            >
              {/* Connector line — desktop only */}
              <div className="hidden md:block absolute top-[52px] left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px z-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,112,224,0.2) 15%, rgba(0,112,224,0.2) 85%, transparent)' }}
              />

              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  transition={{ duration: 0.5 }}
                  className={`flex-shrink-0 w-[calc(100vw-48px)] md:w-auto relative group transition-all duration-700 ${isMobile && activeIndex === i ? 'scale-100 opacity-100' : isMobile ? 'scale-95 opacity-40 blur-[1px]' : ''}`}
                >
                  {/* Numbered Badge */}
                  <div className="flex justify-center mb-5 relative z-10">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-lg text-white shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #0070E0, #0055b3)',
                        boxShadow: '0 8px 20px rgba(0,112,224,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                      }}
                    >
                      {step.num}
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    className="relative overflow-hidden rounded-[28px] p-8 flex flex-col gap-4 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(248,250,255,0.95) 100%)',
                      border: '1.5px solid rgba(0,112,224,0.1)',
                      boxShadow: activeIndex === i ? "0 20px 40px rgba(0,112,224,0.12)" : "0 4px 24px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Top shimmer line */}
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(0,112,224,0.07)',
                        border: '1px solid rgba(0,112,224,0.15)',
                      }}
                    >
                      <step.icon className="w-6 h-6 text-navy" strokeWidth={1.75} />
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="font-display font-black text-lg text-on-surface leading-tight tracking-tight mb-2">{step.title}</h3>
                      <p className="text-base text-muted font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Dots (Mobile Only) */}
            <div className="flex md:hidden justify-center items-center gap-3 mt-10">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveIndex(i);
                    resetTimer();
                  }}
                  className={`h-1.5 transition-all duration-500 rounded-full ${activeIndex === i ? 'w-8 bg-[#0070E0]' : 'w-4 bg-[#0070E0]/10'}`}
                />
              ))}
            </div>
          </div>
        </section>



        
        {/* ── Expert Trust Section ─────────────────────────────────── */}
        <section className="relative py-24 md:py-36 bg-slate-50 border-t border-slate-100 overflow-hidden">
          {/* Section Glow */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,112,224,0.08) 0%, transparent 70%)',
            }}
          />
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0070E0 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

          {/* ── Section Header ── */}
          <div className="max-w-6xl mx-auto px-6 mb-16 md:mb-20 text-center flex flex-col items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(0,112,224,0.06)', border: '1px solid rgba(0,112,224,0.12)' }}
            >
              <ShieldCheck className="w-3 h-3 text-[#0070E0]" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#0070E0] font-black">Trusted Diagnostic Logic</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-bold tracking-tight text-[#0F172A]"
            >
              Built with the mindset of <br className="md:hidden" />
              <span className="text-[#0070E0]">an experienced mechanic</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#64748B] text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6 leading-relaxed"
            >
              CarxAI was designed to guide drivers the way a skilled mechanic would think: understanding symptoms, checking urgency, and helping users take the right next step with confidence.
            </motion.p>

            {/* Story Trigger */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              onClick={() => setStoryOpen(true)}
              className="mt-10 group inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white font-black text-sm transition-all duration-300"
              style={{
                border: '1px solid rgba(0,112,224,0.12)',
                color: '#0E3882',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <Zap size={15} className="text-[#0070E0] shrink-0" fill="currentColor" />
              How CarxAI Was Born
              <div className="w-px h-3 bg-slate-200 mx-1 group-hover:bg-[#0070E0]/30 transition-colors" />
              <ChevronRight size={14} className="text-[#0E3882]/40 group-hover:translate-x-1 group-hover:text-[#0070E0] transition-all" />
            </motion.button>
          </div>

          {/* ── Two-Column Content ── */}
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-24 items-start">

              {/* Left Column: Trust Value Propositions */}
              <div className="flex flex-col items-start text-left">
                <div className="space-y-6 md:space-y-8">
                  {[
                    {
                      icon: Bot,
                      title: 'Symptom-first thinking',
                      desc: 'Logic-based symptom assessment, not keyword matching.',
                    },
                    {
                      icon: ShieldAlert,
                      title: 'Urgency guidance',
                      desc: 'Differentiates critical situations from minor issues.',
                    },
                    {
                      icon: CheckCircle2,
                      title: 'Clear next steps',
                      desc: 'Actionable guidance you can follow immediately.',
                    },
                  ].map((pt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-start gap-4 md:gap-5 group"
                    >
                      <div
                        className="w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-105"
                        style={{
                          background: 'rgba(0,112,224,0.06)',
                          border: '1px solid rgba(0,112,224,0.10)',
                        }}
                      >
                        <pt.icon className="w-5 h-5 md:w-5.5 md:h-5.5 text-[#0070E0]" />
                      </div>
                      <div>
                        <h4 className="text-[15px] md:text-[17px] font-black text-[#0F172A] mb-1 tracking-tight">{pt.title}</h4>
                        <p className="text-[#64748B] font-medium text-[13px] md:text-[14.5px] leading-relaxed">{pt.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Column: Expert Profile Card */}
              <div className="relative mt-4 md:mt-0">
                {/* Ambient glow behind card */}
                <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-50 pointer-events-none" style={{ background: 'rgba(0,112,224,0.10)' }} />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: 'rgba(0,91,181,0.08)' }} />

                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 24 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden"
                  style={{
                    borderRadius: '28px',
                    background: 'linear-gradient(165deg, #ffffff 0%, #f8fbff 100%)',
                    border: '1px solid rgba(0,112,224,0.10)',
                    boxShadow: '0 0 0 1px rgba(0,112,224,0.04), 0 24px 60px -16px rgba(0,80,196,0.14), 0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Top shimmer */}
                  <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,112,224,0.20), transparent)' }} />

                  <div className="p-6 md:p-8">
                    {/* Profile Header */}
                    <div className="flex flex-row items-center gap-4 md:gap-5 mb-6 pb-6" style={{ borderBottom: '1px solid rgba(0,112,224,0.08)' }}>
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-[#0070E0] rounded-full blur-[12px] opacity-20" />
                        <div
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[2.5px] border-white relative z-10 overflow-hidden"
                          style={{ boxShadow: '0 0 0 3px rgba(0,112,224,0.08), 0 6px 20px rgba(0,80,196,0.16)' }}
                        >
                          <img
                            src="/lukas_mechanic_avatar.png"
                            alt="Lukas Schneider"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-white flex items-center justify-center z-20"
                          style={{ background: 'linear-gradient(135deg, #0070E0, #005BB5)', boxShadow: '0 2px 8px rgba(0,112,224,0.3)' }}
                        >
                          <BadgeCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                        </div>
                      </div>

                      <div className="text-left flex-1 min-w-0">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.14em] mb-1.5"
                          style={{ background: 'linear-gradient(135deg, #0070E0, #005BB5)', boxShadow: '0 2px 8px rgba(0,112,224,0.2)' }}
                        >
                          Lead Expert
                        </div>
                        <h3 className="text-lg md:text-xl font-display font-black text-[#0F172A] tracking-tight leading-none mb-1">Lukas Schneider</h3>
                        <p className="text-[#0070E0] font-bold uppercase tracking-[0.12em] text-[9px] md:text-[10px]">Senior Diagnostic Specialist</p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[{ label: 'Experience', value: '14+ Years' }, { label: 'Cases', value: '5,200+' }].map(({ label, value }) => (
                        <div
                          key={label}
                          className="relative overflow-hidden p-3.5 md:p-4 rounded-2xl"
                          style={{
                            background: 'rgba(0,112,224,0.04)',
                            border: '1px solid rgba(0,112,224,0.08)',
                          }}
                        >
                          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-[#64748B] font-black mb-1">{label}</p>
                          <p className="text-lg md:text-xl font-black text-[#0E3882]">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Specialties */}
                    <div className="space-y-4 text-left">
                      <div>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-[#64748B] font-black mb-2.5">Core Specialties</p>
                        <div className="flex flex-wrap gap-2">
                          {['Electrical diagnostics', 'Engine fault analysis'].map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 rounded-xl text-[10px] md:text-[11px] font-bold whitespace-nowrap"
                              style={{
                                background: 'rgba(0,112,224,0.05)',
                                border: '1px solid rgba(0,112,224,0.12)',
                                color: '#0E3882',
                              }}
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <blockquote
                        className="pl-4 text-[12.5px] md:text-[13px] text-[#64748B] font-medium leading-relaxed italic"
                        style={{ borderLeft: '2px solid rgba(0,112,224,0.18)' }}
                      >
                        "Workshop-inspired diagnostic logic for warning lights, no-start issues, electrical faults, and breakdown symptoms."
                      </blockquote>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Badge */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="absolute -top-3 -left-3 md:-top-4 md:-left-4 z-20"
                >
                  <div
                    className="px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-2.5"
                    style={{
                      background: 'linear-gradient(135deg, #0070E0 0%, #005BB5 100%)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 24px rgba(0,112,224,0.30), 0 1px 0 rgba(255,255,255,0.12) inset',
                    }}
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-black text-[8px] md:text-[9px] leading-tight uppercase tracking-wider">Expert Verified</p>
                      <p className="text-white/50 text-[7px] md:text-[8px] font-bold uppercase tracking-wider">Expert Engine</p>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>

            {/* ── Section CTA — Anchored at bottom ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-16 md:mt-24 flex flex-col items-center text-center relative z-10"
            >
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="relative overflow-hidden rounded-2xl group"
              >
                <div
                  className="relative px-10 py-5 flex items-center justify-center gap-3 font-black text-[15px] text-white transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #0070E0 0%, #005BB5 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 20px 48px -8px rgba(0,112,224,0.40)',
                  }}
                >
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  Experience CarxAI Diagnostics
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </motion.button>
              <p className="text-[12px] text-[#64748B] font-medium mt-4 tracking-wide">Start free · No credit card required</p>
            </motion.div>
          </div>
        </section>

        {/* Features — Standardized Background */}
        <section id="features" className="relative py-20 md:py-32 px-0 overflow-hidden bg-white border-t border-slate-100">
          {/* Section Glow Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-60"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,112,224,0.08) 0%, transparent 70%)',
            }}
          />
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
                <div 
                  key={i} 
                  className="flex-shrink-0 w-[280px] p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-[#0070E0]/20 hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-[#0070E0] group-hover:text-white transition-all shadow-sm">
                    <feature.icon className="w-7 h-7 text-[#0070E0] group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Reviews — Standardized Background */}
        <section id="reviews" className="relative py-24 md:py-36 px-0 bg-slate-50 border-t border-slate-100 overflow-hidden">
          {/* Section Glow Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-60"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,112,224,0.08) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-6xl mx-auto px-6 mb-12 md:mb-16 text-center flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Trusted by Drivers</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface italic">What drivers say <br className="md:hidden" /> about Carxai</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">Real experiences from our community of supported drivers.</p>
          </div>

          <ReviewsSlider reviews={reviews} />
        </section>

        <Pricing />

        {/* Final CTA — Standardized Background */}
        <section className="relative py-24 md:py-40 px-6 text-center flex flex-col items-center bg-slate-50 border-t border-slate-100 overflow-hidden">
          {/* Section Glow Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-80"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,112,224,0.08) 0%, transparent 70%)',
            }}
          />
          <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Get Started</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-display font-bold mb-8 leading-tight tracking-tight text-on-surface">Ready for clarity and <br className="hidden md:block" /> peace of mind?</h2>
            <p className="text-muted text-xl md:text-2xl font-medium mb-14 max-w-2xl mx-auto">Get AI diagnostics, clear step-by-step guidance, and nearby provider discovery in one smart platform.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-navy text-white text-base font-black shadow-[0_20px_40px_rgba(0,112,224,0.25)] hover:translate-y-[-4px] hover:brightness-110 transition-all"
              >
                Get Started Now
              </button>
               <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-overlay bg-surface dark:bg-surface-high/40 text-on-surface font-bold hover:bg-surface-low transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Footer — Standardized Background */}
        <footer className="py-12 md:py-24 px-6 bg-white border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 md:gap-24 mb-12 md:mb-16">
              {/* Brand Col */}
              <div className="flex flex-col items-start gap-5 max-w-xs">
                <div className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center text-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    <Zap size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-display font-black text-3xl tracking-tighter text-on-surface -ml-1">
                    car<span className="text-navy">x</span>ai
                  </span>
                </div>
                <p className="text-[15px] font-medium text-muted leading-relaxed">
                  Your personal AI mechanic. Instant diagnostics, trusted network, and roadside support.
                </p>
              </div>

              {/* Links Cols */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
                <div className="flex flex-col gap-4">
                  <h4 className="text-[13px] font-black uppercase tracking-widest text-on-surface/80 mb-1">Platform</h4>
                  {[
                    { name: 'Features', id: 'features' },
                    { name: 'How It Works', id: 'how-it-works' },
                    { name: 'Pricing', id: 'pricing' }
                  ].map((item) => (
                    <a 
                      key={item.id} 
                      href={`/#${item.id}`} 
                      onClick={(e) => {
                        const el = document.getElementById(item.id);
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="text-[15px] font-medium text-muted hover:text-navy hover:translate-x-1 transition-all w-fit"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <h4 className="text-[13px] font-black uppercase tracking-widest text-on-surface/80 mb-1">Company</h4>
                  {[
                    { name: 'Reviews', id: 'reviews' },
                    { name: 'Contact', id: 'contact' },
                    { name: 'Privacy', id: 'privacy' }
                  ].map((item) => (
                    item.id === 'privacy' ? (
                      <Link 
                        key={item.id} 
                        to="/privacy" 
                        className="text-sm font-bold text-muted hover:text-navy hover:translate-x-1 transition-all w-fit"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a 
                        key={item.id} 
                        href={`/#${item.id}`} 
                        onClick={(e) => {
                          const el = document.getElementById(item.id);
                          if (el) {
                            e.preventDefault();
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="text-[15px] font-medium text-muted hover:text-navy hover:translate-x-1 transition-all w-fit"
                      >
                        {item.name}
                      </a>
                    )
                  ))}
                </div>

                <div className="flex flex-col gap-4 col-span-2 md:col-span-1 pt-6 md:pt-0 mt-4 md:mt-0">
                  <h4 className="text-[13px] font-black uppercase tracking-widest text-on-surface/80 mb-1">Social</h4>
                  <div className="flex gap-3">
                    <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white border border-overlay flex items-center justify-center text-muted hover:text-navy hover:border-navy/30 hover:shadow-lg transition-all group">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white border border-overlay flex items-center justify-center text-muted hover:text-navy hover:border-navy/30 hover:shadow-lg transition-all group">
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-6 pt-10 border-t border-overlay mb-6">
              <p className="text-muted/70 text-[11px] font-medium tracking-wide max-w-3xl">
                Carxai provides digital guidance, diagnostics, and nearby provider discovery. Repair, towing, and other offline services are handled directly by independent third-party providers.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-overlay/50">
              <p className="text-muted/80 text-[13px] font-medium tracking-wide">
                © 2026 Carxai. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link to="/privacy" className="text-[13px] font-medium text-muted hover:text-navy transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-[13px] font-medium text-muted hover:text-navy transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Premium Story Modal */}
      <StoryModal
        isOpen={storyOpen}
        onClose={() => setStoryOpen(false)}
        onCTAClick={() => navigate('/auth?mode=register')}
      />
    </div>
  )
}
