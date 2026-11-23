/// <reference types="google.maps" />
import { importLibrary } from "@googlemaps/js-api-loader";
import { ensureMapsOptions } from "./google-maps";
import type { Prefecture } from "./prefectures";

export type LatLng = { lat: number; lng: number };

// 検索で見つかった場所の候補
export type LocationCandidate = {
  id: string;
  label: string; // 画面に出す住所
  position: LatLng;
};

// 郵便番号の形なら "100-0005" の形にして返す。違えば null
// 全角の数字やハイフン、先頭の「〒」、ハイフンなし（1000005）にも対応する
export function toPostalCode(input: string): string | null {
  const text = input
    .normalize("NFKC")
    .replace(/\s/g, "")
    .replace(/[‐‑‒–—―−ー]/g, "-");
  const match = text.match(/^〒?(\d{3})-?(\d{4})$/);
  return match ? `${match[1]}-${match[2]}` : null;
}

// 住所の先頭・末尾に付く国名は、日本国内しか検索しないので消す
function trimCountry(address: string): string {
  return address.replace(/^日本、\s*/, "").replace(/,\s*Japan$/, "");
}

async function geocode(request: google.maps.GeocoderRequest): Promise<LocationCandidate[]> {
  ensureMapsOptions();
  const { Geocoder } = await importLibrary("geocoding");

  try {
    const { results } = await new Geocoder().geocode(request);
    return results.map((result) => ({
      id: result.place_id,
      label: trimCountry(result.formatted_address),
      position: {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
      },
    }));
  } catch (err) {
    // 見つからなかったときもエラーとして返ってくるので、「0件」として扱う
    if ((err as { code?: unknown }).code === "ZERO_RESULTS") return [];
    throw err;
  }
}

// 住所または郵便番号で探す
export function searchByAddress(input: string): Promise<LocationCandidate[]> {
  const postalCode = toPostalCode(input);
  if (postalCode) {
    return geocode({
      address: postalCode,
      componentRestrictions: { country: "JP", postalCode },
    });
  }
  return geocode({
    address: input.trim(),
    componentRestrictions: { country: "JP" },
  });
}

// 都道府県と、近くにある建物・駅などの名前で探す
// 検索には日本語の名前を使う（英語表示のときも、その方が正確に見つかる）
// 名前を入力しなかったときは、その都道府県の主な駅の周辺にする（候補は選ばせず、1件目を使う）
export async function searchByLandmark(prefecture: Prefecture, keyword: string): Promise<LocationCandidate[]> {
  const name = keyword.trim();
  if (name === "") {
    const results = await geocode({
      address: `${prefecture.ja} ${prefecture.station.ja}`,
      componentRestrictions: { country: "JP" },
    });
    return results.slice(0, 1);
  }
  return geocode({
    address: `${prefecture.ja} ${name}`,
    componentRestrictions: { country: "JP" },
  });
}
