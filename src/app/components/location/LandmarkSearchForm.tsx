"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { PREFECTURES, findPrefecture, type Prefecture } from "../../../lib/prefectures";
import { SearchButton } from "./SearchButton";

type Props = {
  searching: boolean;
  onSearch: (prefecture: Prefecture, keyword: string) => void;
};

// 都道府県と、近くにある建物・駅などの名前で探すフォーム
// 名前は入力しなくてもよい。そのときは、その都道府県の主な駅の周辺を表示する
export function LandmarkSearchForm({ searching, onSearch }: Props) {
  const { t, locale } = useLanguage();
  const [prefectureJa, setPrefectureJa] = useState("");
  const [keyword, setKeyword] = useState("");
  const prefecture = findPrefecture(prefectureJa);
  const canSearch = prefecture !== undefined && !searching;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (prefecture && !searching) onSearch(prefecture, keyword);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="manual-prefecture" className="text-sm font-semibold text-slate-700">
        {t.manual.prefectureLabel}
      </label>
      <select
        id="manual-prefecture"
        value={prefectureJa}
        onChange={(e) => setPrefectureJa(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <option value="" disabled>
          {t.manual.prefecturePlaceholder}
        </option>
        {PREFECTURES.map((p) => (
          <option key={p.ja} value={p.ja}>
            {locale === "ja" ? p.ja : p.en}
          </option>
        ))}
      </select>

      <label htmlFor="manual-landmark" className="text-sm font-semibold text-slate-700">
        {t.manual.landmarkLabel}
      </label>
      <input
        id="manual-landmark"
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={t.manual.landmarkPlaceholder}
        enterKeyHint="search"
        aria-describedby="manual-landmark-hint"
        className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <p id="manual-landmark-hint" className="text-xs text-slate-500">
        {t.manual.landmarkHint(
          prefecture ? (locale === "ja" ? prefecture.station.ja : prefecture.station.en) : null,
        )}
      </p>

      <SearchButton disabled={!canSearch} searching={searching} />
    </form>
  );
}
