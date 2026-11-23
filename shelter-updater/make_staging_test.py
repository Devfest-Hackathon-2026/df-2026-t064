
import csv
import json
import shutil

from update import (
    CSV_DIR,
    JSON_DIR,
    STAGING_DIR,
    PREFECTURES,
    convert_csv,
    get_grid_id,
    find_affected_grids,
)

# ① テスト用フォルダを初期化
if STAGING_DIR.exists():
    shutil.rmtree(STAGING_DIR)

for folder in ("csv", "json", "grids"):
    (STAGING_DIR / folder).mkdir(parents=True, exist_ok=True)


# ② 更新前の東京都JSONを読み込む
old_shelters = json.loads(
    (JSON_DIR / "tokyo.json").read_text(encoding="utf-8")
)


# ③ 東京都CSVを読み込んで施設名を変更
source_csv = CSV_DIR / "tokyo.csv"
staged_csv = STAGING_DIR / "csv" / "tokyo.csv"

with open(source_csv, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

# 実際のCSVの列名に合わせて施設名を変更
name_column = "施設・場所名"

if name_column not in fieldnames:
    raise ValueError(
        f"施設名の列が見つかりません: {fieldnames}"
    )

rows[0][name_column] += "（更新テスト）"

with open(staged_csv, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)


# ④ 変更後のCSVからJSONを生成
new_shelters = convert_csv(staged_csv)

(STAGING_DIR / "json" / "tokyo.json").write_text(
    json.dumps(new_shelters, ensure_ascii=False),
    encoding="utf-8"
)


# ⑤ 更新対象のグリッドを特定
affected_grids = find_affected_grids(
    old_shelters,
    new_shelters
)


# ⑥ 全国のデータから対象グリッドを再生成
all_shelters = []

for prefecture in PREFECTURES:
    if prefecture == "tokyo":
        shelters = new_shelters
    else:
        shelters = json.loads(
            (JSON_DIR / f"{prefecture}.json").read_text(
                encoding="utf-8"
            )
        )

    all_shelters.extend(shelters)

deleted_grids = []

for grid_id in sorted(affected_grids):
    items = [
        shelter for shelter in all_shelters
        if get_grid_id(shelter) == grid_id
    ]

    if not items:
        deleted_grids.append(grid_id)
        continue

    (STAGING_DIR / "grids" / f"{grid_id}.json").write_text(
        json.dumps(items, ensure_ascii=False),
        encoding="utf-8"
    )


# ⑦ 更新内容をmanifest.jsonに記録
manifest = {
    "updated_prefectures": ["tokyo"],
    "affected_grids": sorted(affected_grids),
    "deleted_grids": deleted_grids,
    "national_shelter_count": len(all_shelters),
    "test_only": True,
}

(STAGING_DIR / "manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2),
    encoding="utf-8"
)

print("テスト用更新データを作成しました")
print("更新対象グリッド:", sorted(affected_grids))
print("全国の避難所数:", len(all_shelters))
