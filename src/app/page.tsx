"use client";

import { useCurrentPosition } from "./hooks/useCurrentPosition";
import { ShelterMap } from "./components/ShelterMap";
import { useLanguage } from "../i18n/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();
  const { position, error, retry } = useCurrentPosition();

  return (
    <main className="relative min-h-0 flex-1">
      {position ? (
        <ShelterMap center={position} />
      ) : error ? (
        <div
          role="alert"
          className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <p className="max-w-md text-slate-700">{t.locationErrors[error]}</p>
          {error !== "unsupported" && (
            <button
              type="button"
              onClick={retry}
              className="rounded-full bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              {t.retry}
            </button>
          )}
        </div>
      ) : (
        <div
          role="status"
          className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center"
        >
          <div
            aria-hidden
            className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
          />
          <p className="text-slate-600">{t.locating}</p>
        </div>
      )}
    </main>
  );
}
