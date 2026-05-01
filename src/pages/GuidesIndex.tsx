import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ChevronRight, 
  Activity, 
  ShieldAlert, 
  Zap, 
  AlertTriangle, 
  Thermometer, 
  LayoutDashboard,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GuideLayout from '../components/GuideLayout';
import { guides, GUIDE_CATEGORIES } from '../data/guides';
import DiagnosticCTA from '../components/ui/DiagnosticCTA';

const IconMap = {
  Activity,
  ShieldAlert,
  Zap,
  AlertTriangle,
  Thermometer,
  LayoutDashboard
};

const GuidesIndex: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const matchesSearch = guide.title.toLowerCase().includes(search.toLowerCase()) || 
                           guide.metaDescription.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory ? guide.category === activeCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const popularGuides = guides.slice(0, 3);

  return (
    <GuideLayout title="Diagnostic Guides" metaTitle="Automotive Diagnostic Guides & Problem Library | Carsafety">
      <div className="flex flex-col gap-16 md:gap-24">
        
        {/* Hero Section */}
        <section className="text-center md:text-left max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 text-navy text-[10px] uppercase tracking-[0.2em] font-black mb-6 border border-navy/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Product Library
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold text-on-surface mb-6 leading-[1.05] tracking-tight"
          >
            Knowledge for <br />
            <span className="text-navy">Smarter Car Ownership.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-12"
          >
            Explore our library of common car symptoms, warning lights, and starting problems. Each guide is designed to help you understand urgency and take the right next step.
          </motion.p>
          
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-2xl group"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-navy transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search for a symptom or warning light (e.g. 'shakes', 'ABS')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-[28px] py-6 pl-14 pr-6 text-base font-medium shadow-card focus:border-navy/40 focus:ring-[6px] focus:ring-navy/5 transition-all outline-none"
            />
          </motion.div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-on-surface">Categories</h2>
            {activeCategory && (
              <button 
                onClick={() => setActiveCategory(null)}
                className="text-xs font-black uppercase tracking-widest text-navy hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {GUIDE_CATEGORIES.map((cat) => {
              const Icon = (IconMap as any)[cat.icon];
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  className={`flex items-center gap-2.5 px-6 py-4 rounded-2xl border transition-all shrink-0 font-bold text-sm ${
                    isActive 
                      ? 'bg-navy border-navy text-white shadow-xl shadow-navy/20' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-navy/20 hover:bg-navy/5'
                  }`}
                >
                  <Icon size={16} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Popular Section (Only visible if no active filter) */}
        {!activeCategory && !search && (
          <section>
            <h2 className="text-2xl font-display font-bold text-on-surface mb-8">Popular Diagnoses</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {popularGuides.map((guide) => (
                <Link 
                  key={guide.id} 
                  to={`/guides/${guide.category}/${guide.slug}`}
                  className="group flex flex-col p-4 rounded-[32px] bg-white border border-slate-50 shadow-ambient hover:shadow-card hover:border-navy/10 hover:-translate-y-1.5 transition-all duration-300"
                >
                  {guide.cardImage && (
                    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[24px] mb-6">
                      <img 
                        src={guide.cardImage} 
                        alt={guide.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="px-4 pb-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        guide.severity === 'High' ? 'bg-red-50 text-red-600' : 
                        guide.severity === 'Medium' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {guide.severity} Severity
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-navy group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-on-surface mb-4 leading-tight group-hover:text-navy transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted font-medium leading-relaxed mb-8 flex-1">
                      {guide.shortAnswer}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-navy pt-6 border-t border-slate-50">
                      View Guide
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Results Grid */}
        <section>
          {(activeCategory || search) && (
            <h2 className="text-2xl font-display font-bold text-on-surface mb-8">
              {filteredGuides.length} Results {activeCategory && `for ${GUIDE_CATEGORIES.find(c => c.id === activeCategory)?.name}`}
            </h2>
          )}
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredGuides.map((guide) => (
                <motion.div
                  key={guide.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Link 
                    to={`/guides/${guide.category}/${guide.slug}`}
                    className="flex flex-col p-3 rounded-[24px] bg-white border border-slate-50 shadow-ambient hover:shadow-lg hover:border-navy/10 transition-all group h-full"
                  >
                    {guide.cardImage && (
                      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[18px] mb-4">
                        <img 
                          src={guide.cardImage} 
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="px-3 pb-3 flex flex-col h-full">
                      <h4 className="text-lg font-display font-bold text-slate-800 mb-3 leading-tight group-hover:text-navy transition-colors">
                        {guide.title}
                      </h4>
                      <p className="text-xs text-muted font-medium leading-relaxed mb-6 line-clamp-3">
                        {guide.shortAnswer}
                      </p>
                      <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-navy pt-4 border-t border-slate-50">
                        Learn More
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredGuides.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-muted font-medium mb-4">No guides found matching your search.</div>
              <button 
                onClick={() => { setSearch(''); setActiveCategory(null); }}
                className="text-navy font-black text-sm uppercase tracking-widest hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </section>

        <section>
          <DiagnosticCTA 
            title="Can't find your specific problem?"
            description="Our diagnosis library is growing, but our AI is already an expert in thousands of issues. For a personalized check, try a direct AI diagnostic session."
          />
        </section>
      </div>
    </GuideLayout>
  );
};

export default GuidesIndex;
