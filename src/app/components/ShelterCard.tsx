"use client";

import type { HazardKey, Shelter } from "../../lib/shelters";
import { useLanguage } from "../../i18n/LanguageProvider";
import { HAZARD_KEYS } from "../../lib/hazards";

type Props = {
  shelter: Shelter;
  distance: number;
  activeHazard: HazardKey | null;
  onHazardClick: (key: HazardKey) => void;
  compact?: boolean;
  routeOrigin?: { lat: number; lng: number };
};

// 徒歩の速さ（不動産広告などで使われる 80m/分 - 20m/分(直線ではないから)）
const WALK_METERS_PER_MINUTE = 60;

function formatDistance(meters: number): { value: string; unit: string } {
  if (meters >= 1000) {
    return { value: (meters / 1000).toFixed(1), unit: "km" };
  }
  return { value: String(Math.round(meters)), unit: "m" };
}

export function ShelterCard({ shelter, distance, activeHazard, onHazardClick, compact = false, routeOrigin }: Props) {
  const { t } = useLanguage();
  const { value, unit } = formatDistance(distance);
  const walkMinutes = Math.max(1, Math.ceil(distance / WALK_METERS_PER_MINUTE));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shelter.address)}`;
  const origin = routeOrigin ? `&origin=${routeOrigin.lat},${routeOrigin.lng}` : "";
  const routeUrl = `https://www.google.com/maps/dir/?api=1${origin}&destination=${shelter.lat},${shelter.lng}&travelmode=walking`;


  return (
    <div
      className={
        compact
          ? // 吹き出しの横幅は ShelterMap で吹き出し側に指定する。中身はその幅いっぱいに広がる
            "w-full bg-white"
          : "rounded-2xl border border-slate-200 bg-white p-5"
      }
    >
      <div className={`flex items-start justify-between ${compact ? "gap-2" : "gap-4"}`}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t.openInGoogleMaps}
          className="group block min-w-0 rounded-lg"
        >
          {/* 吹き出しでは住所を1行に収め、はみ出した分は「…」にする（押せば Google マップで全体が見られる） */}
          <p className={`text-xs text-slate-700 ${compact ? "truncate" : ""}`}>{shelter.address}</p>
          <h2 className={`mt-1 font-bold text-slate-900 group-hover:underline ${compact ? "text-lg" : "text-2xl"}`}>
            {shelter.name}
            <span aria-hidden className="ml-1 text-base text-slate-400">↗</span>
          </h2>
        </a>

        <div className={`shrink-0 text-center ${compact ? "px-1" : "px-4 py-2"}`}>
          <p className="text-slate-800">
            <span className={`font-bold ${compact ? "text-2xl" : "text-3xl"}`}>{value}</span>
            <span className="ml-0.5 text-lg font-semibold">{unit}</span>
          </p>
          <p className="text-sm text-slate-500">{t.walkMinutes(walkMinutes)}</p>
        </div>
      </div>

      <hr className={`border-slate-100 ${compact ? "my-2" : "my-4"}`} />

      <p className={`font-semibold text-slate-700 ${compact ? "mb-2 text-sm" : "mb-3"}`}>{t.supportedHazards}</p>
      {/* 吹き出しでは3列に並べて、ボタンの幅を揃える（高さを抑えてスクロールを出さないため） */}
      <ul className={compact ? "grid grid-cols-3 gap-1.5" : "flex flex-wrap gap-3"}>
        {HAZARD_KEYS.map((key) => {
          const ok = shelter.hazards[key] === true;
          const active = activeHazard === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onHazardClick(key)}
                aria-pressed={active}
                title={active ? t.clearFilter : t.filterBy(t.hazards[key])}
                className={`flex flex-col items-center justify-center rounded-xl border text-center transition ${
                  // 吹き出しではマスの幅いっぱいに広げ、縦の余白を少し詰める。英語の長い名前は2行に折り返してよい
                  compact ? "h-full w-full px-1 py-1" : "whitespace-nowrap px-3 py-2"
                } ${
                  ok
                    ? "bg-[#32AF41] text-white hover:bg-green-700"
                    : "border-none bg-gray-100 text-gray-400 hover:bg-gray-200"
                } ${active ? "ring-2 border-emerald-50 bg-green-700 ring-emerald-500 ring-offset-1" : ""}`}
              >
                <span className="text-sm font-bold leading-tight">
                  <span aria-hidden>{ok ? "✓" : "✕"} </span>
                  {t.hazards[key]}
                </span>
                <span className="mt-0.5 text-xs leading-tight">
                  {ok ? t.supported : t.notSupported}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex justify-center">
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t.searchRouteTitle}
          className="flex w-2/3 items-center justify-center whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span>{t.searchRoute}</span>
        </a>
      </div>
    </div>
  );
}
