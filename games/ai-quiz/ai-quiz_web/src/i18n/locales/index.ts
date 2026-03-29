import type { Locale, TranslationDict } from '../types';
import { es } from './es';
import { en } from './en';

const TRANSLATIONS: Record<Locale, TranslationDict> = { es, en };

export function getTranslations(locale: Locale): TranslationDict {
  return TRANSLATIONS[locale];
}
