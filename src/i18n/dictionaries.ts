const ja = {
  title: "避難場ナビ",
  subtitle: "知らない土地での避難確認",
  language: "言語",
  currentLocation: "現在地",
  locating: "現在地を取得中...",
  locationErrors: {
    unsupported: "このブラウザは位置情報に対応していません",
    denied: "位置情報の利用が許可されていません。ブラウザの設定で、このサイトの位置情報を許可してください",
    unavailable: "現在地を特定できませんでした。電波の良い場所でもう一度お試しください",
    timeout: "現在地の取得に時間がかかっています。もう一度お試しください",
  },
  retry: "もう一度試す",
  resultCount: (n: number) => `検索結果：${n}カ所`,
  fetchError: "避難場所の取得に失敗しました",
  supportedHazards: "対応している災害",
  supported: "対応",
  notSupported: "非対応",
  walkMinutes: (min: number) => `徒歩 約${min}分`,
  filterBy: (hazard: string) => `${hazard}に対応している避難場所だけ表示`,
  filteringBy: (hazard: string) => `${hazard}に対応`,
  clearFilter: "絞り込みを解除",
  filterBarLabel: "災害の種類で絞り込む",
  filterButton: "災害の種類で検索",
  allHazards: "すべて",
  siteCount: (n: number) => `${n}カ所`,
  openInGoogleMaps: "Google マップで開く",
  searchRoute: "経路を検索",
  searchRouteTitle: "Google マップで徒歩の経路を表示",
  noMatch: (hazard: string) => `この周辺に、${hazard}に対応している避難場所は見つかりませんでした`,
  attribution: "出典：国土地理院「指定緊急避難場所データ」を加工して作成",
  hazards: {
    earthquake: "地震",
    flood: "洪水",
    landslide: "土砂災害",
    tsunami: "津波",
    fire: "火災",
    inlandFlood: "内水氾濫",
    stormSurge: "高潮",
    volcano: "火山",
  },
  manual: {
    chooseManually: "場所を入力して探す",
    retryLocation: "現在地をもう一度取得",
    title: "場所を入力して探す",
    description: "近くの避難場所を探したい場所を入力してください",
    back: "戻る",
    methods: "探し方",
    byAddress: "住所・郵便番号",
    byLandmark: "都道府県・近くの建物",
    addressLabel: "住所または郵便番号",
    addressPlaceholder: "例：東京都千代田区丸の内1-9-1、100-0005",
    prefectureLabel: "都道府県",
    prefecturePlaceholder: "選択してください",
    landmarkLabel: "近くにある建物・駅など（任意）",
    landmarkPlaceholder: "例：東京駅、〇〇小学校",
    landmarkHint: (station: string | null) =>
      station
        ? `入力しない場合は、${station}の周辺を表示します`
        : "入力しない場合は、都道府県の主な駅の周辺を表示します",
    search: "検索",
    searching: "検索中...",
    candidates: "場所を選んでください",
    notFound: "見つかりませんでした。書き方を変えて、もう一度お試しください",
    searchError: "検索できませんでした。通信状況を確認して、もう一度お試しください",
    selectedLocation: "選択した場所",
    changeLocation: "場所を変更",
  },
};

// 辞書の形は日本語に合わせる
export type Dictionary = typeof ja;

const en: Dictionary = {
  title: "Shelter Navi",
  subtitle: "Find where to evacuate, even in unfamiliar places",
  language: "Language",
  currentLocation: "Your location",
  locating: "Getting your location...",
  locationErrors: {
    unsupported: "Your browser does not support location services",
    denied: "Location access is blocked. Please allow location access for this site in your browser settings",
    unavailable: "Could not determine your location. Please try again somewhere with a better signal",
    timeout: "Getting your location is taking too long. Please try again",
  },
  retry: "Try again",
  resultCount: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
  fetchError: "Failed to load evacuation sites",
  supportedHazards: "Supported disasters",
  supported: "Supported",
  notSupported: "Not supported",
  walkMinutes: (min: number) => `about ${min} min walk`,
  filterBy: (hazard: string) => `Show only sites that support ${hazard.toLowerCase()}`,
  filteringBy: (hazard: string) => hazard,
  clearFilter: "Clear filter",
  filterBarLabel: "Filter by disaster type",
  filterButton: "Search by disaster type",
  allHazards: "All",
  siteCount: (n: number) => `${n} site${n === 1 ? "" : "s"}`,
  openInGoogleMaps: "Open in Google Maps",
  searchRoute: "Get directions",
  searchRouteTitle: "Show walking directions in Google Maps",
  noMatch: (hazard: string) => `No evacuation sites nearby support ${hazard.toLowerCase()}`,
  attribution:
    "Source: Designated Emergency Evacuation Sites data, Geospatial Information Authority of Japan (GSI), modified",
  hazards: {
    earthquake: "Earthquake",
    flood: "Flood",
    landslide: "Landslide",
    tsunami: "Tsunami",
    fire: "Fire",
    inlandFlood: "Inland flood",
    stormSurge: "Storm surge",
    volcano: "Volcano",
  },
  manual: {
    chooseManually: "Enter a location instead",
    retryLocation: "Try your location again",
    title: "Enter a location",
    description: "Enter the place where you want to find nearby evacuation sites",
    back: "Back",
    methods: "Search by",
    byAddress: "Address / postal code",
    byLandmark: "Prefecture / nearby place",
    addressLabel: "Address or postal code",
    addressPlaceholder: "e.g. 1-9-1 Marunouchi, Chiyoda-ku, Tokyo or 100-0005",
    prefectureLabel: "Prefecture",
    prefecturePlaceholder: "Select a prefecture",
    landmarkLabel: "Nearby building, station, etc. (optional)",
    landmarkPlaceholder: "e.g. Tokyo Station",
    landmarkHint: (station: string | null) =>
      station
        ? `If left blank, the area around ${station} is shown`
        : "If left blank, the area around the prefecture's main station is shown",
    search: "Search",
    searching: "Searching...",
    candidates: "Choose a location",
    notFound: "No matching places found. Try different wording",
    searchError: "Search failed. Check your connection and try again",
    selectedLocation: "Selected location",
    changeLocation: "Change location",
  },
};

export const dictionaries = { ja, en } satisfies Record<string, Dictionary>;

export type Locale = keyof typeof dictionaries;

export const DEFAULT_LOCALE: Locale = "ja";

export const LOCALES: { code: Locale; label: string; shortLabel: string }[] = [
  { code: "ja", label: "日本語", shortLabel: "日本語" },
  { code: "en", label: "English", shortLabel: "EN" },
];
