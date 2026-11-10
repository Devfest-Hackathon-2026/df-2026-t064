"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, dictionaries, type Dictionary, type Locale } from "./dictionaries";

const STORAGE_KEY = "locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return value !== null && value in dictionaries;
}

// 保存されている言語を読む（ブラウザでだけ呼ぶこと）。無ければ・読めなければ null
export function readSavedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLocale(saved) ? saved : null;
  } catch {
    // プライベートモードなどで使えないとき
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // サーバーでのレンダーと合わせるため、最初は必ずデフォルト（日本語）
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // 前回選んだ言語を復元する（localStorage はブラウザでしか使えないので useEffect の中）
  useEffect(() => {
    const saved = readSavedLocale();
    if (saved) setLocaleState(saved);
  }, []);

  // <html lang="..."> も合わせて変える（読み上げソフトや翻訳機能のため）
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存できなくても切り替え自体はできる
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage は LanguageProvider の中で使ってください");
  }
  return value;
}
