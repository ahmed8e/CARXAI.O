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
}

const GuideLayout: React.FC<GuideLayoutProps> = ({ 
  children, 
  title, 
  metaTitle,
  description
}) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Update document title for SEO
    if (metaTitle) {
      document.title = metaTitle;
    } else if (title) {
      document.title = `${title} | CarxAI Diagnostic Hub`;
    }

    // Update meta description for SEO
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
    
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [title, metaTitle, description, pathname]);

  // Extract category and slug from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  const isDetail = pathParts.length > 1;

  return (
    <div className="relative min-h-screen bg-white text-on-surface">
      <CarxGradientBg />
      
      <div className="relative z-20">
        <Navbar showNavLinks={true} />
        
        {/* SEO Breadcrumbs */}
        <nav className="max-w-[1440px] mx-auto px-6 pt-24 md:pt-32 pb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted overflow-x-auto scrollbar-hide">
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
        <footer className="border-t border-slate-100 bg-white/50 backdrop-blur-md py-12 px-6">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-black text-sm">C</div>
              <span className="font-display font-bold text-lg">CarxAI</span>
            </div>
            <div className="flex gap-8 text-sm font-bold text-muted">
              <Link to="/privacy" className="hover:text-navy transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-navy transition-colors">Terms</Link>
              <Link to="/auth" className="hover:text-navy transition-colors">Sign In</Link>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              Diagnostic SaaS © 2026
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GuideLayout;
