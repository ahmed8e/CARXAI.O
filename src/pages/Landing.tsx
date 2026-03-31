import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollProgress } from '../components/ui/scroll-progress-1'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Bot, Users, Truck, Star, CheckCircle2, X, Activity, Radar, ShieldAlert, Camera, DollarSign, Clock, LayoutDashboard, User, LogOut, Zap } from 'lucide-react'

const features = [
  { icon: Activity, title: 'AI Diagnosis', desc: 'Instant breakdown analysis' },
  { icon: Zap, title: 'Warning Light Help', desc: 'Understand dashboard alerts' },
  { icon: Users, title: 'Human Mechanic', desc: 'Connect to local experts' },
  { icon: Truck, title: 'Towing & Recovery', desc: 'Fast roadside support' },
  { icon: Radar, title: 'Nearby Help Map', desc: 'Find providers on a map' },
  { icon: ShieldAlert, title: 'Urgency Detection', desc: 'Know if it\'s urgent' },
  { icon: Camera, title: 'Photo Analysis', desc: 'AI checks visible damage' },
  { icon: CheckCircle2, title: 'Clear Guidance', desc: 'Step-by-step next steps' },
]

// ... (steps, reviews, plans remain the same)

const steps = [
  { num: '01', title: 'Describe problem', desc: 'Tell us what happened.' },
  { num: '02', title: 'Instant diagnosis', desc: 'Get AI answers fast.' },
  { num: '03', title: 'Find nearby help', desc: 'Locate local experts.' },
  { num: '04', title: 'Take next step', desc: 'Back on the road in minutes.' },
]

const reviews = [
  { name: 'Jason M.', car: 'Toyota RAV4', rating: 5, text: 'Saved me from an unnecessary garage visit.', image: '/JBJ RIV 1.jpg' },
  { name: 'Jessica W.', car: 'BMW 3 Series', rating: 5, text: 'I understood the warning light in seconds.', image: '/JBJ RIV 2.jpg' },
  { name: 'Sarah J.', car: 'VW Golf', rating: 5, text: 'Found towing in minutes.', image: '/JBJ RIV 3.jpg' },
  { name: 'Michael B.', car: 'Audi A3', rating: 5, text: 'Simple, clear, and actually useful.', image: '/JBJ RIV 4.jpg' },
  { name: 'Robert T.', car: 'Mercedes C-Class', rating: 5, text: 'I found help nearby much faster.', image: '/JBJ RIV 5.jpg' },
  { name: 'Ryan K.', car: 'Peugeot 208', rating: 5, text: 'Much clearer than a mechanic\'s explanation.', image: '/JBJ RIV 6.jpg' },
  { name: 'David S.', car: 'Ford Focus', rating: 5, text: 'Everything you need in one smart app.', image: '/JBJ RIV 7.jpg' },
  { name: 'Emily R.', car: 'Nissan Qashqai', rating: 5, text: 'The AI mechanic is surprisingly accurate.', image: '/JBJ RIV 8.jpg' },
]

const plans = [
  { 
    name: 'Basic', 
    price: '$7', 
    period: '/month',
    features: [
      'AI Mechanic chat',
      '1 active vehicle',
      'My Account access',
      'Vehicle Information'
    ],
    popular: false,
    cta: 'Get Basic'
  },
  { 
    name: 'Pro', 
    price: '$15', 
    period: '/month',
    features: [
      '3-day free trial included',
      'AI Mechanic chat & audio',
      'Take & upload photos',
      'Human Mechanic & Towing',
      '3 PDF Mechanic Reports/mo',
      '1 active vehicle'
    ],
    popular: true,
    cta: 'Start 3-Day Free Trial'
  },
  { 
    name: 'Advanced', 
    price: '$29', 
    period: '/month',
    features: [
      'Everything in Pro',
      'Unlimited PDF reports',
      'Multiple vehicles',
      'Saved report history',
      'Advanced account tools',
      'Priority support'
    ],
    popular: false,
    cta: 'Get Advanced'
  },
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

  return (
    <div className="relative min-h-screen bg-white text-slate-900 selection:bg-navy/10">
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
              className="fixed inset-0 z-40 bg-white/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 p-8"
            >
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>

              {[
                { name: 'Features', id: 'features' },
                { name: 'How it works', id: 'how-it-works' },
                { name: 'Reviews', id: 'reviews' },
                { name: 'Pricing', id: 'pricing' },
              ].map((link) => (
                <a 
                  key={link.id}
                  href={`/#${link.id}`} 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' }); 
                    setMobileMenuOpen(false);
                  }} 
                  className="text-2xl font-bold text-slate-900"
                >
                  {link.name}
                </a>
              ))}
              
              {user ? (
                <div className="flex flex-col items-center gap-4 w-full px-10">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center text-white text-4xl font-display font-bold shadow-2xl shadow-navy/20 ring-4 ring-slate-50 border border-navy/10 mb-4 relative overflow-hidden">
                    <span className="relative z-10">{userInitial}</span>
                    <div className="absolute inset-0 bg-white/10" />
                  </div>
                  <div className="text-center mb-8">
                    <p className="text-slate-900 font-bold text-xl mb-1">{user.email?.split('@')[0]}</p>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">{user.email}</p>
                  </div>
                  
                  <div className="w-full space-y-3">
                    <Link to="/dashboard" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-navy text-white font-bold shadow-xl shadow-navy/20" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-5 h-5" />
                      Go to Dashboard
                    </Link>
                    <Link to="/my-account" className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold" onClick={() => setMobileMenuOpen(false)}>
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
                  <Link to="/auth?mode=login" className="text-lg text-slate-500" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  <Link to="/auth" className="w-full py-4 rounded-2xl bg-navy text-white font-bold text-center shadow-lg shadow-navy/20" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center px-6 pt-[calc(8rem_+_env(safe-area-inset-top))] pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
            {/* Left Column: Content */}
            <div className="text-left">
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
                className="font-display font-bold text-5xl md:text-7xl leading-[1.1] mb-8 text-slate-900 tracking-tight"
              >
                Broken down? <br />
                <span className="text-navy">Get the right help fast.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 text-lg md:text-xl mb-12 max-w-xl font-medium leading-relaxed"
              >
                AI mechanic, real mechanic, and towing in one smart platform.
              </motion.p>

              {/* Service Cards (Grid in Hero) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-12"
              >
                {[
                  { icon: Bot, title: 'AI Mechanic', label: 'Instant' },
                  { icon: Users, title: 'Human Mechanic', label: 'Local' },
                  { icon: Truck, title: 'Towing', label: 'Urgent' },
                ].map((sol, i) => (
                  <div key={i} className="flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-3 p-3.5 sm:p-5 rounded-[20px] sm:rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-navy/20 hover:shadow-xl transition-all group">
                    <div className="w-11 h-11 sm:w-10 sm:h-10 shrink-0 rounded-[14px] sm:rounded-2xl bg-navy/5 flex items-center justify-center border border-navy/10 group-hover:bg-navy group-hover:text-white transition-all">
                      <sol.icon className="w-5 h-5 text-navy group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="font-bold text-sm text-slate-900 leading-tight">{sol.title}</div>
                      <div className="text-[10px] sm:text-[9px] text-slate-400 uppercase tracking-widest font-black mt-0.5 sm:mt-0">{sol.label}</div>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-5"
              >
                <button 
                  onClick={() => navigate('/register')} 
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-navy text-white text-base font-black shadow-[0_20px_40px_rgba(0,112,224,0.25)] hover:translate-y-[-4px] hover:brightness-110 transition-all"
                >
                  Get Started
                </button>
                <button 
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold hover:bg-slate-50 transition-all"
                >
                  See How It Works
                </button>
              </motion.div>

              <div className="flex flex-wrap gap-x-10 gap-y-3 mt-12">
                {['Diagnose fast', 'Find help nearby', 'Get back on the road'].map((point, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                    <CheckCircle2 className="w-4 h-4 text-navy/70" />
                    {point}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Visual Container (Ready for custom hero image) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative group lg:h-full flex items-center justify-center lg:justify-end"
            >
              <div className="relative w-full aspect-square md:aspect-video lg:aspect-[4/5] max-w-xl rounded-[40px] bg-slate-50 border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
                {/* Custom Hero Image Background */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105"
                  style={{ backgroundImage: "url('/section-bg1.jpg')" }}
                />
                
                {/* Clearer, sharper overlay that keeps the image bright but maintains legible contrast for floating cards */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/10 pointer-events-none" />
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-slate-900/5 rounded-[40px] pointer-events-none" />

                {/* Floating UI Elements (Premium Micro-Interactions) */}
                <motion.div 
                  className="absolute top-4 left-4 sm:top-8 sm:left-8 p-4 sm:p-5 rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex items-center gap-3 sm:gap-4 z-20"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm z-10">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  <div className="pr-2 sm:pr-4 relative z-10">
                    <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">AI Check</div>
                    <div className="text-sm sm:text-base font-bold text-slate-800 leading-tight">Vehicle Healthy</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 p-4 sm:p-5 rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex items-center gap-3 sm:gap-4 z-20"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1 }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-2xl bg-navy/5 flex items-center justify-center border border-navy/10 shadow-sm z-10">
                    <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-navy" />
                  </div>
                  <div className="pr-2 sm:pr-4 relative z-10">
                    <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">AI Mechanic</div>
                    <div className="text-sm sm:text-base font-bold text-slate-800 leading-tight">Towing Required</div>
                  </div>
                </motion.div>
                
                {/* Content Protection Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Background Glow */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-navy/[0.03] rounded-full blur-[120px] pointer-events-none" />
            </motion.div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="pt-12 pb-6 md:pt-20 md:pb-10 px-6">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">The Problem</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-12 tracking-tight leading-tight text-slate-900">Car trouble gets <br className="md:hidden" /> stressful fast</h2>
            <div className="grid md:grid-cols-3 gap-5 w-full">
              {[
                { title: 'Confusing warning lights', desc: 'Hard to understand fast', icon: ShieldAlert },
                { title: 'Expensive diagnostics', desc: 'Simple answers cost too much', icon: DollarSign },
                { title: 'Hard to find help', desc: 'You lose time when it matters', icon: Clock }
              ].map((prob, i) => (
                <div key={i} className="group p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:border-navy/20 hover:shadow-xl transition-all text-left flex flex-col items-start gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center border border-navy/20 group-hover:bg-navy group-hover:text-white transition-all duration-300">
                    <prob.icon className="w-6 h-6 text-navy group-hover:text-white" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold text-lg leading-tight mb-1">{prob.title}</div>
                    <div className="text-sm text-slate-500 font-medium">{prob.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-navy font-black mt-12 text-sm tracking-[0.2em] uppercase opacity-80">Carxai gives you fast answers and nearby help.</p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="pt-6 pb-12 md:pt-10 md:pb-20 px-0 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-900">Four simple steps</h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">From breakdown to backup in minutes.</p>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x scrollbar-hide px-6 md:grid md:grid-cols-4 md:max-w-6xl md:mx-auto md:px-0 md:overflow-visible">
            {steps.map((step, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[240px] md:w-auto snap-center p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm relative group hover:border-navy/20 hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Step Number Backdrop */}
                <div className="absolute -top-4 -right-2 text-7xl font-display font-black text-slate-100 group-hover:text-navy/5 transition-colors pointer-events-none">
                  {step.num}
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-navy text-sm font-black uppercase tracking-widest mb-4 opacity-60 group-hover:opacity-100 transition-opacity">Step {step.num}</div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 leading-tight tracking-tight">{step.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Carousel */}
        <section id="features" className="py-12 md:py-20 px-0 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Platform Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-900">Everything you need</h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">Smart assistance at every turn.</p>
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
              <div className="w-8 h-px bg-slate-200" />
              Swipe to explore
              <div className="w-8 h-px bg-slate-200" />
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
                  className="flex-shrink-0 w-[280px] p-10 rounded-[32px] bg-slate-50 border border-slate-100 shadow-sm hover:bg-white hover:border-navy/20 hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-8 border border-slate-200 group-hover:bg-navy group-hover:text-white transition-all shadow-sm">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="py-12 md:py-20 px-0 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-900">Trusted by drivers</h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6">Real experiences from our community.</p>
          </div>

          <div className="relative group/marquee">
            {/* Gradient Masks for edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

            <motion.div 
              className="flex gap-6 px-6"
              drag="x"
              dragConstraints={{ right: 0, left: -2400 }}
              animate={{ x: [0, -2400] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 60,
                  ease: "linear",
                }
              }}
              whileHover={{ transition: { duration: 120 } }} 
              style={{ width: "fit-content" }}
            >
              {[...reviews, ...reviews, ...reviews].map((rev, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 w-[320px] md:w-[400px] p-10 rounded-[32px] bg-white border border-slate-100 shadow-sm relative group transition-all duration-500 overflow-hidden hover:shadow-xl hover:border-navy/20"
                >
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-1.5 mb-8 text-navy">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-current filter drop-shadow-[0_0_8px_rgba(0,112,224,0.3)]" />
                      ))}
                    </div>

                    {/* Review Quote */}
                    <p className="text-xl md:text-2xl font-bold mb-10 text-slate-900 italic leading-tight flex-grow">"{rev.text}"</p>
                    
                    {/* Footer / Metadata */}
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        {/* Reviewer Avatar */}
                        <div className="relative w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden ring-4 ring-slate-50 group-hover:ring-navy/5 transition-all">
                          <img 
                            src={rev.image} 
                            alt={rev.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-base mb-0.5">{rev.name}</div>
                          <div className="text-[9px] text-navy font-black uppercase tracking-[0.2em]">{rev.car}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-navy/40">
                         <Star className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-12 md:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center flex flex-col items-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
                <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Transparent Pricing</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-slate-900">Choose your plan</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <div key={i} className={`p-10 rounded-[32px] border transition-all ${plan.popular ? 'bg-white border-navy shadow-[0_20px_40px_rgba(0,112,224,0.15)] scale-105 z-10' : 'bg-slate-50 border-slate-100 shadow-sm hover:shadow-xl'} relative group`}>
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-navy text-white text-[11px] font-black uppercase tracking-[0.2em]">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-10">
                    <div className="text-2xl font-bold mb-4 text-slate-900">{plan.name}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-display font-black tracking-tight text-slate-900">{plan.price}</span>
                      <span className="text-slate-500 text-base font-bold uppercase tracking-widest">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-5 mb-12">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-4 text-sm font-bold text-slate-600">
                        <CheckCircle2 className={`w-5 h-5 ${plan.popular ? 'text-navy' : 'text-slate-300'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => {
                      if (!user) {
                        // Not logged in: send them to register with the plan appended
                        const planParam = plan.name === 'Pro' ? 'trial' : plan.name.toLowerCase();
                        navigate(`/auth?plan=${planParam}`);
                      } else {
                        // Logged in
                        if (plan.name === 'Pro') {
                          // Already testing/trialing: send to dashboard
                          navigate('/dashboard');
                        } else {
                          // Upgrade flows
                          navigate(`/my-account?upgrade=${plan.name.toLowerCase()}`);
                        }
                      }
                    }}
                    className={`w-full py-5 rounded-2xl font-black transition-all text-base ${plan.popular ? 'bg-navy text-white shadow-[0_20px_40px_rgba(0,112,224,0.25)] hover:-translate-y-1' : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'}`}
                  >
                    {plan.cta || 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-400 text-xs font-black uppercase tracking-widest mt-16">No credit card required for the 3-day free trial. Cancel anytime.</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-20 md:py-32 px-6 text-center flex flex-col items-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-navy/10 bg-navy/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Get Started</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-display font-bold mb-8 leading-tight tracking-tight text-slate-900">Ready to hit the road <br className="hidden md:block" /> with confidence?</h2>
            <p className="text-slate-600 text-xl md:text-2xl font-medium mb-14 max-w-2xl mx-auto">Get AI diagnosis, real mechanic help, and towing support in one smart place.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-navy text-white text-base font-black shadow-[0_20px_40px_rgba(0,112,224,0.25)] hover:translate-y-[-4px] hover:brightness-110 transition-all"
              >
                Get Started Now
              </button>
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold hover:bg-slate-50 transition-all"
              >
                View Plans
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 px-6 bg-slate-50 border-t border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16 md:gap-24 mb-16">
              {/* Brand Col */}
              <div className="flex flex-col items-start gap-6 max-w-sm">
                <div className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-navy/30 transition-all">
                    <Zap className="w-6 h-6 text-navy" />
                  </div>
                  <span className="font-display font-bold text-2xl tracking-tighter text-slate-900">
                    Carxai
                  </span>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Your all-in-one digital mechanic. Instant AI diagnosis, local expert connection, and fast roadside support.
                </p>
              </div>

              {/* Links Cols */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-10">
                <div className="flex flex-col gap-5">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-2">Platform</h4>
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
                      className="text-sm font-bold text-slate-500 hover:text-navy hover:translate-x-1 transition-all w-fit"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>

                <div className="flex flex-col gap-5">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-2">Company</h4>
                  {[
                    { name: 'Reviews', id: 'reviews' },
                    { name: 'Contact', id: 'contact' },
                    { name: 'Privacy', id: 'privacy' }
                  ].map((item) => (
                    item.id === 'privacy' ? (
                      <Link 
                        key={item.id} 
                        to="/privacy" 
                        className="text-sm font-bold text-slate-500 hover:text-navy hover:translate-x-1 transition-all w-fit"
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
                        className="text-sm font-bold text-slate-500 hover:text-navy hover:translate-x-1 transition-all w-fit"
                      >
                        {item.name}
                      </a>
                    )
                  ))}
                </div>

                <div className="flex flex-col gap-5 col-span-2 md:col-span-1 border-t border-slate-200 pt-8 md:border-0 md:pt-0">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-2">Stay Updated</h4>
                  <p className="text-sm font-medium text-slate-500 mb-4">Follow our journey and get the latest automotive AI news.</p>
                  <div className="flex gap-3">
                    <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-navy hover:border-navy/30 hover:shadow-md transition-all">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-navy hover:border-navy/30 hover:shadow-md transition-all">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-200">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                © 2026 Carxai. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link to="/privacy" className="text-xs font-bold text-slate-400 hover:text-navy transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-xs font-bold text-slate-400 hover:text-navy transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
