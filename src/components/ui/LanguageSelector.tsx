import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'ar', label: 'العربية', short: 'AR' },
];

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const toggleLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close on click outside
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
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-high/10 hover:bg-surface-high/20 border border-overlay transition-all text-sm font-bold text-on-surface w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-navy/10 text-navy px-1.5 py-0.5 rounded-md font-black">{currentLanguage.short}</span>
          <span>{currentLanguage.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 opacity-40 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-surface border border-overlay rounded-2xl shadow-2xl overflow-hidden z-[100]"
          >
            <div className="p-1.5 space-y-0.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors
                    ${i18n.language === lang.code 
                      ? 'bg-navy text-white shadow-lg shadow-navy/20' 
                      : 'text-on-surface hover:bg-surface-high/40'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${i18n.language === lang.code ? 'bg-white/20 text-white' : 'bg-navy/10 text-navy'}`}>
                      {lang.short}
                    </span>
                    <span>{lang.label}</span>
                  </div>
                  {i18n.language === lang.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
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
