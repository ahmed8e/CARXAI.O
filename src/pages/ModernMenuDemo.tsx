import { InteractiveMenu } from "@/components/ui/modern-mobile-menu";
import type { InteractiveMenuItem } from "@/components/ui/modern-mobile-menu";
import { 
  LayoutDashboard, 
  Wrench, 
  ShieldCheck, 
  Sparkles,
  Activity
} from 'lucide-react';

const lucideDemoMenuItems: InteractiveMenuItem[] = [
    { label: 'Home', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Diagnostics', icon: Sparkles, to: '/dashboard/ai-mechanic' },
    { label: 'Maintenance', icon: Wrench, to: '/dashboard/maintenance' },
    { label: 'Overpaying', icon: ShieldCheck, to: '/dashboard/avoid-overpaying' },
    { label: 'Reports', icon: Activity, to: '/dashboard/reports' },
];

const customAccentColor = 'var(--color-chart-2)';

const ModernMenuDemo = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col gap-12 pb-32">
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Default Menu</h2>
        <div className="relative h-20 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <InteractiveMenu />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Customized Menu</h2>
        <div className="relative h-20 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <InteractiveMenu items={lucideDemoMenuItems} accentColor={customAccentColor} />
        </div>
      </section>

      <div className="mt-auto p-6 bg-blue-50 rounded-3xl border border-blue-100">
        <p className="text-xs font-bold text-blue-900 leading-relaxed">
          This menu features interactive line-width detection, bounce animations, and a glassmorphism dock style.
          It's perfect for mobile-first SaaS applications.
        </p>
      </div>
    </div>
  );
};

export default ModernMenuDemo;
