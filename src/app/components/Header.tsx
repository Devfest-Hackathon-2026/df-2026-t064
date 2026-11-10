"use client";

import { useLanguage } from "../../i18n/LanguageProvider";
import { LOCALES } from "../../i18n/dictionaries";

export function Header() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="flex items-center justify-between gap-4 bg-white px-4 py-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold leading-tight">{t.title}</h1>
        <p className="truncate text-xs text-slate-500">{t.subtitle}</p>
      </div>

      <div
        role="group"
        aria-label={t.language}
        className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1"
      >
        {LOCALES.map(({ code, label, shortLabel }) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={active}
              aria-label={label}
              lang={code}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold transition-colors ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {shortLabel}
            </button>
          );
        })}
      </div>
    </header>
  );
}
