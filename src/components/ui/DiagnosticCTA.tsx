import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiagnosticCTAProps {
  title?: string;
  description?: string;
}

const DiagnosticCTA: React.FC<DiagnosticCTAProps> = ({ 
  title = "Not sure which cause fits your situation?", 
  description = "Let Car Safety narrow it down for you. Our AI analyzes your specific symptoms and photos to give you a personalized diagnosis in minutes."
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="p-8 md:p-12 rounded-[32px] bg-navy relative overflow-hidden group shadow-2xl shadow-navy/20"
    >
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-navy-dark/40 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] uppercase tracking-[0.2em] font-black mb-6">
            <Bot className="w-3.5 h-3.5" />
            Product Innovation
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 leading-tight">
            {title}
          </h2>
          <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full md:w-auto">
          <Link 
            to="/auth" 
            className="px-8 py-5 rounded-2xl bg-white text-navy font-black text-base flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 transition-all active:scale-95 group/btn"
          >
            <Zap className="w-5 h-5 fill-navy" />
            Diagnose This Symptom
            <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
          <p className="text-white/40 text-[10px] text-center font-bold uppercase tracking-widest">
            Free initial scan available
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DiagnosticCTA;
