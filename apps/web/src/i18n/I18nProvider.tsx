import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DICTIONARIES } from './locales.js';
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from './types.js';
import type { TranslationKey } from './types.js';

const STORAGE_KEY = 'url-checker.language';

type TranslateValues = Record<string, string | number>;

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslateValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value !== null && (LANGUAGES as readonly string[]).includes(value);
}

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (isLanguage(stored)) {
    return stored;
  }

  const navigatorLanguage = window.navigator.language.slice(0, 2);

  return isLanguage(navigatorLanguage) ? navigatorLanguage : DEFAULT_LANGUAGE;
}

function interpolate(template: string, values?: TranslateValues): string {
  if (values === undefined) {
    return template;
  }

  return template.replace(/\{(\w+)\}/gu, (match, token: string) => {
    const value = values[token];
    return value === undefined ? match : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    detectInitialLanguage,
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: TranslateValues): string =>
      interpolate(DICTIONARIES[language][key], values),
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);

  if (context === null) {
    throw new Error('useTranslation must be used within an I18nProvider.');
  }

  return context;
}
