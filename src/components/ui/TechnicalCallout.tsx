import React from 'react';
import { Info, AlertCircle, Zap } from 'lucide-react';

interface TechnicalCalloutProps {
  type?: 'tip' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
}

const TechnicalCallout: React.FC<TechnicalCalloutProps> = ({ 
  type = 'info', 
  title, 
  children 
}) => {
  const configs = {
    tip: {
      icon: <Zap className="w-4 h-4" />,
      bg: 'bg-slate-50',
      border: 'border-navy',
      titleColor: 'text-navy',
      label: 'Pro Tip'
    },
    warning: {
      icon: <AlertCircle className="w-4 h-4" />,
      bg: 'bg-red-50/30',
      border: 'border-red-500',
      titleColor: 'text-red-600',
      label: 'Security & Safety'
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      bg: 'bg-slate-50',
      border: 'border-slate-300',
      titleColor: 'text-slate-900',
      label: 'Technical Info'
    }
  };

  const config = configs[type];

  return (
    <div className={`my-10 p-6 md:p-8 ${config.bg} border-l-[6px] ${config.border} rounded-r-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`${config.titleColor}`}>
          {config.icon}
        </div>
        <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${config.titleColor}`}>
          {title || config.label}
        </span>
      </div>
      <div className="text-slate-600 font-medium leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default TechnicalCallout;
