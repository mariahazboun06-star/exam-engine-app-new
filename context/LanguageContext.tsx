'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';

interface LanguageContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['he']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('he');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'he' || savedLang === 'en')) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'he' ? 'en' : 'he'));
  };

  const t = (key: keyof typeof translations['he']) => {
    return translations[lang]?.[key] || translations['he'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === 'he' ? 'rtl' : 'ltr', toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}