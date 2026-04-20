import React from 'react';
import { Shield, Mail, Award } from 'lucide-react';

const AuthorBox: React.FC = () => {
  return (
    <div className="mt-20 p-8 md:p-12 rounded-lg bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
      <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-md overflow-hidden shrink-0">
        <div className="w-full h-full bg-navy flex items-center justify-center text-white">
          <Shield className="w-10 h-10 opacity-50" />
        </div>
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
          <h4 className="text-xl font-black text-slate-900 tracking-tight">Technical Engineering Team</h4>
          <span className="px-2 py-0.5 rounded bg-navy text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-3 h-3" />
            Verified Team
          </span>
        </div>
        
        <p className="text-slate-500 leading-relaxed mb-6 font-medium">
          Our technical team consists of ASE-certified master technicians and automotive engineers. We verify every diagnostic path to ensure mechanical accuracy and safety compliance for car owners.
        </p>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
          <div className="flex items-center gap-2 text-navy hover:text-navy-dark transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 group-hover:border-navy transition-colors">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Contact Expertise</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorBox;
