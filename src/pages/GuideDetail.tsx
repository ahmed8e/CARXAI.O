import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  Clock,
  Tag,
  Wrench,
  Search,
  AlertTriangle,
} from 'lucide-react';
import GuideLayout from '../components/GuideLayout';
import { guides } from '../data/guides';
import FaqAccordion from '../components/ui/FaqAccordion';
import RepairCostBox from '../components/ui/RepairCostBox';

const GuideDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const guide = useMemo(() => {
    return guides.find(g => g.slug === slug);
  }, [slug]);

  if (!guide) {
    return <Navigate to="/guides" replace />;
  }

  const relatedGuides = guides
    .filter(g => g.category === guide.category && g.slug !== guide.slug)
    .slice(0, 5);

  return (
    <GuideLayout 
      title={guide.title} 
      metaTitle={guide.metaTitle}
      description={guide.metaDescription}
    >
      <div className="mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 xl:gap-24">
          
          {/* Main Content Area: Properly scaled for wide screens */}
          <article className="flex-1 min-w-0">
            
            {/* Header / Intro */}
            <header className="mb-16">
              <div className="flex items-center gap-8 mb-10 text-[12px] font-black uppercase tracking-[0.25em] text-slate-400">
                <div className="inline-flex items-center gap-2.5 text-[#0070E0]">
                  <Tag className="w-4 h-4" />
                  {guide.categoryDisplay || guide.category}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-40" /> {guide.lastUpdated || 'Recently'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 opacity-40" /> {guide.readingTime || '5 min'}
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl xl:text-8xl font-display font-black text-navy mb-12 leading-[1.05] tracking-tight max-w-5xl">
                {guide.title}
              </h1>

              <p className="text-xl md:text-3xl text-slate-500 leading-relaxed font-medium mb-12 max-w-4xl">
                {guide.shortAnswer}
              </p>

              {/* Quick Summary / Takeaways (Elegant wide layout) */}
              {guide.keyTakeaways && (
                <div className="py-12 border-t border-b border-slate-100 mb-16">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0070E0] mb-8 flex items-center gap-2">
                    <Search className="w-4 h-4" /> Comprehensive Summary
                  </h2>
                  <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
                    {guide.keyTakeaways.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 text-[16px] font-bold text-navy leading-snug">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Verdict (Immersive Hero-Style Callout) */}
              {guide.quickSummary && (
                <div className="p-10 md:p-14 rounded-[40px] bg-slate-50 border border-slate-100 flex flex-col xl:flex-row gap-12 items-center mb-20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <ShieldCheck size={280} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-3 text-red-600 text-[11px] font-black uppercase tracking-[0.3em] mb-6">
                      <AlertTriangle className="w-5 h-5" /> Driving Safety Verdict
                    </div>
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-baseline gap-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Safety Verdict:</span>
                        <span className="text-2xl md:text-3xl font-black text-navy">{guide.quickSummary.canYouDrive}</span>
                      </div>
                      <p className="text-lg md:text-xl font-bold text-slate-500 leading-relaxed max-w-2xl">
                        <span className="text-red-500">Critical Note:</span> {guide.quickSummary.stopIf}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 shrink-0 w-full xl:w-auto relative z-10">
                    <Link to="/auth" className="px-12 py-5 rounded-2xl bg-navy text-white font-black text-[12px] uppercase tracking-widest hover:bg-slate-800 hover:-translate-y-1 transition-all text-center shadow-xl shadow-navy/10">
                      Full Diagnostic Analysis
                    </Link>
                  </div>
                </div>
              )}
            </header>

            {/* Main Article Body */}
            <div className="space-y-16">
              {guide.sections.map((section, idx) => {
                // Only render visuals for specific sections to reduce clutter
                const showImage = idx === 0 || idx === 1 || idx === 2 || idx === 4;
                
                return (
                  <section key={idx} className="scroll-mt-32">
                    <h2 className="text-2xl md:text-3xl font-display font-black text-navy mb-6 tracking-tight">
                      {section.title}
                    </h2>
                    
                    <div className="prose prose-slate max-w-none mb-8">
                      <p className="text-17px md:text-[18px] text-slate-600 leading-relaxed">
                        {section.content}
                      </p>
                    </div>

                    {showImage && section.image && (
                      <div className="my-10">
                        <img 
                          src={section.image} 
                          alt={section.imageAlt || section.title}
                          className="w-full h-auto rounded-2xl border border-slate-100"
                        />
                        {section.imageAlt && (
                          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                            Fig. {idx + 1}: {section.imageAlt}
                          </p>
                        )}
                      </div>
                    )}

                    {section.subsections && (
                      <div className="space-y-10 mt-10 pl-6 border-l-2 border-slate-50">
                        {section.subsections.map((sub, sidx) => (
                          <div key={sidx} className="relative">
                            <h3 className="text-lg font-black text-navy mb-3 flex items-center gap-3">
                              {sub.title}
                              {sub.severity && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest ${
                                  sub.severity === 'High' ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50'
                                }`}>
                                  {sub.severity} Risk
                                </span>
                              )}
                            </h3>
                            <p className="text-[16px] text-slate-500 leading-relaxed mb-4">
                              {sub.content}
                            </p>
                            {(sub.clue || sub.safeToDrive) && (
                              <div className="flex flex-wrap gap-4 text-[12px] font-bold italic text-slate-400">
                                {sub.clue && <span>Key Clue: {sub.clue}</span>}
                                {sub.safeToDrive && <span className="text-navy opacity-60">Driveability: {sub.safeToDrive}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}

              {/* Cost Section (Integrated) */}
              {guide.repairCosts && (
                <section className="pt-12 border-t border-slate-100">
                  <h2 className="text-3xl font-display font-black text-navy mb-8">Typical Repair Cost Ranges</h2>
                  <div className="max-w-3xl">
                    <RepairCostBox costs={guide.repairCosts} />
                  </div>
                  <div className="mt-8 flex items-start gap-3 text-[14px] text-slate-400 italic leading-relaxed">
                    <Wrench className="w-5 h-5 shrink-0 mt-0.5 opacity-40" />
                    <p>
                      Costs vary by vehicle, brake design, labor rates, and whether the problem is limited to pads and rotors or involves calipers, ABS components, or front-end parts.
                    </p>
                  </div>
                </section>
              )}

              {/* FAQ Section */}
              <section className="pt-12 border-t border-slate-100 scroll-mt-20" id="faqs">
                <div className="mb-12">
                  <h2 className="text-3xl font-display font-black text-navy mb-4">Frequently Asked Questions</h2>
                  <p className="text-lg text-slate-500 font-medium">Clear answers to real questions about {guide.title.toLowerCase()}.</p>
                </div>
                <div className="max-w-4xl">
                  <FaqAccordion faqs={guide.faqs} />
                </div>
              </section>

              {/* Simple Final CTA - Integrated and Elegant */}
              <section className="py-24 border-t border-slate-100 mt-24 text-center">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-display font-black text-navy mb-8 leading-tight">
                    Stop Guessing. Get a Professional-Level Diagnosis in Seconds.
                  </h2>
                  <p className="text-xl text-slate-500 font-medium mb-12 leading-relaxed">
                    Not sure if it's the rotors or something else? Let Carsafety's tech-informed logic identify the exact failure point on your {guide.categoryDisplay?.toLowerCase() || 'vehicle'}.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-5 justify-center">
                    <Link to="/auth" className="px-12 py-5 rounded-2xl bg-[#0070E0] text-white font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:-translate-y-1 transition-all">
                      Start Full AI Diagnosis
                    </Link>
                    <Link to="/auth" className="px-12 py-5 rounded-2xl border-2 border-slate-200 text-navy font-black text-[13px] uppercase tracking-widest hover:border-navy transition-all">
                      Check Safety Rating
                    </Link>
                  </div>
                  <div className="mt-12 flex items-center justify-center gap-2.5 text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">
                    <ShieldCheck className="w-4 h-4" /> 98.4% Diagnostic Precision
                  </div>
                </div>
              </section>

            </div>
          </article>

          {/* Sidebar - Minimalist and Clean (Wider for 1440px) */}
          <aside className="lg:w-[380px] shrink-0">
            <div className="sticky top-40 space-y-16">
              
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8 font-display">Deep Resource Library</h3>
                <nav className="flex flex-col gap-6">
                  {relatedGuides.map((rg, idx) => (
                    <Link 
                      key={idx} 
                      to={`/guides/${rg.category}/${rg.slug}`}
                      className="group flex items-start gap-4"
                    >
                      <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-[#0070E0] transition-colors mt-2 shrink-0" />
                      <span className="text-[15px] font-bold text-navy group-hover:text-[#0070E0] transition-colors leading-snug">
                        {rg.title}
                      </span>
                    </Link>
                  ))}
                </nav>
                <Link to="/guides" className="mt-10 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0070E0] hover:underline">
                  Browse All 40+ Guides <ChevronRight size={10} />
                </Link>
              </div>

              {/* Trust Signal - Subtle but Premium */}
              <div className="py-10 border-t border-slate-100">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-200 mb-6">Expert Accuracy</p>
                <div className="space-y-6">
                  <div>
                    <p className="text-4xl font-black text-navy leading-none mb-2">98.4%</p>
                    <p className="text-[13px] font-bold text-slate-400 leading-relaxed">Diagnostic precision for identified {guide.categoryDisplay?.toLowerCase() || 'brake'} issues</p>
                  </div>
                  <Link to="/auth" className="inline-block text-[11px] font-black text-[#0070E0] uppercase tracking-widest border-b-2 border-blue-50 hover:border-[#0070E0] transition-all">
                    Try AI Diagnosis Now
                  </Link>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </GuideLayout>
  );
};

export default GuideDetail;
