import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { es, en, type Translations } from './locales';

export type Language = 'es' | 'en';

const STORAGE_KEY = 'pylos.language';

const translations: Record<Language, Translations> = { es, en };

type I18nContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') return stored;
    } catch {}
    return 'es';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const t = translations[lang];

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
