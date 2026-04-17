import React from 'react';
import { DollarSign, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface RepairCostBoxProps {
  costs: {
    low: string;
    medium: string;
    high: string;
  };
}

const RepairCostBox: React.FC<RepairCostBoxProps> = ({ costs }) => {
  const tiers = [
    { label: 'Minor / DIY', value: costs.low, desc: costs.lowDesc || 'Typical parts + labor', color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
    { label: 'Standard Repair', value: costs.medium, desc: costs.mediumDesc || 'Typical parts + labor', color: 'text-navy', bg: 'bg-navy/5' },
    { label: 'Complex / Critical', value: costs.high, desc: costs.highDesc || 'Typical parts + labor', color: 'text-orange-500', bg: 'bg-orange-50/50' },
  ];

  return (
    <div className="my-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy border border-navy/10">
          <DollarSign size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-on-surface">Estimated Repair Costs</h2>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Industry Averages</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-[24px] border border-slate-100 ${tier.bg} backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block">
              {tier.label}
            </span>
            <div className={`text-xl font-black ${tier.color} mb-2`}>
              {tier.value}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 opacity-80 group-hover:opacity-100 transition-opacity leading-tight">
              {tier.desc} <ArrowRight size={10} className="shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
      
      <p className="mt-6 text-[11px] font-medium text-slate-400 text-center italic">
        *Actual costs vary by vehicle make, model, and regional labor rates.
      </p>
    </div>
  );
};

export default RepairCostBox;
