// data/shelters.json に、英語の住所（addressEn）を追加する。
//
// 必要なもの:
//   data/ken_all_rome/KEN_ALL_ROME.CSV（日本郵便「住所の郵便番号（ローマ字）」）
//   https://www.post.japanpost.jp/service/search/zipcode/download/roman-zip.html からダウンロードして展開する
//   ※ public/ には置かないこと（public/ の中身はそのまま公開される）
//
// 実行: npm run data:address
// 何度実行しても同じ結果になる（前回の addressEn は上書きされる）

import fs from "node:fs";
import path from "node:path";
import iconv from "iconv-lite";
import KuroshiroModule from "kuroshiro";
import KuromojiAnalyzerModule from "kuroshiro-analyzer-kuromoji";

import type { Shelter } from "../src/lib/shelters";

// kuroshiro は古い CommonJS のパッケージなので、default の位置が環境によって違う
const Kuroshiro = (KuroshiroModule as any).default ?? KuroshiroModule;
const KuromojiAnalyzer = (KuromojiAnalyzerModule as any).default ?? KuromojiAnalyzerModule;

const sheltersPath = path.join(process.cwd(), "data", "shelters.json");
const kenAllRomePath = path.join(process.cwd(), "data", "ken_all_rome", "KEN_ALL_ROME.CSV");

// ---------- 文字の正規化 ----------

// 全角英数字→半角、空白を消す、「ヶ」「ヵ」の表記ゆれをそろえる、
// 「八条」「三丁目」のような漢数字を数字にそろえる（住所データと避難所データで書き方が違うことがあるため）
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\s/g, "")
    .replace(/[ヶヵ]/g, "ケ")
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/([一二三四五六七八九十]+)(?=条|丁目|線|地割)/g, (k) => String(kanjiToNumber(k)));
}

// 漢数字 → 数字（function 宣言なので、上の normalize からも使える）
function kanjiToNumber(kanji: string): number {
  const n: Record<string, number> = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
  };
  // 「十」「十二」「二十」「二十四」まで対応（条や丁目で使われる程度）
  const [tens, ones] = kanji.includes("十") ? kanji.split("十") : ["", kanji];
  const tensValue = kanji.includes("十") ? (tens ? n[tens] : 1) * 10 : 0;
  return tensValue + (ones ? n[ones] ?? 0 : 0);
}

// "SAPPORO SHI" → "Sapporo Shi"
function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------- 住所のローマ字データを読み込む ----------

type CityEntry = {
  prefEn: string;
  cityEn: string;
  // 町域（正規化した漢字）→ ローマ字。長い順に照合するため、配列も持っておく
  towns: Map<string, string>;
  townKeys: string[];
};

// 都道府県名（漢字）→ その都道府県の市区町村一覧
const prefIndex = new Map<string, Map<string, CityEntry>>();

// "TOKYO TO" → "Tokyo"、"OSAKA FU" → "Osaka"、"HOKKAIDO" → "Hokkaido"
function formatPref(roma: string): string {
  return titleCase(roma.replace(/ (TO|FU|KEN)$/, ""));
}

// "SAPPORO SHI CHUO KU" → "Chuo-ku, Sapporo-shi"（英語の住所は小さい単位から書く）
const CITY_SUFFIXES = new Set(["SHI", "KU", "CHO", "MACHI", "MURA", "SON", "GUN"]);
function formatCity(roma: string): string {
  const groups: string[] = [];
  for (const token of roma.split(" ").filter(Boolean)) {
    if (CITY_SUFFIXES.has(token) && groups.length > 0) {
      groups[groups.length - 1] += "-" + token.toLowerCase();
    } else {
      groups.push(titleCase(token));
    }
  }
  return groups.reverse().join(", ");
}

// 町域として使えないもの（「以下に掲載がない場合」など）
function isUsableTown(town: string): boolean {
  return (
    town !== "" &&
    town !== "以下に掲載がない場合" &&
    !town.endsWith("の次に番地がくる場合") &&
    !town.endsWith("一円")
  );
}

function loadKenAllRome() {
  if (!fs.existsSync(kenAllRomePath)) {
    console.error(`見つかりません: ${kenAllRomePath}`);
    console.error("日本郵便の「住所の郵便番号（ローマ字）」をダウンロードして展開してください。");
    process.exit(1);
  }

  // Shift_JIS なので変換して読む
  const text = iconv.decode(fs.readFileSync(kenAllRomePath), "Shift_JIS");

  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    // "0600000","北海道","札幌市　中央区","大通東","HOKKAIDO","SAPPORO SHI CHUO KU","ODORIHIGASHI"
    const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ""));
    if (cols.length < 7) continue;
    const [, pref, city, townRaw, prefRoma, cityRoma, townRomaRaw] = cols;

    // 「大通西（１～１９丁目）」のような補足は外す
    const town = normalize(townRaw.replace(/（.*$/, ""));
    const townRoma = townRomaRaw.replace(/\(.*$/, "").trim();

    if (!prefIndex.has(pref)) prefIndex.set(pref, new Map());
    const cities = prefIndex.get(pref)!;

    // 市区町村のキー。郡は住所で省かれることがあるので、郡なしのキーも登録する
    // 例: 「幡多郡　黒潮町」→「幡多郡黒潮町」と「黒潮町」
    const parts = city.split(/\s|　/).filter(Boolean);
    const cityKeys = [normalize(city)];
    if (parts.length > 1 && parts[0].endsWith("郡")) {
      cityKeys.push(normalize(parts.slice(1).join("")));
    }

    let entry = cities.get(cityKeys[0]);
    if (!entry) {
      entry = {
        prefEn: formatPref(prefRoma),
        cityEn: formatCity(cityRoma),
        towns: new Map(),
        townKeys: [],
      };
    }
    for (const key of cityKeys) {
      if (!cities.has(key)) cities.set(key, entry);
    }

    if (isUsableTown(town) && townRoma && !entry.towns.has(town)) {
      entry.towns.set(town, titleCase(townRoma));
    }
  }

  // 長い名前から照合したいので並べておく（「本町」より「本町通」を先に）
  for (const cities of prefIndex.values()) {
    for (const entry of cities.values()) {
      entry.townKeys = [...entry.towns.keys()].sort((a, b) => b.length - a.length);
    }
  }
}

// ---------- ローマ字変換（kuroshiro） ----------
// 住所データに無い字名（町域より後ろの部分）をローマ字にするときだけ使う

const kuroshiro = new Kuroshiro();
const romajiCache = new Map<string, string>();

// 漢字・かなをローマ字にする（パスポート式: 長音記号を使わない ASCII だけの表記）
async function toRomaji(text: string): Promise<string> {
  const cached = romajiCache.get(text);
  if (cached !== undefined) return cached;

  const raw: string = await kuroshiro.convert(text.normalize("NFKC"), {
    to: "romaji",
    mode: "spaced",
    romajiSystem: "passport",
  });

  const result = titleCase(raw.replace(/\s+/g, " ").trim())
    // 記号の前後の余計な空白を詰める
    .replace(/\s+([),.\-])/g, "$1")
    .replace(/([(\-])\s+/g, "$1");

  romajiCache.set(text, result);
  return result;
}

// ---------- 住所 → 英語 ----------

// 町域より後ろ（番地など）を英語向けに整える。例: "2丁目3番4号" → "2-3-4"
// （漢数字の丁目は normalize で数字になっている）
async function formatRest(rest: string): Promise<string> {
  let r = rest
    .replace(/^(大字|字)/, "")
    .replace(/(\d+)丁目/g, "$1-")
    .replace(/(\d+)番地?/g, "$1-")
    .replace(/(\d+)号/g, "$1")
    .replace(/-{2,}/g, "-")
    .replace(/-$/, "");

  // まだ漢字やかなが残っている（町域が見つからなかった・字名が続く）ときはローマ字にする
  if (/[^\x00-\x7F]/.test(r)) {
    r = await toRomaji(r);
  }
  // 珍しい漢字の字名は読めずに残ることがある。中途半端になるので、その部分は付けない
  if (/[^\x00-\x7F]/.test(r)) return "";
  return r.trim();
}

type AddressStats = { full: number; cityOnly: number; none: number };
const stats: AddressStats = { full: 0, cityOnly: 0, none: 0 };

async function toEnglishAddress(address: string): Promise<string | undefined> {
  const normalized = normalize(address);

  // 1. 都道府県
  const pref = [...prefIndex.keys()].find((p) => normalized.startsWith(p));
  if (!pref) {
    stats.none++;
    return undefined;
  }
  let rest = normalized.slice(pref.length);

  // 2. 市区町村（長いものから照合: 「札幌市中央区」を「札幌市」より先に）
  const cities = prefIndex.get(pref)!;
  const cityKey = [...cities.keys()]
    .filter((c) => rest.startsWith(c))
    .sort((a, b) => b.length - a.length)[0];
  if (!cityKey) {
    stats.none++;
    return undefined;
  }
  const city = cities.get(cityKey)!;
  rest = rest.slice(cityKey.length);

  // 3. 町域（「大字」「字」が付いていてもいなくても探す）
  const candidates = [rest, rest.replace(/^(大字|字)/, "")];
  let townEn = "";
  for (const candidate of candidates) {
    const townKey = city.townKeys.find((t) => candidate.startsWith(t));
    if (townKey) {
      townEn = city.towns.get(townKey)!;
      rest = candidate.slice(townKey.length);
      break;
    }
  }
  if (townEn) stats.full++;
  else stats.cityOnly++;

  // 4. 英語の順番に並べる: 番地 町域, 市区町村, 都道府県
  const restEn = await formatRest(rest);
  const first = [restEn, townEn].filter(Boolean).join(" ");
  return [first, city.cityEn, city.prefEn].filter(Boolean).join(", ");
}

// ---------- 実行 ----------

async function main() {
  console.log("住所のローマ字データを読み込み中...");
  loadKenAllRome();

  console.log("ローマ字変換の辞書を準備中...");
  await kuroshiro.init(new KuromojiAnalyzer());

  const shelters: Shelter[] = JSON.parse(fs.readFileSync(sheltersPath, "utf-8"));
  // 動作確認用: LIMIT=100 npm run data:address で100件だけ処理して表示する（保存しない）
  // SPREAD=1 も付けると、先頭からではなく全国から均等に選ぶ
  const limit = Number(process.env.LIMIT) || 0;
  const step = limit && process.env.SPREAD ? Math.floor(shelters.length / limit) : 1;
  const targets = limit
    ? Array.from({ length: limit }, (_, i) => shelters[i * step]).filter(Boolean)
    : shelters;

  console.log(`${targets.length} 件を変換中...`);

  for (const shelter of targets) {
    shelter.addressEn = await toEnglishAddress(shelter.address);
  }

  console.log("住所の変換結果:", {
    町域まで: stats.full,
    市区町村まで: stats.cityOnly,
    変換できず: stats.none,
  });

  if (limit) {
    for (const s of targets.slice(0, 20)) {
      console.log(`${s.address} → ${s.addressEn}`);
    }
    console.log("（LIMIT 指定中なので保存していません）");
    return;
  }

  fs.writeFileSync(sheltersPath, JSON.stringify(shelters), "utf-8");
  console.log(`保存しました: ${sheltersPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
