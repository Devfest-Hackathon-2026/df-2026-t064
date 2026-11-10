
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

// 型はアプリ側と共通のものを使う（二重に管理しないため）
import type { Shelter } from "../src/lib/shelters";

type HazardStatus = Shelter["hazards"][keyof Shelter["hazards"]];

const csvPath = path.join(
    // 元データ。public/ に置くとサイトで公開されてしまうので data/ に置く
    process.cwd(), "data", "hinanjo.csv"
);

const outputPath = path.join(
    process.cwd(), "data", "shelters.json"
);

const csv = fs.readFileSync(csvPath, "utf-8");

const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
});

// 元データの値を変換
function parseHazard(value: string | undefined): HazardStatus {
    if (value?.trim() === "1") return true;
    if (value?.trim() === "0") return false;
    return null;
}

const shelters: Shelter[] = result.data
    .map((row) => ({
        id: row["共通ID"],
        // 名前の中に改行が入っているものがある（例: "岡本公民館\n（今立生涯学習センター）"）ので空白にする
        name: row["施設・場所名"]?.replace(/\s*\r?\n\s*/g, " ").trim(),
        address: row["住所"] ?? "",
        lat: Number(row["緯度"]),
        lng: Number(row["経度"]),
        hazards: {
            earthquake: parseHazard(row["地震"]),
            flood: parseHazard(row["洪水"]),
            fire: parseHazard(row["大規模な火事"]),
            tsunami: parseHazard(row["津波"]),
            landslide: parseHazard(row["崖崩れ、土石流及び地滑り"]),
            stormSurge: parseHazard(row["高潮"]),
            inlandFlood: parseHazard(row["内水氾濫"]),
            volcano: parseHazard(row["火山現象"]),
        },
    }))
    .filter(
        (shelter) =>
            shelter.id &&
            shelter.name &&
            Number.isFinite(shelter.lat) &&
            Number.isFinite(shelter.lng) &&
            shelter.lat >= -90 &&
            shelter.lat <= 90 &&
            shelter.lng >= -180 &&
            shelter.lng <= 180
    );

if (result.errors.length > 0) {
    console.error("CSV解析エラー:", result.errors.slice(0, 5));
    process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

fs.writeFileSync(
    outputPath,
    JSON.stringify(shelters),
    "utf-8"
);

console.log("変換成功件数:", shelters.length);
console.log("最初のデータ:", shelters[0]);
