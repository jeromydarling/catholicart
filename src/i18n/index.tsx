import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "./en.json";
import es from "./es.json";
import it from "./it.json";
import fr from "./fr.json";

// English is the source of truth. Other locales are filled by the
// build script (scripts/translate-i18n.mjs) which calls the worker
// at /api/translate. Missing keys fall back to English so the site
// is always renderable.

export type Locale = "en" | "es" | "it" | "fr";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "fr", label: "Français" },
];

const DICTIONARIES: Record<Locale, Record<string, string>> = { en, es, it, fr };

const STORAGE_KEY = "locavit:locale";

function detectInitial(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved && DICTIONARIES[saved]) return saved;
  const nav = (window.navigator.language || "en").slice(0, 2).toLowerCase() as Locale;
  return DICTIONARIES[nav] ? nav : "en";
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitial());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  };

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTIONARIES[locale] ?? {};
    const enDict = DICTIONARIES.en;
    const t = (key: string, vars?: Record<string, string | number>) => {
      const template = dict[key] ?? enDict[key] ?? key;
      return interpolate(template, vars);
    };
    return { locale, setLocale, t };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
