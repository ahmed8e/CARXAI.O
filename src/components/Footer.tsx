import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  FileText,
  LifeBuoy
} from 'lucide-react';
import { BrandLockup } from './ui/Brand';

interface FooterProps {
  onStoryClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onStoryClick }) => {
  const currentYear = new Date().getFullYear();

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-slate-50/40 backdrop-blur-xl pt-24 pb-12 overflow-hidden">
      {/* Background patterns: Sync with Carsafety dot grid language */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]" 
        style={{
          backgroundImage: 'radial-gradient(circle, #0070E0 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
      
      {/* Subtle depth glow at the bottom */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(0,112,224,0.15) 0%, transparent 70%)'
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          
          {/* Brand Column */}
          <div className="flex flex-col items-start gap-6">
            <Link to="/" className="group transition-transform duration-300 hover:scale-[1.02]">
              <BrandLockup size="xl" />
            </Link>
            <p className="text-slate-500 text-[15px] leading-relaxed max-w-xs font-medium">
              Your personal AI mechanic for clear diagnostics, nearby help, and smarter next steps. Empowering drivers with clarity since 2024.
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100/50">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0070E0]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0070E0]">Verified Secure Diagnostics</span>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.15em] mb-8 text-slate-900">Platform</h4>
            <ul className="space-y-4">
              {[
                { name: 'Features', id: 'features' },
                { name: 'How It Works', id: 'problem' },
                { name: 'Pricing', id: 'pricing' },
                { name: 'Success Stories', id: 'reviews' }
              ].map((item) => (
                <li key={item.name}>
                  <button 
                    onClick={() => handleScroll(item.id)}
                    className="text-slate-500 hover:text-[#0070E0] text-[15px] font-medium transition-all duration-300 flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0070E0] mr-0 w-0 opacity-0 group-hover:w-2 group-hover:mr-2 group-hover:opacity-100 transition-all duration-300"></span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.15em] mb-8 text-slate-900">Resources</h4>
            <ul className="space-y-4">
              <li>
                <button 
                  onClick={onStoryClick}
                  className="text-slate-500 hover:text-[#0070E0] text-[15px] font-medium transition-all duration-300 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0070E0] mr-0 w-0 opacity-0 group-hover:w-2 group-hover:mr-2 group-hover:opacity-100 transition-all duration-300"></span>
                  How Carsafety Began
                </button>
              </li>
              {[
                { name: 'Documentation', icon: FileText, href: '#' },
                { name: 'Technical Support', icon: LifeBuoy, href: 'https://wa.me/447907357259' }
              ].map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-slate-500 hover:text-[#0070E0] text-[15px] font-medium transition-all duration-300 flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0070E0] mr-0 w-0 opacity-0 group-hover:w-2 group-hover:mr-2 group-hover:opacity-100 transition-all duration-300"></span>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.15em] mb-8 text-slate-900">Contact</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0070E0]/5 group-hover:text-[#0070E0] group-hover:border-[#0070E0]/10 transition-all duration-300">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Headquarters</span>
                  <p className="text-slate-600 text-[14px] font-medium leading-relaxed">
                    124 City Road, London<br />
                    EC1V 2NX, United Kingdom
                  </p>
                </div>
              </li>
              <li>
                <a href="mailto:support@carx.ai" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0070E0]/5 group-hover:text-[#0070E0] group-hover:border-[#0070E0]/10 transition-all duration-300">
                    <Mail size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Email Us</span>
                    <span className="text-slate-600 text-[14px] font-medium group-hover:text-slate-900 transition-colors">support@carx.ai</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="tel:+442079460123" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0070E0]/5 group-hover:text-[#0070E0] group-hover:border-[#0070E0]/10 transition-all duration-300">
                    <Phone size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Phone</span>
                    <span className="text-slate-600 text-[14px] font-medium group-hover:text-slate-900 transition-colors">+44 20 7946 0123</span>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-10 border-t border-slate-100">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center lg:items-start gap-2">
              <p className="text-slate-400 text-[13px] font-medium">
                © {currentYear} Carsafety. Built for clarity and peace of mind.
              </p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black lg:max-w-xl text-center lg:text-left leading-relaxed">
                Carsafety provides digital diagnostics and guidance. Repairs and towing are handled by independent third-party providers.
              </p>
            </div>
            
            <div className="flex items-center gap-8">
              <Link to="/privacy" className="text-slate-400 hover:text-[#0070E0] text-[13px] font-bold transition-colors">Privacy</Link>
              <Link to="/terms" className="text-slate-400 hover:text-[#0070E0] text-[13px] font-bold transition-colors">Terms</Link>
              <div className="h-4 w-px bg-slate-100" />
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 text-slate-400 hover:text-[#0070E0] text-[13px] font-bold transition-colors group"
              >
                Back to Top
                <ChevronRight className="w-3.5 h-3.5 -rotate-90 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
