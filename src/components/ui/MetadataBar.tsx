import React from 'react';
import { ShieldCheck, Calendar, Clock } from 'lucide-react';

interface MetadataBarProps {
  date?: string;
  readTime?: string;
}

const MetadataBar: React.FC<MetadataBarProps> = ({ 
  date = "October 24, 2024", 
  readTime = "8 min read" 
}) => {
  return (
    <div className="flex flex-wrap items-center gap-6 py-6 border-y border-slate-100 mb-12">
      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100/50">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[11px] font-black uppercase tracking-wider">Expert Verified</span>
      </div>
      
      <div className="flex items-center gap-2 text-slate-400">
        <Calendar className="w-4 h-4 text-slate-300" />
        <span className="text-xs font-bold uppercase tracking-widest">{date}</span>
      </div>

      <div className="w-1 h-1 rounded-full bg-slate-200 hidden md:block" />

      <div className="flex items-center gap-2 text-slate-400">
        <Clock className="w-4 h-4 text-slate-300" />
        <span className="text-xs font-bold uppercase tracking-widest">{readTime}</span>
      </div>
    </div>
  );
};

export default MetadataBar;
