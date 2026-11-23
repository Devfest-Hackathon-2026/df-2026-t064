"use client";

import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { searchByAddress, searchByLandmark, type LocationCandidate } from "../../../lib/geocode";
import { useLocationSearch } from "../../hooks/useLocationSearch";
import { AddressSearchForm } from "./AddressSearchForm";
import { LandmarkSearchForm } from "./LandmarkSearchForm";
import { LocationCandidateList } from "./LocationCandidateList";

type Method = "address" | "landmark";

type Props = {
  onSelect: (location: LocationCandidate) => void;
  onBack: () => void;
};

// 現在地が取れないときに、場所を入力して選ぶ画面
// 探し方は「住所・郵便番号」と「都道府県・近くの建物」の2つ
export function ManualLocationPicker({ onSelect, onBack }: Props) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<Method>("address");
  const { state, run, reset } = useLocationSearch();
  const searching = state.status === "loading";

  const methods: { key: Method; label: string }[] = [
    { key: "address", label: t.manual.byAddress },
    { key: "landmark", label: t.manual.byLandmark },
  ];

  const changeMethod = (next: Method) => {
    setMethod(next);
    reset();
  };

  const search = async (find: () => Promise<LocationCandidate[]>) => {
    const candidates = await run(find);
    // 1件だけ見つかったときは、選ぶ手間を省いてそのまま使う
    if (candidates?.length === 1) onSelect(candidates[0]);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <span aria-hidden>← </span>
          {t.manual.back}
        </button>
        <h2 className="mt-2 text-xl font-bold">{t.manual.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.manual.description}</p>
      </div>

      <div
        role="group"
        aria-label={t.manual.methods}
        className="grid grid-cols-2 gap-1 rounded-full border border-slate-200 bg-slate-100 p-1"
      >
        {methods.map(({ key, label }) => {
          const active = key === method;
          return (
            <button
              key={key}
              type="button"
              onClick={() => changeMethod(key)}
              aria-pressed={active}
              className={`rounded-full px-3 py-2 text-sm font-bold transition-colors ${
                active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {method === "address" ? (
        <AddressSearchForm
          searching={searching}
          onSearch={(query) => search(() => searchByAddress(query))}
        />
      ) : (
        <LandmarkSearchForm
          searching={searching}
          onSearch={(prefecture, keyword) => search(() => searchByLandmark(prefecture, keyword))}
        />
      )}

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t.manual.searchError}
        </p>
      )}

      {state.status === "done" && state.candidates.length === 0 && (
        <p role="status" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600">
          {t.manual.notFound}
        </p>
      )}

      {state.status === "done" && state.candidates.length > 1 && (
        <LocationCandidateList candidates={state.candidates} onSelect={onSelect} />
      )}
    </div>
  );
}
