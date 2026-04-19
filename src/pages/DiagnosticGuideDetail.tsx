import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Wrench,
  ArrowRight
} from 'lucide-react';
import GuideLayout from '../components/GuideLayout';
import { guides } from '../data/guides';
import { motion } from 'framer-motion';

const DiagnosticGuideDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const guide = useMemo(() => {
    return guides.find(g => g.slug === slug);
  }, [slug]);

  if (!guide) {
    return <Navigate to="/guides" replace />;
  }

  // Safety Color Logic
  const safetyColor = guide.canDrive === 'No' ? 'text-red-600' : guide.canDrive === 'Caution' ? 'text-orange-500' : 'text-emerald-500';
  const safetyBg = guide.canDrive === 'No' ? 'bg-red-50' : guide.canDrive === 'Caution' ? 'bg-orange-50' : 'bg-emerald-50';
  const safetyBorder = guide.canDrive === 'No' ? 'border-red-100' : guide.canDrive === 'Caution' ? 'border-orange-100' : 'border-emerald-100';
  const safetyIcon = guide.canDrive === 'No' ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />;

  return (
    <GuideLayout 
      title={guide.title} 
      metaTitle={guide.metaTitle}
      description={guide.metaDescription}
    >
      <article className="max-w-5xl mx-auto">
        
        {/* HERO SECTION */}
        <header className="pt-8 pb-16 md:pb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-black text-navy mb-8 tracking-tight"
          >
            {guide.title}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-12 items-start"
          >
            <div className="flex-1">
              <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-medium mb-10">
                {guide.shortAnswer}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/auth" className="px-8 py-4 rounded-xl bg-navy text-white font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                  Complete Diagnosis <ArrowRight size={16} />
                </Link>
                <div className={`px-6 py-4 rounded-xl ${safetyBg} ${safetyBorder} border flex items-center gap-3`}>
                  <span className={safetyColor}>{safetyIcon}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Can you drive?</span>
                    <span className={`text-sm font-black ${safetyColor}`}>{guide.quickSummary?.canYouDrive || guide.canDrive}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-72 shrink-0 p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Safety Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-navy">Brake Hydraulics</span>
                </div>
                <div className={`flex items-start gap-3 ${guide.canDrive === 'No' ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-5 h-5 rounded-full ${guide.canDrive === 'No' ? 'bg-red-500' : 'bg-slate-200'} flex-shrink-0 mt-0.5`} />
                  <span className="text-sm font-bold text-navy leading-tight">Stopping Distance Impacted</span>
                </div>
                <p className="text-[11px] text-slate-400 italic mt-4 pt-4 border-t border-slate-200">
                  Diagnosis based on mechanical symptom reports.
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* CONTENT SECTIONS */}
        <div className="space-y-24 md:space-y-32">
          
          {guide.sections.map((section, idx) => (
            <motion.section 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <div className="mb-10">
                <h2 className="text-2xl md:text-3xl font-display font-black text-navy mb-6 tracking-tight">
                  {section.title}
                </h2>
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl">
                  {section.content}
                </p>
              </div>

              {section.image && (
                <div className="mb-12">
                  <img 
                    src={section.image} 
                    alt={section.imageAlt || section.title}
                    className="w-full h-auto rounded-3xl border border-slate-100 shadow-sm"
                  />
                  {section.imageAlt && (
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Realistic view: {section.imageAlt}
                    </p>
                  )}
                </div>
              )}

              {section.subsections && (
                <div className={`grid ${idx === 3 ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                  {section.subsections.map((sub, sidx) => (
                    <div key={sidx} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/20 transition-all group">
                      <h3 className="text-lg font-black text-navy mb-4 flex items-center justify-between">
                        {sub.title}
                        {sub.severity && (
                          <span className={`text-[9px] px-2 py-1 rounded-full uppercase tracking-tighter ${
                            sub.severity === 'High' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                            {sub.severity} Risk
                          </span>
                        )}
                      </h3>
                      <p className="text-[15px] text-slate-500 leading-relaxed mb-6">
                        {sub.content}
                      </p>
                      {(sub.clue || sub.safeToDrive) && (
                        <div className="pt-5 border-t border-slate-50 space-y-2">
                          {sub.clue && (
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0070E0]">
                              <CheckCircle2 size={12} /> {sub.clue}
                            </div>
                          )}
                          {sub.safeToDrive && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                              <ShieldCheck size={12} /> {sub.safeToDrive}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          ))}

          {/* REPAIR COSTS SECTION */}
          {guide.repairCosts && (
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="py-16 px-8 rounded-3xl bg-slate-50 border border-slate-100"
            >
              <h2 className="text-2xl md:text-3xl font-display font-black text-navy mb-4 tracking-tight">
                {guide.repairCosts.title || 'Typical Repair Cost Ranges'}
              </h2>
              <p className="text-slate-500 mb-10 font-medium">
                {guide.repairCosts.disclaimer}
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { range: guide.repairCosts.low, desc: guide.repairCosts.lowDesc, type: 'Maintenance' },
                  { range: guide.repairCosts.medium, desc: guide.repairCosts.mediumDesc, type: 'Standard Repair' },
                  { range: guide.repairCosts.high, desc: guide.repairCosts.highDesc, type: 'Major Overhaul' }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] uppercase tracking-widest font-black text-[#0070E0] mb-2 block">{item.type}</span>
                    <div className="text-2xl font-black text-navy mb-2">{item.range}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* FINAL TRUST SECTION */}
          <section className="py-24 border-t border-slate-100 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-8">
                <Wrench className="text-navy w-8 h-8 opacity-40" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-navy mb-6">
                Not sure if this matches your car?
              </h2>
              <p className="text-lg text-slate-500 font-medium mb-12">
                Brake symptoms can be subtle. Get a professional-level analysis focused on your specific vehicle and driving conditions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth" className="px-10 py-5 rounded-2xl bg-[#0070E0] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all">
                  Start AI Assessment
                </Link>
                <Link to="/guides" className="px-10 py-5 rounded-2xl border-2 border-slate-100 text-navy font-black text-sm uppercase tracking-widest hover:border-navy transition-all">
                  View More Guides
                </Link>
              </div>
            </div>
          </section>

        </div>
      </article>

      {/* FOOTER TRUST SIGNALS */}
      <div className="max-w-5xl mx-auto pt-16 border-t border-slate-100 flex flex-wrap gap-x-12 gap-y-6 items-center justify-center opacity-40">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <ShieldCheck size={14} /> ASE Technician Verified Logic
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <CheckCircle2 size={14} /> Real-World Road Symptom Data
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0070E0]">
          CarxAI Diagnostic Engine
        </div>
      </div>
    </GuideLayout>
  );
};

export default DiagnosticGuideDetail;
