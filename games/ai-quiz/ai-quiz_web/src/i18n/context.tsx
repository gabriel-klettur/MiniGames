import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Locale, TranslationDict } from './types';
import { getTranslations } from './locales';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem('ai-quiz-locale');
    if (stored === 'es' || stored === 'en') return stored;
  } catch { /* SSR-safe */ }
  const nav = navigator.language.slice(0, 2);
  return nav === 'es' ? 'es' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('ai-quiz-locale', l); } catch { /* noop */ }
    document.documentElement.lang = l;
  }, []);

  const dict: TranslationDict = useMemo(() => getTranslations(locale), [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replaceAll(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    [dict],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
