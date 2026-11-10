import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type Shelter = {
  id: string;
  name: string;
  address: string;
  // 英語の住所（例: "1-1-1 Momijidainishi, Atsubetsu-ku, Sapporo-shi, Hokkaido"）
  // scripts/add-english-address.ts で追加する。変換できなかったときは無い
  addressEn?: string;
  lat: number;
  lng: number;
  hazards: {
    earthquake: boolean | null;
    flood: boolean | null;
    fire: boolean | null;
    tsunami: boolean | null;
    landslide: boolean | null;
    stormSurge: boolean | null;
    inlandFlood: boolean | null;
    volcano: boolean | null;
  };
};

// 災害の種類（"earthquake" | "flood" | ...）
export type HazardKey = keyof Shelter["hazards"];

export async function loadShelters(): Promise<Shelter[]> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "shelters.json"
  );

  const json = await fs.readFile(filePath, "utf-8");

  return JSON.parse(json) as Shelter[];
}