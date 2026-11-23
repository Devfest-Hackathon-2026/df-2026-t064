"use client";

import { useLanguage } from "../../../i18n/LanguageProvider";

type Props = {
  onClick: () => void;
};

// 手動で選んだ場所を表示しているときに、地図の上（絞り込みバーの下）に出す「場所を変更」ボタン
export function ChangeLocationButton({ onClick }: Props) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-md hover:bg-slate-50"
    >
      {t.manual.changeLocation}
    </button>
  );
}
