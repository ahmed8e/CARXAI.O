import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollProgress } from '../components/ui/scroll-progress-1'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Pricing from '../components/Pricing'
import ReviewsSlider from '../components/ReviewsSlider'
import { 
  Bot, 
  Users, 
  Truck, 
  CheckCircle2, 
  Zap,
  Clock,
  Check,
  X, 
  Activity, 
  Radar, 
  ShieldAlert, 
  Camera, 
  DollarSign, 
  LayoutDashboard, 
  User, 
  LogOut, 
  MessageSquare, 
  Cpu, 
  MapPin,
  ShieldCheck,
  BadgeCheck
} from 'lucide-react'


const features = [
  { icon: Activity, title: 'AI Diagnosis', desc: 'Instant breakdown analysis' },
  { icon: Zap, title: 'Warning Light Help', desc: 'Understand dashboard alerts' },
  { icon: Users, title: 'Provider Discovery', desc: 'Discover trusted local options' },
  { icon: Truck, title: 'Towing Options', desc: 'Find nearby visibility options' },
  { icon: Radar, title: 'Nearby Help Map', desc: 'Explore providers on a map' },
  { icon: ShieldAlert, title: 'Urgency Detection', desc: 'Know if it\'s an emergency' },
  { icon: Camera, title: 'Photo Analysis', desc: 'AI visual damage check' },
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
  const { user, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  const userInitial = user?.email?.[0].toUpperCase() ?? 'U'

  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (isMobile) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % steps.length)
      }, 5000)
    }
  }

  useEffect(() => {
    // If user is logged in, redirect them to their last path or dashboard
    if (!loading && user) {
      const lastPath = localStorage.getItem('carxai.last_path') || '/dashboard'
      navigate(lastPath, { replace: true })
    }
  }, [user, loading, navigate])

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

        {/* Hero Section */}
        <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-6 pt-[calc(8rem_+_env(safe-area-inset-top))] pb-32 overflow-hidden bg-white dark:bg-surface">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0070E0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="max-w-4xl mx-auto w-full relative z-10 text-center">
            {/* Hero Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border border-navy/10 bg-navy/5 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-navy animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">All-in-one car assistance</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display font-bold text-5xl md:text-8xl leading-[1.05] mb-8 text-on-surface tracking-tight"
            >
              Car trouble? <br />
              <span className="text-navy">Find clarity fast.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted text-lg md:text-2xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Get instant AI diagnosis, clear step-by-step guidance, and reliable nearby provider discovery in one smart platform.
            </motion.p>

            {/* Service Pillar Cards */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
            >
              {[
                {
                  icon: Bot,
                  title: 'AI Diagnosis',
                  desc: 'Instant digital reports from a voice or photo.',
                  tag: 'AI-Powered',
                  accent: '#0070E0',
                  halo: 'rgba(0,112,224,0.22)',
                  destination: '/dashboard/ai-mechanic',
                },
                {
                  icon: Users,
                  title: 'Clear Next Steps',
                  desc: 'Understand the issue and explore local options.',
                  tag: 'Discovery',
                  accent: '#005BB5',
                  halo: 'rgba(0,91,181,0.22)',
                  destination: '/dashboard/mechanic',
                },
                {
                  icon: Truck,
                  title: 'Towing Options',
                  desc: 'Discover nearby towing services when you need visibility.',
                  tag: 'Visibility',
                  accent: '#0070E0',
                  halo: 'rgba(0,112,224,0.22)',
                  destination: '/dashboard/towing',
                },
              ].map((sol, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  onClick={() => navigate(user ? sol.destination : '/auth')}
                  className="relative flex flex-col items-center p-6 rounded-[28px] bg-white border border-overlay shadow-sm cursor-pointer group hover:shadow-xl hover:border-navy/20 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center text-navy mb-4 group-hover:bg-navy group-hover:text-white transition-all">
                    <sol.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-black text-lg mb-1">{sol.title}</h3>
                  <p className="text-xs text-muted font-medium mb-4">{sol.desc}</p>
                  <div className="px-2.5 py-1 rounded-full bg-navy/5 text-navy text-[9px] font-black uppercase tracking-widest border border-navy/10">
                    {sol.tag}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <button 
                onClick={() => navigate('/auth?mode=register')} 
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-navy text-white text-base font-black shadow-[0_20px_40px_rgba(0,112,224,0.25)] hover:translate-y-[-4px] hover:brightness-110 transition-all"
              >
                Start 3 Days Free
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} 
                className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-overlay bg-surface dark:bg-surface-high/40 text-on-surface font-bold hover:bg-surface-low transition-all"
              >
                How it Works
              </button>
            </motion.div>

            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-x-12 mt-12 py-6 border-t border-navy/5">
              {['Diagnose with AI', 'Understand urgency', 'Discover providers'].map((point, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-navy/60" strokeWidth={3} />
                  <span className="text-[9px] font-bold text-muted uppercase tracking-[0.15em] whitespace-nowrap">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            {/* Background Glow */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-navy/[0.05] rounded-full blur-[120px] pointer-events-none" />
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="pt-12 pb-6 md:pt-20 md:pb-10 px-6 bg-[#F8FAFC] dark:bg-surface-low">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
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
                <div key={i} className="group p-6 rounded-[32px] bg-surface dark:bg-surface-high/40 border border-overlay shadow-sm hover:border-navy/20 hover:shadow-xl transition-all text-left flex flex-col items-start gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center border border-navy/20 group-hover:bg-navy group-hover:text-white transition-all duration-300">
                    <prob.icon className="w-6 h-6 text-navy group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-on-surface font-bold text-lg leading-tight mb-1">{prob.title}</div>
                    <div className="text-sm text-muted font-medium">{prob.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-navy font-black mt-12 text-sm tracking-[0.2em] uppercase opacity-80">Carxai gives you immediate clarity and helps discover nearby options.</p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="pt-12 pb-12 md:pt-20 md:pb-24 px-0 overflow-hidden bg-white dark:bg-surface">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center">
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
                  className={`h-1.5 transition-all duration-500 rounded-full ${activeIndex === i ? 'w-8 bg-navy' : 'w-4 bg-navy/10'}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Product Proof & Capabilities Section */}
        <section className="py-16 md:py-32 px-6 overflow-hidden bg-slate-50 dark:bg-surface-high/20 border-y border-overlay">
          {/* Extracted Centered Header */}
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Real world proof</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface mb-6">See how carx.ai helps in a real situation</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto">A clear example of how AI diagnosis, urgency guidance, and next-step recommendations work together.</p>
          </div>

          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
            {/* Left Col: Text & Capabilities */}
            <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
              
              {/* Trust / Capability Metrics */}
              <div className="w-full">
                <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-navy mb-6">Built for real car problems</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {[
                    { title: 'Warning lights guidance', icon: ShieldAlert },
                    { title: 'No-start issue support', icon: Zap },
                    { title: 'Smoke & overheating analysis', icon: Activity },
                    { title: 'Nearby help discovery', icon: MapPin },
                  ].map((capability, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-surface rounded-2xl border border-[#0070E0]/20 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy shrink-0 border border-navy/10">
                        <capability.icon className="w-5 h-5 text-navy" strokeWidth={2} />
                      </div>
                      <span className="text-[13px] md:text-sm font-bold text-on-surface leading-snug">{capability.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: The Realistic AI Diagnosis Example Card */}
            <div className="flex-1 w-full max-w-lg relative">
              {/* Behind glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0070E0]/20 to-[#005BB5]/20 blur-[100px] scale-90 -z-10 rounded-full" />
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-surface rounded-[32px] p-6 md:p-8 shadow-[0_24px_80px_rgba(0,112,224,0.12)] border border-overlay relative"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center border border-navy/20">
                      <Bot className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-[2px]">AI Mechanic</h4>
                      <p className="font-bold text-on-surface text-sm leading-none">Diagnosis Complete</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-[#0070E0]/10 text-[#0070E0] border border-[#0070E0]/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3" />
                    High Urgency
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="p-4 rounded-[20px] bg-surface-low border border-overlay/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Likely Issue</p>
                    <p className="font-bold text-on-surface text-lg">Excessive exhaust smoke</p>
                  </div>

                  <div className="p-4 rounded-[20px] bg-[#005BB5]/5 border border-[#005BB5]/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0070E0] mb-1">Driving Advice</p>
                    <p className="font-bold text-[#005BB5] text-[15px]">Stop safely. Not recommended to continue driving.</p>
                  </div>

                  <div className="p-4 rounded-[20px] bg-surface-low border border-overlay/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Likely Cause</p>
                    <p className="font-medium text-slate-600 text-sm">Possible oil burning or incomplete combustion.</p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-overlay/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3 text-center">Best Next Steps</p>
                    <div className="flex flex-col gap-2.5">
                       <button disabled className="w-full py-3.5 rounded-xl bg-navy text-white font-bold text-sm shadow-md shadow-navy/20 flex items-center justify-center gap-2 opacity-100 cursor-default">
                         <Truck className="w-4 h-4" /> Towing recommended
                       </button>
                       <button disabled className="w-full py-3.5 rounded-xl bg-surface border border-overlay text-on-surface font-bold text-sm flex items-center justify-center gap-2 opacity-100 cursor-default">
                         <Users className="w-4 h-4 text-muted" /> Find mechanic
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Built Like a Mechanic Thinks — Trust Section */}
        <section className="py-12 md:py-32 bg-white dark:bg-surface relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0E3882 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          {/* Centered Header */}
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md"
            >
              <ShieldCheck className="w-3 h-3 text-navy" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Trusted diagnostic logic</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface"
            >
              Built with the mindset of <br className="md:hidden" />
              <span className="text-[#0070E0]">an experienced mechanic</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6"
            >
              carx.ai was designed to guide drivers the way a skilled mechanic would think: understanding symptoms, checking urgency, and helping users take the right next step faster and with more confidence.
            </motion.p>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-center">
              
              {/* Left Column: Trust Value Propositions */}
              <div className="flex flex-col items-start text-left">

                {/* Trust Points */}
                <div className="space-y-4 md:space-y-8 mb-8 md:mb-12">
                  {[
                    { 
                      icon: Bot, 
                      title: 'Symptom-first thinking', 
                      desc: 'Logic-based symptom assessment.' 
                    },
                    { 
                      icon: ShieldAlert, 
                      title: 'Urgency guidance', 
                      desc: 'Differentiates critical vs minor issues.' 
                    },
                    { 
                      icon: CheckCircle2, 
                      title: 'Clear next steps', 
                      desc: 'Simple, actionable guidance.' 
                    }
                  ].map((pt, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-start gap-4 md:gap-5 group"
                    >
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-center shrink-0 transition-all duration-500 group-hover:bg-navy group-hover:text-white">
                        <pt.icon className="w-4 h-4 md:w-6 md:h-6 text-navy group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-[15px] md:text-lg font-black text-navy mb-0.5 tracking-tight">{pt.title}</h4>
                        <p className="text-muted font-medium text-[12px] md:text-[15px]">{pt.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button 
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/auth')}
                  className="px-10 py-5 rounded-2xl bg-navy text-white text-base font-black shadow-[0_20px_48px_-12px_rgba(0,112,224,0.35)] active:brightness-90 transition-all border border-white/10 flex items-center gap-3"
                >
                  Ask Carx AI Now
                  <Zap className="w-4 h-4 text-cyan-light" fill="currentColor" />
                </motion.button>
              </div>

              {/* Right Column: Premium Profile Card */}
              <div className="relative mt-8 md:mt-0">
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#0070E0]/10 rounded-full blur-3xl opacity-60" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#005BB5]/10 rounded-full blur-3xl opacity-40" />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative group p-5 md:p-10 rounded-[24px] md:rounded-[48px] bg-surface border border-navy/5 shadow-[0_40px_100px_-20px_rgba(0,112,224,0.12)] overflow-hidden"
                >
                  {/* Subtle Grainy Overlay */}
                   <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                  
                  {/* Profile Header */}
                  <div className="flex flex-row items-center gap-4 md:gap-8 mb-4 md:mb-8 pb-4 md:pb-8 border-b border-navy/5">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-navy to-[#005BB5] rounded-full blur-[10px] opacity-20" />
                      <div className="w-16 h-16 md:w-32 md:h-32 rounded-full border-2 md:border-4 border-surface shadow-xl relative z-10 overflow-hidden ring-1 ring-navy/5">
                        <img 
                          src="/lukas_mechanic_avatar.png" 
                          alt="Lukas Schneider" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-10 md:h-10 bg-navy rounded-full border-2 md:border-4 border-surface flex items-center justify-center shadow-lg z-20">
                        <BadgeCheck className="w-3 h-3 md:w-5 md:h-5 text-white" />
                      </div>
                    </div>
 
                    <div className="text-left flex-1">
                      <div className="inline-flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-navy text-white text-[7px] md:text-[8px] font-black uppercase tracking-widest mb-1 shadow-sm">
                        Lead Expert
                      </div>
                      <h3 className="text-xl md:text-3xl font-display font-black text-navy tracking-tight">Lukas Schneider</h3>
                      <p className="text-muted font-bold uppercase tracking-[0.1em] text-[10px] md:text-xs">Senior Diagnostic Specialist</p>
                    </div>
                  </div>

                  {/* Profile Metrics */}
                  <div className="grid grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-8">
                    <div className="p-3 md:p-5 rounded-xl md:rounded-3xl bg-navy/5 border border-navy/5">
                      <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-muted font-black mb-0.5">Experience</p>
                      <p className="text-base md:text-xl font-black text-navy">14+ Years</p>
                    </div>
                    <div className="p-3 md:p-5 rounded-xl md:rounded-3xl bg-navy/5 border border-navy/5">
                      <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-muted font-black mb-0.5">Cases</p>
                      <p className="text-base md:text-xl font-black text-navy">5,200+</p>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-4 md:space-y-6 text-left">
                    <div>
                      <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2 md:mb-4">Core Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {['Electrical diagnostics', 'Engine fault analysis'].map((spec, idx) => (
                          <span key={idx} className="px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-white border border-slate-100 text-[#0E3882] text-[10px] md:text-[12px] font-bold shadow-sm whitespace-nowrap inline-flex">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
 
                    <div>
                      <p className="text-slate-600 font-medium leading-relaxed italic text-[12px] md:text-[14px] max-w-sm">
                        "Workshop-inspired diagnostic logic for warning lights, no-start issues, electrical faults, and breakdown symptoms."
                      </p>
                    </div>
                  </div>
                </motion.div>


                {/* Floating Micro Badge */}
                <motion.div 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -top-4 -left-4 md:-top-6 md:-left-6 px-3 py-2 md:p-4 rounded-xl md:rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 border-2 border-surface z-20 flex items-center gap-2 md:gap-3"
                >
                  <div className="w-5 h-5 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-black text-[9px] md:text-[11px] leading-tight uppercase tracking-wider">Expert Verified</p>
                    <p className="text-white/60 text-[7px] md:text-[8px] font-bold uppercase tracking-wider">Expert Engine</p>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Carousel */}
        <section id="features" className="py-12 md:py-20 px-0 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center">
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
                  className="flex-shrink-0 w-[280px] p-10 rounded-[32px] bg-surface-low dark:bg-surface-high/40 border border-overlay shadow-sm hover:bg-surface hover:border-navy/20 hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface dark:bg-surface-low flex items-center justify-center mb-8 border border-overlay group-hover:bg-navy group-hover:text-white transition-all shadow-sm">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-on-surface">{feature.title}</h3>
                  <p className="text-sm text-muted font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="py-16 md:py-32 px-0 bg-[#F8FAFC] dark:bg-surface-low border-t border-overlay">
          <div className="max-w-6xl mx-auto px-6 mb-12 md:mb-16 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Trusted by Drivers</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-on-surface italic">What drivers say <br className="md:hidden" /> about Carxai</h2>
            <p className="text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">Real experiences from our community of supported drivers.</p>
          </div>

          <ReviewsSlider reviews={reviews} />
        </section>

        <Pricing />

        {/* Final CTA */}
        <section className="relative py-16 md:py-32 px-6 text-center flex flex-col items-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
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

        {/* Footer */}
        <footer className="py-12 md:py-24 px-6 bg-surface-low dark:bg-surface-low border-t border-overlay/80 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
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
    </div>
  )
}
