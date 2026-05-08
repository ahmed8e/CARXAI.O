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
        className={`flex items-center gap-1.5 sm:gap-2 transition-all duration-300 group ${
          variant === 'minimal' 
            ? 'p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-navy'
            : 'ps-2.5 pe-1.5 py-1.5 rounded-full bg-slate-50/50 border border-slate-100 hover:border-navy/20 hover:bg-white text-[11px] font-bold text-slate-500 uppercase tracking-tight'
        }`}
      >
        <Globe className={`w-3.5 h-3.5 sm:w-4 h-4 transition-colors ${isOpen ? 'text-navy' : 'text-slate-400 group-hover:text-navy'}`} />
        {variant === 'full' && (
          <span className="truncate max-w-[60px]">{currentLanguage.short}</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform duration-500 opacity-40 group-hover:opacity-100 ${isOpen ? 'rotate-180 text-navy' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? 8 : -8, scale: 0.95 }}
            className={`absolute ${dropdownPosition === 'bottom' ? 'top-full mt-3' : 'bottom-full mb-3'} end-0 min-w-[170px] bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden z-[100] p-1.5`}
          >
            <div className="p-1 space-y-0.5">
              <div className="px-3 py-2 mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{i18n.language === 'ar' ? 'اختر اللغة' : 'Language'}</p>
              </div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-[13px] font-bold transition-all
                    ${i18n.language === lang.code 
                      ? 'bg-navy text-white shadow-md shadow-navy/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${i18n.language === lang.code ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {lang.short}
                    </span>
                    <span>{lang.label}</span>
                  </div>
                  {i18n.language === lang.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
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
