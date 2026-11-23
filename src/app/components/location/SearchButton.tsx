"use client";

import { useLanguage } from "../../../i18n/LanguageProvider";

type Props = {
  disabled: boolean;
  searching: boolean;
};

// 場所の検索フォームで共通の「検索」ボタン
export function SearchButton({ disabled, searching }: Props) {
  const { t } = useLanguage();

  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {searching ? t.manual.searching : t.manual.search}
    </button>
  );
}
