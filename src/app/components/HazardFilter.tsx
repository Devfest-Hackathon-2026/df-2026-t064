"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { HAZARD_KEYS } from "../../lib/hazards";
import type { HazardKey } from "../../lib/shelters";

type Props = {
  activeHazard: HazardKey | null;
  counts: Record<HazardKey, number>;
  total: number;
  onChange: (hazard: HazardKey | null) => void;
};

export function HazardFilter({ activeHazard, counts, total, onChange }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const select = (hazard: HazardKey | null) => {
    onChange(hazard !== null && hazard === activeHazard ? null : hazard);
    setOpen(false);
  };

  const options: { key: HazardKey | null; label: string; count: number }[] = [
    { key: null, label: t.allHazards, count: total },
    ...HAZARD_KEYS.map((key) => ({ key, label: t.hazards[key], count: counts[key] })),
  ];

  return (
    <div ref={rootRef} className="pointer-events-auto flex w-full max-w-md flex-col-reverse items-center gap-2 px-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="hazard-filter-panel"
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition-colors ${
          activeHazard ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-800 hover:bg-slate-50"
        }`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        {activeHazard ? t.filteringBy(t.hazards[activeHazard]) : t.filterButton}
      </button>

      {open && (
        <div
          id="hazard-filter-panel"
          role="group"
          aria-label={t.filterBarLabel}
          className="w-full rounded-2xl bg-white p-3 shadow-lg"
        >
          <p className="mb-2 text-sm font-semibold text-slate-700">{t.filterBarLabel}</p>
          <div className="grid grid-cols-3 gap-2">
            {options.map(({ key, label, count }) => {
              const active = key === activeHazard;
              return (
                <button
                  key={key ?? "all"}
                  type="button"
                  onClick={() => select(key)}
                  aria-pressed={active}
                  className={`flex min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition-colors ${
                    active
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-bold leading-tight">{label}</span>
                  <span className={`mt-0.5 text-xs tabular-nums ${active ? "text-slate-300" : "text-slate-500"}`}>
                    {t.siteCount(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
