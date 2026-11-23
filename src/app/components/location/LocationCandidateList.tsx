"use client";

import { useLanguage } from "../../../i18n/LanguageProvider";
import type { LocationCandidate } from "../../../lib/geocode";

type Props = {
  candidates: LocationCandidate[];
  onSelect: (candidate: LocationCandidate) => void;
};

// 検索で複数の場所が見つかったときに、どれを使うか選ぶ一覧
export function LocationCandidateList({ candidates, onSelect }: Props) {
  const { t } = useLanguage();

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-slate-700">{t.manual.candidates}</h3>
      <ul className="flex flex-col gap-2">
        {candidates.map((candidate, i) => (
          <li key={`${candidate.id}-${i}`}>
            <button
              type="button"
              onClick={() => onSelect(candidate)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50"
            >
              {candidate.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
