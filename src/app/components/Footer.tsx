"use client";

import { useLanguage } from "../../i18n/LanguageProvider";

// 国土地理院のデータの出典（利用規約で表示が必要）
const SOURCE_URL = "https://www.gsi.go.jp/bousaichiri/hinanbasho.html";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-1 text-center text-[11px] text-slate-500">
      <a
        href={SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {t.attribution}
      </a>
    </footer>
  );
}
