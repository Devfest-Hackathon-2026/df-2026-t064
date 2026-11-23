"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { SearchButton } from "./SearchButton";

type Props = {
  searching: boolean;
  onSearch: (query: string) => void;
};

// 住所または郵便番号で探すフォーム（どちらかは入力の形で自動で見分ける）
export function AddressSearchForm({ searching, onSearch }: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const canSearch = query.trim() !== "" && !searching;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (canSearch) onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="manual-address" className="text-sm font-semibold text-slate-700">
        {t.manual.addressLabel}
      </label>
      <input
        id="manual-address"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.manual.addressPlaceholder}
        autoComplete="street-address"
        enterKeyHint="search"
        className="rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <SearchButton disabled={!canSearch} searching={searching} />
    </form>
  );
}
