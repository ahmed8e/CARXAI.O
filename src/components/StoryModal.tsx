import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Zap, Wrench, ShieldCheck } from 'lucide-react';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCTAClick?: () => void;
}

const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, onCTAClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            key="story-modal"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.9 }}
            className="fixed inset-x-4 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[201] w-auto md:w-full md:max-w-xl"
          >
            <div className="relative w-full bg-white rounded-t-[32px] md:rounded-[32px] shadow-[0_40px_100px_rgba(0,112,224,0.18)] overflow-hidden max-h-[90vh] md:max-h-[82vh] flex flex-col">

              {/* Top shimmer line */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#0070E0]/30 to-transparent" />

              {/* Header */}
              <div className="flex items-start justify-between px-7 pt-7 pb-4 shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0070E0] flex items-center justify-center shadow-md shadow-[#0070E0]/30">
                    <Zap size={18} fill="white" className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0070E0] mb-0.5">The Idea Behind CarxAI</p>
                    <h3 className="text-lg font-display font-bold text-slate-900 leading-tight tracking-tight">How CarxAI began</h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors group shrink-0 mt-0.5"
                  aria-label="Close"
                >
                  <X size={16} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
                </button>
              </div>

              {/* Scrollable Story Content */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-7 py-6 scroll-smooth"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Decorative accent line */}
                <div className="w-12 h-1 bg-gradient-to-r from-[#0070E0] to-[#005BB5] rounded-full mb-6" />

                <div className="prose prose-slate max-w-none space-y-5 text-[15px] leading-[1.75] text-slate-600 font-medium">
                  <p>
                    CarxAI did not begin with code.
                    <br />
                    It began with a feeling I saw too often in real life — that moment when a driver knows something is wrong,
                    but has no clear idea what the car is trying to say.
                  </p>

                  <div className="pl-4 border-l-2 border-[#0070E0]/30 space-y-1.5 text-slate-500 text-[14px] italic">
                    <p>A warning light comes on.</p>
                    <p>The engine sounds different.</p>
                    <p>The car loses power.</p>
                    <p>And before any repair even starts, stress takes over.</p>
                  </div>

                  <p>
                    As a mechanic, I saw that moment again and again.
                    Not just the fault itself — but the uncertainty around it.
                    People were trying to decide whether to keep driving, whether to stop,
                    whether it was serious, or whether they were about to make it worse.
                  </p>

                  <div className="bg-[#F0F7FF] rounded-2xl px-5 py-4 border border-[#0070E0]/12">
                    <p className="font-bold text-slate-800 text-[15px] leading-relaxed m-0">
                      That moment matters more than most people realize.
                    </p>
                  </div>

                  <p>
                    Because when a car changes, the first thing a driver needs is not noise.
                    Not vague advice. Not ten different opinions.
                    They need clarity. They need logic.
                    They need someone to narrow the problem down the right way.
                  </p>

                  <p className="font-semibold text-slate-700">That is where CarxAI came from.</p>

                  <p>
                    The idea was never to build another generic AI tool.
                    It was to take the way a real mechanic thinks — symptom by symptom, risk by risk, step by step —
                    and turn that into guidance people could access the moment they needed it.
                  </p>

                  <div className="pl-4 border-l-2 border-[#0070E0]/30 space-y-1.5 text-slate-500 text-[14px]">
                    <p>Something calmer.</p>
                    <p>Something more useful.</p>
                    <p>Something built around the real questions drivers ask when the situation feels uncertain.</p>
                  </div>

                  <p>
                    CarxAI was shaped from real patterns, repeated problems, and the kind of practical reasoning
                    that only becomes valuable when trust is on the line.
                    It was built to help people understand what may be happening, how urgent it might be,
                    and what the safest next step should be.
                  </p>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-3 my-6">
                    {[
                      { icon: Wrench, label: 'Real mechanic reasoning', },
                      { icon: ShieldCheck, label: 'Urgency-first guidance', },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-[#0070E0]/10 flex items-center justify-center shrink-0">
                          <Icon size={14} className="text-[#0070E0]" />
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 leading-snug">{label}</span>
                      </div>
                    ))}
                  </div>

                  <p>
                    Because when a car problem begins, trust is not earned by sounding intelligent.
                    It is earned by helping someone feel more clear, more grounded, and less alone in the decision they have to make next.
                  </p>

                  <p className="font-semibold text-slate-700 text-[15px]">
                    That is what CarxAI was built to do.
                  </p>
                </div>
              </div>

              {/* CTA Footer */}
              <div className="px-7 py-5 border-t border-slate-100 shrink-0 bg-white">
                <button
                  onClick={() => { onClose(); onCTAClick?.(); }}
                  className="w-full py-4 rounded-2xl bg-[#0070E0] text-white font-black text-[15px] flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(0,112,224,0.25)] hover:brightness-110 hover:-translate-y-0.5 transition-all group"
                >
                  See how CarxAI thinks
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StoryModal;
