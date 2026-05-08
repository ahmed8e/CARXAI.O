import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ar', label: 'العربية', short: 'AR' },
  { code: 'fr', label: 'Français', short: 'FR' },
];

interface LanguageSelectorProps {
  className?: string;
  dropdownPosition?: 'top' | 'bottom';
  variant?: 'minimal' | 'full';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className, 
  dropdownPosition = 'bottom',
  variant = 'full'
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const toggleLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 sm:gap-2.5 transition-all group ${
          variant === 'minimal' 
            ? 'p-2 rounded-full hover:bg-surface-high dark:hover:bg-surface-high/40 text-muted hover:text-navy'
            : 'px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-surface/50 dark:bg-surface-high/20 border border-overlay hover:border-navy/30 hover:bg-surface-high dark:hover:bg-surface-high/40 text-[11px] sm:text-xs font-black uppercase tracking-widest text-on-surface'
        }`}
      >
        <Globe className={`w-3.5 h-3.5 sm:w-4 h-4 transition-colors ${isOpen ? 'text-navy' : 'text-muted group-hover:text-navy'}`} />
        <span className="hidden sm:inline-block truncate">
          {currentLanguage.label} / {currentLanguage.short}
        </span>
        <span className="sm:hidden text-[10px] font-black">{currentLanguage.short}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 opacity-40 group-hover:opacity-100 ${isOpen ? 'rotate-180 text-navy' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? 10 : -10, scale: 0.95 }}
            className={`absolute ${dropdownPosition === 'bottom' ? 'top-full mt-3' : 'bottom-full mb-3'} end-0 min-w-[180px] bg-surface/98 dark:bg-surface-low backdrop-blur-3xl border border-overlay rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[100] p-1.5`}
          >
            <div className="space-y-0.5">
              <div className="px-3 py-2 mb-1 border-b border-overlay">
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">{i18n.language === 'ar' ? 'اختر اللغة' : 'Select Language'}</p>
              </div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-[12px] font-bold transition-all
                    ${i18n.language === lang.code 
                      ? 'bg-navy text-white shadow-lg shadow-navy/20' 
                      : 'text-on-surface/70 hover:bg-surface-high dark:hover:bg-surface-high/60 hover:text-navy'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${i18n.language === lang.code ? 'bg-white/20 text-white' : 'bg-navy/10 text-navy'}`}>
                      {lang.short}
                    </span>
                    <span>{lang.label}</span>
                  </div>
                  {i18n.language === lang.code && (
                    <motion.div 
                      layoutId="lang-indicator"
                      className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
