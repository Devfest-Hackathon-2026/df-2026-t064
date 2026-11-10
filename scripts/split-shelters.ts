import fs from "node:fs";
import path from "node:path";

import type { Shelter } from "../src/lib/shelters";
import { GRID_SIZE, getGridId } from "../src/lib/grid";

//全国のJSON
const inputPath = path.join(
    process.cwd(),
    "data",
    "shelters.json"
);

//区間で分割したJSOｎの出力先
const outputDir = path.join(
    process.cwd(),
    "public",
    "data",
    "grids"
);

//全国データを読み込む
const shelters: Shelter[] = JSON.parse(
    fs.readFileSync(inputPath, "utf-8")
);
//区間ごとの分類
const grids = new Map<string, Shelter[]>();

for (const shelter of shelters) {
    const gridId = getGridId(shelter.lat, shelter.lng);
    if (!grids.has(gridId)) {
        grids.set(gridId, []);
    }
    grids.get(gridId)!.push(shelter);
}
// 古い区画データを削除して再生成
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// 区画ごとにJSONを書き出す
for (const [gridId, items] of grids) {
    const filePath = path.join(outputDir, `${gridId}.json`);

    fs.writeFileSync(
        filePath,
        JSON.stringify(items),
        "utf-8"
    );
}
console.log("区画の大きさ:", `${GRID_SIZE}度`);
console.log("全国避難場所数:", shelters.length);
console.log("生成した区画数:", grids.size);
console.log(
    "分割後の避難場所数:",
    [...grids.values()].reduce(
        (sum, items) => sum + items.length,
        0
    )
);