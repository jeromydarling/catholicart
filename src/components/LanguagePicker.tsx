import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LOCALES, useT, type Locale } from "../i18n";
import { cn } from "../lib/utils";

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm font-sans uppercase tracking-[0.18em] text-ink-soft hover:text-ink hover:bg-parchment-100 focusable transition-colors",
          compact ? "h-9 px-2 text-[10px]" : "h-9 px-2.5 text-[11px]",
        )}
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full mt-1 min-w-[140px] rounded-md border border-ink/10 bg-parchment-50 shadow-card overflow-hidden z-50"
        >
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l.code as Locale);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 font-sans text-sm text-ink hover:bg-parchment-100 focusable",
                    active && "bg-burgundy-500/5",
                  )}
                >
                  <span>{l.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-burgundy-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
