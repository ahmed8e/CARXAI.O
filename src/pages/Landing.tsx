import { Link, useNavigate } from 'react-router-dom'
import { Zap, Bot, Users, Truck, Star, CheckCircle2, Menu, X, Activity, Radar, ShieldAlert, Camera, DollarSign, Clock } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollProgress } from '../components/ui/scroll-progress-1'

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
  { name: 'Karim B.', car: 'Toyota RAV4', rating: 5, text: 'Saved me from an unnecessary garage visit.', image: '/review-suv.png' },
  { name: 'Sophie L.', car: 'BMW 3 Series', rating: 5, text: 'I understood the warning light in seconds.', image: '/review-sedan.png' },
  { name: 'Ahmed R.', car: 'VW Golf', rating: 5, text: 'Found towing in minutes.', image: '/review-suv.png' },
  { name: 'Marie D.', car: 'Audi A3', rating: 5, text: 'Simple, clear, and actually useful.', image: '/review-sedan.png' },
  { name: 'Thomas P.', car: 'Mercedes C-Class', rating: 5, text: 'I found help nearby much faster.', image: '/review-suv.png' },
  { name: 'Luc S.', car: 'Peugeot 208', rating: 5, text: 'Much clearer than a mechanic\'s explanation.', image: '/review-sedan.png' },
]

const plans = [
  { 
    name: 'Basic', 
    price: '$0', 
    period: '/month',
    features: ['AI Mechanic Chat', 'Nearby Help Map', 'Basic Diagnostics'],
    popular: false 
  },
  { 
    name: 'Pro', 
    price: '$12', 
    period: '/month',
    features: ['AI Mechanic Chat', 'Human Mechanic finder', 'Towing access', 'Upload photo', 'Urgency detection'],
    popular: true 
  },
  { 
    name: 'Premium', 
    price: '$19', 
    period: '/month',
    features: ['All Pro features', 'Priority AI responses', 'Live phone support', 'Vehicle health report'],
    popular: false 
  },
]

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-[#062B3D] text-white selection:bg-cyan/30">
      {/* Global Fixed Background Container */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('/section-bg.jpg')",
            backgroundAttachment: 'scroll' // attachment: fixed is often buggy on mobile; using fixed parent instead
          }}
        />
        {/* Dark Premium Blue Overlay / Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#062B3D]/95 via-[#062B3D]/80 to-[#062B3D]/95 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
      </div>

      <div className="relative z-10">
        <ScrollProgress variant="carx" size="sm" showPercentage={false} />
        
        {/* Navbar */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-5xl flex items-center justify-between px-6 py-3 bg-[#062B3D]/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-navy border border-cyan/10">
              <Zap className="w-4.5 h-4.5 text-[#5DB0EE]" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">car<span className="text-[#5DB0EE]">x</span>.ai</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-white/70 hover:text-[#5DB0EE] transition-colors font-bold uppercase tracking-wider">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-[#5DB0EE] transition-colors font-bold uppercase tracking-wider">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-white/70 hover:text-[#5DB0EE] transition-colors font-bold uppercase tracking-wider">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/register" className="px-5 py-2 rounded-full bg-[#CDFF00] text-navy text-sm font-black shadow-[0_0_20px_rgba(205,255,0,0.2)]">Get Started</Link>
          </div>

          <button className="md:hidden text-white/70" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-[#062B3D]/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 p-8"
            onClick={() => setMobileMenuOpen(false)}
          >
            <a href="#features" className="text-2xl font-bold">Features</a>
            <a href="#how-it-works" className="text-2xl font-bold">How it works</a>
            <a href="#pricing" className="text-2xl font-bold">Pricing</a>
            <Link to="/login" className="text-lg opacity-60">Sign In</Link>
            <Link to="/register" className="px-10 py-4 rounded-2xl bg-[#CDFF00] text-navy font-bold">Get Started</Link>
          </div>
        )}

        {/* Hero */}
        <section className="relative min-h-[90vh] flex flex-col justify-center px-6 pt-32 pb-12">
          <div className="max-w-4xl mx-auto w-full text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 border border-white/10 bg-white/5 backdrop-blur-sm">
              <span className="text-[10px] uppercase tracking-widest text-[#CDFF00] font-bold">All-in-one car assistance</span>
            </div>

            <h1 className="font-display font-bold text-4xl md:text-7xl leading-tight mb-6">
              Broken down? <br />
              Get the right help fast.
            </h1>

            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              AI mechanic, real mechanic, and towing in one smart platform.
            </p>
    
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
              {[
                { icon: Bot, title: 'AI Mechanic', label: 'Fast diagnosis' },
                { icon: Users, title: 'Human Mechanic', label: 'Nearby help' },
                { icon: Truck, title: 'Towing', label: 'Urgent roadside support' },
              ].map((sol, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#CDFF00]/10 flex items-center justify-center border border-[#CDFF00]/20">
                    <sol.icon className="w-6 h-6 text-[#CDFF00]" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-white">{sol.title}</div>
                    <div className="text-[10px] text-white/60 uppercase tracking-widest font-black">{sol.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button 
                onClick={() => navigate('/register')} 
                className="w-full sm:w-auto px-12 py-5 rounded-2xl text-navy text-base font-black shadow-[0_0_30px_rgba(205,255,0,0.3)] bg-[#CDFF00]"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
              </motion.button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-12 py-5 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md text-white font-bold hover:bg-white/10 transition-all"
              >
                See How It Works
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 mt-12">
              {['Diagnose fast', 'Find help nearby', 'Get back on the road'].map((point, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[10px] font-black text-white/50 tracking-widest uppercase">
                  <CheckCircle2 className="w-4 h-4 text-[#CDFF00]/70" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="pt-12 pb-6 md:pt-20 md:pb-10 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-6xl font-display font-bold mb-12 italic tracking-tight leading-tight">Car trouble gets <br className="md:hidden" /> stressful fast</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { title: 'Confusing warning lights', desc: 'Hard to understand fast', icon: ShieldAlert },
                { title: 'Expensive diagnostics', desc: 'Simple answers cost too much', icon: DollarSign },
                { title: 'Hard to find help', desc: 'You lose time when it matters', icon: Clock }
              ].map((prob, i) => (
                <div key={i} className="group p-6 rounded-[32px] bg-white/5 backdrop-blur-md border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex flex-col items-start gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#CDFF00]/10 flex items-center justify-center border border-[#CDFF00]/20 group-hover:bg-[#CDFF00] group-hover:text-navy transition-all duration-300">
                    <prob.icon className="w-6 h-6 text-[#CDFF00] group-hover:text-navy" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg leading-tight mb-1">{prob.title}</div>
                    <div className="text-sm text-white/60 font-medium">{prob.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[#5DB0EE] font-black mt-12 text-sm tracking-[0.2em] uppercase opacity-80">carx.ai gives you fast answers and nearby help.</p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="pt-6 pb-12 md:pt-10 md:pb-20 px-0 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-12 text-center">
            <h2 className="text-3xl md:text-5xl font-display font-bold italic">Four simple steps</h2>
            <p className="text-white/60 mt-3 text-lg font-medium">From breakdown to backup in minutes.</p>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x scrollbar-hide px-6 md:grid md:grid-cols-4 md:max-w-6xl md:mx-auto md:px-0 md:overflow-visible">
            {steps.map((step, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[240px] md:w-auto snap-center p-8 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/5 relative group hover:border-[#CDFF00]/30 transition-all overflow-hidden"
              >
                {/* Step Number Backdrop */}
                <div className="absolute -top-4 -right-2 text-7xl font-display font-black text-white/[0.03] group-hover:text-[#CDFF00]/10 transition-colors pointer-events-none">
                  {step.num}
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-[#CDFF00] text-sm font-black uppercase tracking-widest mb-4 opacity-60 group-hover:opacity-100 transition-opacity">Step {step.num}</div>
                  <h3 className="text-xl font-display font-extrabold mb-2 text-white italic leading-tight">{step.title}</h3>
                  <p className="text-sm text-white/60 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Carousel */}
        <section id="features" className="py-12 md:py-20 px-0 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center">
            <h2 className="text-3xl md:text-6xl font-display font-bold mb-4">Everything you need</h2>
            <p className="text-white/60 text-lg font-medium">Smart assistance at every turn.</p>
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              <div className="w-8 h-px bg-white/20" />
              Swipe to explore
              <div className="w-8 h-px bg-white/20" />
            </div>
          </div>

          <div className="relative">
            {/* Gradient Mask for Fade Effect */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#062B3D] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#062B3D] to-transparent z-10 pointer-events-none" />

            <motion.div 
              className="flex gap-6 px-6 md:px-0"
              animate={{
                x: [0, -2400], // Adjust based on card width (280) + gap (24) * 8 = 2432 approx
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
              {/* Render features multiple times for seamless loop */}
              {[...features, ...features, ...features].map((feature, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 w-[280px] p-10 rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-[#CDFF00] group-hover:text-navy transition-all">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/60 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="py-12 md:py-20 px-0 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-16 text-center">
            <h2 className="text-3xl md:text-6xl font-display font-bold">Trusted by drivers</h2>
            <p className="text-white/60 mt-4 text-lg font-medium">Real experiences from our community.</p>
          </div>

          <div className="relative group/marquee">
            {/* Gradient Masks for edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#062B3D] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#062B3D] to-transparent z-20 pointer-events-none" />

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
              whileHover={{ transition: { duration: 120 } }} // Slows down on hover
              style={{ width: "fit-content" }}
            >
              {[...reviews, ...reviews, ...reviews].map((rev, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 w-[320px] md:w-[400px] p-10 rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/10 relative group transition-all duration-500 overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-1.5 mb-8 text-[#CDFF00]">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-current filter drop-shadow-[0_0_8px_rgba(205,255,0,0.5)]" />
                      ))}
                    </div>

                    {/* Review Quote */}
                    <p className="text-xl md:text-2xl font-bold mb-10 text-white italic leading-tight flex-grow">"{rev.text}"</p>
                    
                    {/* Footer / Metadata */}
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                      <div>
                        <div className="font-bold text-white text-lg mb-0.5">{rev.name}</div>
                        <div className="text-[10px] text-[#5DB0EE] font-black uppercase tracking-[0.2em]">{rev.car}</div>
                      </div>
                      
                      {/* Car "Avatar" Photo */}
                      <div className="relative w-16 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-[#CDFF00]/30 transition-all overflow-hidden p-1">
                        <img 
                          src={rev.image} 
                          alt={rev.car} 
                          className="w-full h-full object-contain filter brightness-125"
                        />
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
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-6xl font-display font-bold">Choose your plan</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <div key={i} className={`p-10 rounded-[40px] border transition-all ${plan.popular ? 'bg-white/10 border-[#CDFF00]/50 shadow-2xl scale-105 z-10' : 'bg-white/5 border-white/10'} relative group`}>
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-[#CDFF00] text-navy text-[11px] font-black uppercase tracking-[0.2em]">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-10">
                    <div className="text-2xl font-bold mb-4">{plan.name}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-display font-black tracking-tight">{plan.price}</span>
                      <span className="opacity-60 text-base font-bold uppercase tracking-widest">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-5 mb-12">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-4 text-sm font-bold opacity-70">
                        <CheckCircle2 className={`w-5 h-5 ${plan.popular ? 'text-[#CDFF00]' : 'text-white/40'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-5 rounded-2xl font-black transition-all text-base ${plan.popular ? 'bg-[#CDFF00] text-navy shadow-[0_10px_30px_rgba(205,255,0,0.3)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {plan.name === 'Basic' ? 'Start Free' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-white/50 text-xs font-black uppercase tracking-widest mt-16">All plans include a 3-day free trial. Cancel anytime.</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-20 md:py-32 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-display font-bold mb-8 leading-tight">Ready to hit the road <br className="hidden md:block" /> with confidence?</h2>
            <p className="text-white/80 text-xl md:text-2xl mb-14 max-w-2xl mx-auto">Get AI diagnosis, real mechanic help, and towing support in one smart place.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <motion.button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-14 py-6 rounded-2xl text-navy text-lg font-black bg-[#CDFF00] shadow-[0_20px_40px_rgba(205,255,0,0.25)]"
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Now
              </motion.button>
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-14 py-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md text-white font-bold hover:bg-white/10 transition-all"
              >
                View Plans
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#5DB0EE]" />
                </div>
                <span className="font-display font-bold text-2xl tracking-tighter">car<span className="text-[#5DB0EE]">x</span>.ai</span>
              </div>
              <div className="flex flex-wrap justify-center gap-10">
                {['Features', 'Reviews', 'Pricing', 'Blog', 'Contact', 'Privacy'].map((item) => (
                  <a key={item} href="#" className="text-sm font-black uppercase tracking-[0.2em] text-white/70 hover:text-[#5DB0EE] transition-all">{item}</a>
                ))}
              </div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">© 2026 carx.ai</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
