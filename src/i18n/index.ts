import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Handle RTL for Arabic
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  
  // Update body classes for CSS targeting
  if (lng === 'ar') {
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
  
  // Persist to localStorage (Detector might handle this but being explicit is safer)
  localStorage.setItem('i18nextLng', lng);
});

// Initial set
const initialLng = i18n.language || 'en';
document.documentElement.dir = initialLng === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = initialLng;
if (initialLng === 'ar') {
  document.body.classList.add('rtl');
} else {
  document.body.classList.add('ltr');
}

export default i18n;
