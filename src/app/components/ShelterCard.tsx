"use client";

import type { HazardKey, Shelter } from "../../lib/shelters";
import { useLanguage } from "../../i18n/LanguageProvider";

type Props = {
  shelter: Shelter;
  distance: number; // メートル
  activeHazard: HazardKey | null; // 今絞り込んでいる災害（無ければ null）
  onHazardClick: (key: HazardKey) => void;
  // true のときは、地図の吹き出し用の小さめの見た目にする（枠・余白なし、文字も少し小さく）
  compact?: boolean;
};

// 表示する順番（ラベルは辞書から取る）
const HAZARD_KEYS: HazardKey[] = [
  "earthquake",
  "flood",
  "landslide",
  "tsunami",
  "fire",
  "inlandFlood",
  "stormSurge",
  "volcano",
];

// 徒歩の速さ（不動産広告などで使われる 80m/分 - 20m/分(直線ではないから)）
const WALK_METERS_PER_MINUTE = 60;

function formatDistance(meters: number): { value: string; unit: string } {
  if (meters >= 1000) {
    return { value: (meters / 1000).toFixed(1), unit: "km" };
  }
  return { value: String(Math.round(meters)), unit: "m" };
}

export function ShelterCard({ shelter, distance, activeHazard, onHazardClick, compact = false }: Props) {
  const { t, locale } = useLanguage();
  const { value, unit } = formatDistance(distance);
  const walkMinutes = Math.max(1, Math.ceil(distance / WALK_METERS_PER_MINUTE));
  const address = locale === "ja" ? shelter.address : shelter.addressEn ?? shelter.address;
  // Google マップの検索 URL。英語表示のときも、検索には日本語の住所を使う（その方が正確に見つかる）
  // スマホでは Google マップのアプリが開く
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shelter.address)}`;

  return (
    <div className={compact ? "bg-white" : "rounded-2xl border border-slate-200 bg-white p-5"}>
      <div className={`flex items-start justify-between ${compact ? "gap-2" : "gap-4"}`}>
        {/* 住所と名前を押すと、Google マップが新しいタブで開く */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t.openInGoogleMaps}
          className="group block min-w-0 rounded-lg"
        >
          <p className="text-sm text-slate-700">{address}</p>
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

      <hr className={`border-slate-100 ${compact ? "my-3" : "my-4"}`} />

      <p className={`font-semibold text-slate-700 ${compact ? "mb-2 text-sm" : "mb-3"}`}>{t.supportedHazards}</p>
      <ul className={`grid grid-cols-4 ${compact ? "gap-1.5" : "gap-3"}`}>
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
                className={`flex w-full flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition ${
                  ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-none bg-gray-100 text-gray-400 hover:bg-gray-200"
                } ${active ? "ring-4 border-emerald-50 ring-emerald-500 ring-offset-1" : ""}`}
              >
                <span className="text-sm font-bold leading-tight">
                  <span aria-hidden>{ok ? "✓" : "✕"} </span>
                  {t.hazards[key]}
                </span>
                <span className="mt-0.5 text-xs">
                  {ok ? t.supported : t.notSupported}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
