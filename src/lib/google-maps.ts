import { setOptions } from "@googlemaps/js-api-loader";
import { readSavedLocale } from "../i18n/LanguageProvider";
import { DEFAULT_LOCALE, type Locale } from "../i18n/dictionaries";

// Google Maps を読み込んだときの表示言語（まだ読み込んでいなければ null）
let loadedLanguage: Locale | null = null;

// Google Maps の設定（APIキー・表示言語）。最初の1回だけ設定する
// 地図（ShelterMap）と住所検索（geocode.ts）の両方から呼ぶ
// 表示言語はあとから変えられないので、言語を切り替えたときはページを再読み込みする（ShelterMap）
export function ensureMapsOptions() {
  if (loadedLanguage) return;
  const language = readSavedLocale() ?? DEFAULT_LOCALE;
  setOptions({
    key: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!,
    v: "weekly",
    language,
    region: "JP",
  });
  loadedLanguage = language;
}

export function getLoadedMapsLanguage(): Locale | null {
  return loadedLanguage;
}
