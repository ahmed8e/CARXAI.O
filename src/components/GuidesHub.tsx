import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Activity, ShieldAlert, Zap, AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react'

export interface GuidesHubProps {
  // Add any props if needed in the future
}

export default function GuidesHub() {
  const symptoms = [
    { title: 'Car shakes when braking', icon: Activity, slug: 'symptoms/car-shakes-when-braking', desc: 'Is it warped rotors or something else? Learn the signs.' },
    { title: 'Why does my car smell like gas?', icon: ShieldAlert, slug: 'symptoms/car-smells-like-gas', desc: 'A critical safety check for fuel leaks and more.' },
    { title: 'Car won\'t crank', icon: Zap, slug: 'starting-battery/car-wont-crank', desc: 'Nothing happens when you turn the key? Start here.' },
    { title: 'ABS light is on', icon: AlertTriangle, slug: 'warning-lights/abs-light-in-car', desc: 'Understanding anti-lock system failure and safety.' },
    { title: 'Oil light on dashboard', icon: ShieldAlert, slug: 'warning-lights/oil-light-in-car', desc: 'Why you should stop driving immediately.' },
    { title: 'Car won\'t start but lights work', icon: Zap, slug: 'starting-battery/wont-start-but-lights-come-on', desc: 'Differentiating battery issues from starter failure.' }
  ];

  return (
    <section id="guides" className="relative py-24 md:py-36 px-6 bg-[#F8FAFC]/50 backdrop-blur-sm border-t border-slate-100 overflow-hidden">
      {/* Background Decorative Sparkle */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-navy/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 bg-navy/5 border border-navy/10"
            >
              <Activity className="w-3.5 h-3.5 text-navy" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy font-black">Symptom Library</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-[#0F172A] mb-6 text-balance">
              Common problems we help <span className="text-navy">diagnose.</span>
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
              Browse our high-trust guides for common symptoms and warning lights. Learn what they mean, how urgent they are, and how CarxAI can help.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/guides" 
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-navy font-bold text-sm hover:border-navy/30 hover:bg-navy/5 transition-all shadow-sm"
            >
              View All Guides
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {symptoms.map((symptom, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link 
                to={`/guides/${symptom.slug}`}
                className="group block p-8 rounded-[32px] bg-white border border-slate-50 shadow-ambient hover:shadow-card hover:border-navy/10 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center text-navy mb-6 group-hover:bg-navy group-hover:text-white transition-all duration-500">
                  <symptom.icon size={22} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-800 mb-3 leading-tight group-hover:text-navy transition-colors">
                  {symptom.title}
                </h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                  {symptom.desc}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-navy opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                  Read Guide <ChevronRight size={12} />
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">
            Our library is updated daily with certified diagnostic logic
          </p>
        </div>
      </div>
    </section>
  );
}
