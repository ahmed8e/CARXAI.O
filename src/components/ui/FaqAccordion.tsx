import React, { useState } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy border border-navy/10">
          <MessageCircleQuestion className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-display font-bold text-on-surface">Frequently Asked Questions</h2>
      </div>

      {faqs.map((faq, index) => (
        <div 
          key={index}
          className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:border-navy/10 transition-colors"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-5 flex items-center justify-between text-left group"
          >
            <span className="text-base font-bold text-slate-800 pr-8 group-hover:text-navy transition-colors">
              {faq.question}
            </span>
            <ChevronDown 
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-navy' : ''}`} 
            />
          </button>
          
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="px-6 pb-6 text-slate-500 font-medium leading-relaxed bg-slate-50/30">
                  <div className="h-px w-full bg-slate-100 mb-5" />
                  {faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default FaqAccordion;
