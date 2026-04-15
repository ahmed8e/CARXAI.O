import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Zap, Wrench, ShieldCheck, Heart } from 'lucide-react';
import { useStoryReactions, type ReactionType } from '../hooks/useStoryReactions';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCTAClick?: () => void;
}

const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, onCTAClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { counts, userReaction, submitReaction, totalEngaged } = useStoryReactions('carxai-origin');

  const reactions: { type: ReactionType; label: string; icon: any }[] = [
    { type: 'relate', label: 'I relate', icon: Heart },
    { type: 'powerful', label: 'Powerful', icon: Zap },
    { type: 'respect', label: 'Respect', icon: ShieldCheck },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="story-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-[#0E3882]/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            key="story-modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 1 }}
            className="fixed inset-x-4 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[201] w-auto md:w-full md:max-w-lg"
          >
            <div
              className="relative w-full rounded-t-[36px] md:rounded-[32px] overflow-hidden max-h-[92vh] md:max-h-[86vh] flex flex-col"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                boxShadow: '0 0 0 1px rgba(0,112,224,0.08), 0 32px 80px -12px rgba(14,56,130,0.22), 0 8px 20px rgba(0,0,0,0.06)',
              }}
            >
              {/* Ambient top glow line */}
              <div
                className="absolute top-0 inset-x-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(0,112,224,0.4) 40%, rgba(0,112,224,0.4) 60%, transparent 95%)' }}
              />

              {/* Header */}
              <div className="px-7 pt-7 pb-5 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #0070E0 0%, #0050C4 100%)',
                        boxShadow: '0 8px 20px rgba(0,112,224,0.3), 0 1px 0 rgba(255,255,255,0.15) inset',
                      }}
                    >
                      <Zap size={18} fill="white" className="text-white" />
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-black uppercase tracking-[0.22em] mb-0.5"
                        style={{ color: '#0070E0' }}
                      >
                        The Origin Story
                      </p>
                      <h3
                        className="text-[18px] font-display font-black leading-tight tracking-tight"
                        style={{ color: '#0E1628' }}
                      >
                        How CarxAI Was Born
                      </h3>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 mt-0.5 group"
                    style={{ background: 'rgba(14,56,130,0.05)', border: '1px solid rgba(14,56,130,0.08)' }}
                    aria-label="Close"
                  >
                    <X size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </button>
                </div>

                {/* Separator */}
                <div className="mt-5 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,112,224,0.12) 0%, rgba(0,112,224,0.04) 100%)' }} />
              </div>

              {/* Scrollable Content */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-7 pb-6 scroll-smooth"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Opening — Editorial typography */}
                <div className="space-y-4 text-[14.5px] leading-[1.8] text-slate-500 font-medium">
                  <p style={{ color: '#374151' }}>
                    CarxAI did not begin with code.
                  </p>
                  <p>
                    It began with a feeling I saw too often in real life — that moment when a driver knows something is wrong,
                    but has no clear idea what the car is trying to say.
                  </p>
                </div>

                {/* Italic Pull Quote */}
                <div
                  className="my-6 px-5 py-4 rounded-2xl space-y-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,112,224,0.04) 0%, rgba(0,80,196,0.06) 100%)',
                    border: '1px solid rgba(0,112,224,0.10)',
                  }}
                >
                  {[
                    'A warning light comes on.',
                    'The engine sounds different.',
                    'The car loses power.',
                    'And before any repair even starts — stress takes over.',
                  ].map((line, i) => (
                    <p
                      key={i}
                      className="text-[13.5px] italic leading-relaxed"
                      style={{ color: i === 3 ? '#0E3882' : '#64748b', fontWeight: i === 3 ? 600 : 500 }}
                    >
                      {line}
                    </p>
                  ))}
                </div>

                <div className="space-y-4 text-[14.5px] leading-[1.8] text-slate-500 font-medium">
                  <p>
                    As a mechanic, I saw that moment again and again. Not just the fault itself — but the uncertainty around it.
                    People were trying to decide whether to keep driving, whether it was serious, or whether they were about to make it worse.
                  </p>
                </div>

                {/* Emphasis Block */}
                <div
                  className="my-6 px-6 py-5 rounded-2xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f2ff 100%)',
                    border: '1px solid rgba(0,112,224,0.14)',
                  }}
                >
                  <div
                    className="absolute top-0 left-6 right-6 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(0,112,224,0.25), transparent)' }}
                  />
                  <p
                    className="text-[15px] font-bold leading-relaxed"
                    style={{ color: '#0E3882' }}
                  >
                    That moment matters more than most people realise.
                  </p>
                  <p
                    className="mt-1.5 text-[13.5px] leading-relaxed font-medium"
                    style={{ color: '#4B6EA8' }}
                  >
                    When a car changes, the first thing a driver needs is not noise — they need clarity.
                  </p>
                </div>

                <div className="space-y-4 text-[14.5px] leading-[1.8] text-slate-500 font-medium">
                  <p>
                    The idea was never to build another generic AI tool. It was to take the way a real mechanic thinks —
                    symptom by symptom, risk by risk, step by step — and turn that into guidance people could access the moment they needed it.
                  </p>
                </div>

                {/* Pillars */}
                <div
                  className="my-4 py-3 space-y-2"
                  style={{ borderLeft: '2px solid rgba(0,112,224,0.2)', paddingLeft: '16px' }}
                >
                  {[
                    'Something calmer.',
                    'Something more useful.',
                    'Something built around the real questions drivers ask.',
                  ].map((line, i) => (
                    <p
                      key={i}
                      className="text-[13.5px] italic leading-relaxed font-medium"
                      style={{ color: '#64748b' }}
                    >
                      {line}
                    </p>
                  ))}
                </div>

                <div className="space-y-4 text-[14.5px] leading-[1.8] text-slate-500 font-medium">
                  <p>
                    CarxAI was shaped from real patterns, repeated problems, and the kind of practical reasoning
                    that only becomes valuable when trust is on the line.
                  </p>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-3 my-6">
                  {[
                    { icon: Wrench, label: 'Real mechanic reasoning', desc: 'Trained on real diagnostic patterns' },
                    { icon: ShieldCheck, label: 'Urgency-first guidance', desc: 'Prioritises your safety above all' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="flex flex-col gap-2 px-3.5 py-3.5 rounded-2xl"
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(0,112,224,0.10)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(0,112,224,0.08)' }}
                      >
                        <Icon size={14} className="text-[#0070E0]" />
                      </div>
                      <div>
                        <p className="text-[11.5px] font-black text-slate-700 leading-snug mb-0.5">{label}</p>
                        <p className="text-[10.5px] font-medium text-slate-400 leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Closing */}
                <div className="space-y-4 text-[14.5px] leading-[1.8] text-slate-500 font-medium">
                  <p>
                    Because when a car problem begins, trust is not earned by sounding intelligent.
                    It is earned by helping someone feel more clear, more grounded, and less alone in the decision they have to make next.
                  </p>
                  <p style={{ color: '#1e3a5f', fontWeight: 700 }}>
                    That is what CarxAI was built to do.
                  </p>
                </div>

                {/* Reactions Section */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      How does this resonate?
                    </p>
                    {totalEngaged > 0 && (
                      <span className="text-[10px] font-bold text-[#0E3882]/60 bg-[#0E3882]/5 px-2 py-0.5 rounded-full">
                        {totalEngaged.toLocaleString()} {totalEngaged === 1 ? 'reaction' : 'reactions'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {reactions.map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => submitReaction(type)}
                        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl text-[12px] font-bold transition-all duration-300 ${
                          userReaction === type
                            ? 'bg-[#0E3882] text-white shadow-lg shadow-blue-900/20 scale-[0.98]'
                            : 'bg-white border border-slate-100 text-slate-600 hover:border-[#0E3882]/20 hover:bg-slate-50'
                        }`}
                      >
                        <Icon 
                          size={14} 
                          className={userReaction === type ? 'text-white' : 'text-[#0070E0]'} 
                          fill={userReaction === type ? 'currentColor' : 'none'}
                        />
                        {label}
                        {counts[type] > 0 && (
                          <span className={`ml-auto text-[10px] font-black ${userReaction === type ? 'text-white/60' : 'text-slate-300'}`}>
                            {counts[type]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Footer */}
              <div
                className="px-7 py-5 shrink-0 relative"
                style={{ borderTop: '1px solid rgba(0,112,224,0.07)', background: 'linear-gradient(180deg, rgba(248,251,255,0) 0%, rgba(240,247,255,0.5) 100%)' }}
              >
                {/* Top fade */}
                <div className="absolute -top-6 inset-x-0 h-6 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, rgba(248,251,255,0.95))' }} />

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onClose(); onCTAClick?.(); }}
                  className="w-full py-4 rounded-2xl text-white font-black text-[15px] flex items-center justify-center gap-2.5 relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #0E3882 0%, #0050C4 60%, #0070E0 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 16px 40px -8px rgba(14,56,130,0.5)',
                  }}
                >
                  {/* Shimmer line */}
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  See how CarxAI thinks
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform shrink-0" />
                </motion.button>

                <p className="text-center text-[11px] text-slate-400 font-medium mt-3 tracking-wide">
                  Start free · No credit card required
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StoryModal;
