import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import Navbar from './Navbar';
import CarxGradientBg from './ui/CarxGradientBg';

interface GuideLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  metaTitle?: string;
  variant?: 'default' | 'technical';
}

const GuideLayout: React.FC<GuideLayoutProps> = ({ 
  children, 
  title, 
  metaTitle,
  description,
  variant = 'default'
}) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Update document title for SEO
    if (metaTitle) {
      document.title = metaTitle;
    } else if (title) {
      document.title = `${title} | Carsafety Diagnostic Hub`;
    }

    // Update meta description and favicon for SEO
    if (description) {
      const metaDescriptionTag = document.querySelector('meta[name="description"]');
      if (metaDescriptionTag) {
        metaDescriptionTag.setAttribute('content', description);
      } else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'description';
        newMeta.content = description;
        document.head.appendChild(newMeta);
      }
    }

    // Set favicon
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'shortcut icon';
    link.href = '/favicon.svg';
    document.getElementsByTagName('head')[0].appendChild(link);
    
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [title, metaTitle, description, pathname]);

  // Extract category and slug from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  const isDetail = pathParts.length > 1;

  return (
    <div className={`relative min-h-screen ${variant === 'technical' ? 'bg-white' : 'bg-white'} text-on-surface`}>
      {variant !== 'technical' && <CarxGradientBg />}
      
      <div className="relative z-20">
        <Navbar showNavLinks={true} />
        
        {/* SEO Breadcrumbs */}
        <nav className="max-w-[1440px] mx-auto px-6 pt-24 md:pt-32 pb-8">
          <div className={`flex items-center gap-2 overflow-x-auto scrollbar-hide ${
            variant === 'technical' 
              ? 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400' 
              : 'text-xs font-bold uppercase tracking-widest text-muted'
          }`}>
            <Link to="/" className="hover:text-navy transition-colors flex items-center gap-1.5 shrink-0">
              <Home size={12} />
              Home
            </Link>
            <ChevronRight size={12} className="shrink-0 opacity-40" />
            <Link to="/guides" className="hover:text-navy transition-colors shrink-0">
              Guides
            </Link>
            {isDetail && (
              <>
                <ChevronRight size={12} className="shrink-0 opacity-40" />
                <span className="shrink-0 capitalize">{(pathParts[1] || '').replace(/-/g, ' ')}</span>
                <ChevronRight size={12} className="shrink-0 opacity-40" />
                <span className="text-navy truncate shrink-0">{title}</span>
              </>
            )}
          </div>
        </nav>

        <main className="max-w-[1440px] mx-auto px-6 pb-32">
          {children}
        </main>

        {/* Minimal Footer for SaaS feel */}
        <footer className="border-t border-slate-100 bg-white py-20 px-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            
            {/* Brand Mark */}
            <div className="mb-12">
              <img src="/favicon.svg" alt="Carsafety Icon" className="w-12 h-12 shadow-lg shadow-navy/10" />
            </div>

            {/* Premium Wordmark */}
            <h4 className="text-2xl font-black text-slate-900 mb-12 flex items-center justify-center gap-2">
              <span className="font-display">Carsafety</span>
            </h4>

            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-16 px-4">
              <Link to="/privacy" className="text-slate-500 hover:text-navy text-lg font-bold transition-all hover:-translate-y-0.5">Privacy</Link>
              <Link to="/terms" className="text-slate-500 hover:text-navy text-lg font-bold transition-all hover:-translate-y-0.5">Terms</Link>
              <Link to="/auth" className="text-slate-500 hover:text-navy text-lg font-bold transition-all hover:-translate-y-0.5">Sign In</Link>
            </div>

            {/* Micro-Copyright */}
            <div className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">
              Diagnostic SaaS © 2026
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GuideLayout;
