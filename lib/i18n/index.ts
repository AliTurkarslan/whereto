import tr from '@/locales/tr.json';
import en from '@/locales/en.json';

export type Locale = 'tr' | 'en';

const translations = {
  tr,
  en,
} as const;

export function getTranslations(locale: Locale = 'tr') {
  return translations[locale] || translations.tr;
}

export function t(key: string, locale: Locale = 'tr'): string {
  const keys = key.split('.');
  let value: any = translations[locale] || translations.tr;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to Turkish if key not found
      value = translations.tr;
      for (const k2 of keys) {
        value = value?.[k2];
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}


