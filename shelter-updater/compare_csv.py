
import csv
from pathlib import Path

BASE = Path(__file__).resolve().parent

NATIONAL_CSV = BASE.parent / "data" / "hinanjo.csv"
PREFECTURE_DIR = BASE / "data" / "prefectures"


def load_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


# 全国版CSV
national_rows = load_csv(NATIONAL_CSV)

# 都道府県別CSV
prefecture_rows = []

for path in sorted(PREFECTURE_DIR.glob("*.csv")):
    prefecture_rows.extend(load_csv(path))

# 共通IDで比較
national = {row["共通ID"]: row for row in national_rows}
prefectures = {row["共通ID"]: row for row in prefecture_rows}

only_national = set(national) - set(prefectures)
only_prefectures = set(prefectures) - set(national)

# 全国版にしかない市町村名の列とNO列は比較対象から除外
compare_columns = [
    "施設・場所名", "住所", "洪水",
    "崖崩れ、土石流及び地滑り", "高潮",
    "地震", "津波", "大規模な火事",
    "内水氾濫", "火山現象",
    "指定避難所との住所同一", "緯度", "経度", "備考"
]

changed = []

for shelter_id in national.keys() & prefectures.keys():
    differences = [
        col for col in compare_columns
        if national[shelter_id][col] != prefectures[shelter_id][col]
    ]
    if differences:
        changed.append((shelter_id, differences))

print("=== 全国版と都道府県別CSVの比較 ===")
print("全国版件数:", len(national_rows))
print("都道府県別合計:", len(prefecture_rows))
print("全国版にのみ存在:", len(only_national))
print("都道府県別にのみ存在:", len(only_prefectures))
print("同じIDで内容が異なる:", len(changed))

print("\n全国版にのみ存在するID:")
for shelter_id in sorted(only_national)[:20]:
    print(shelter_id, national[shelter_id]["施設・場所名"])

print("\n都道府県別にのみ存在するID:")
for shelter_id in sorted(only_prefectures)[:20]:
    print(shelter_id, prefectures[shelter_id]["施設・場所名"])

print("\n内容が異なるID:")
for shelter_id, columns in sorted(changed)[:20]:
    print(shelter_id, columns)
