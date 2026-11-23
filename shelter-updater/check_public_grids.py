
import json
import math
from pathlib import Path

BASE = Path(__file__).resolve().parent
JSON_DIR = BASE / "data" / "prefectures-json"
PUBLIC_DIR = BASE.parent / "public" / "data" / "grids"

GRID_SIZE = 0.02

expected = {}

# 47都道府県のJSONからグリッドを再構成
for path in JSON_DIR.glob("*.json"):
    shelters = json.loads(path.read_text(encoding="utf-8"))

    for shelter in shelters:
        lat_index = math.floor(shelter["lat"] / GRID_SIZE)
        lng_index = math.floor(shelter["lng"] / GRID_SIZE)
        grid_id = f"{lat_index}_{lng_index}"

        expected.setdefault(grid_id, []).append(shelter)

actual_files = {
    path.stem: path
    for path in PUBLIC_DIR.glob("*.json")
}

expected_ids = set(expected)
actual_ids = set(actual_files)

missing = expected_ids - actual_ids
extra = actual_ids - expected_ids

different = []

for grid_id in expected_ids & actual_ids:
    actual = json.loads(
        actual_files[grid_id].read_text(encoding="utf-8")
    )

    # 配列の順番が違っても、IDを基準に比較
    expected_items = sorted(
        expected[grid_id], key=lambda s: s["id"]
    )
    actual_items = sorted(
        actual, key=lambda s: s["id"]
    )

    if expected_items != actual_items:
        different.append(grid_id)

print("=== 公開グリッド整合性チェック ===")
print("期待グリッド数:", len(expected_ids))
print("公開グリッド数:", len(actual_ids))
print("不足グリッド数:", len(missing))
print("余分なグリッド数:", len(extra))
print("内容不一致グリッド数:", len(different))

if missing:
    print("不足例:", sorted(missing)[:5])
if extra:
    print("余分な例:", sorted(extra)[:5])
if different:
    print("内容不一致例:", sorted(different)[:5])

if not missing and not extra and not different:
    print("全国グリッドの整合性: OK")
else:
    print("全国グリッドの整合性: NG")

print("\n=== 不一致の詳細 ===")

for grid_id in sorted(different):
    expected_items = {
        s["id"]: s for s in expected[grid_id]
    }

    actual = json.loads(
        actual_files[grid_id].read_text(encoding="utf-8")
    )
    actual_items = {
        s["id"]: s for s in actual
    }

    added = set(expected_items) - set(actual_items)
    removed = set(actual_items) - set(expected_items)

    changed = [
        shelter_id
        for shelter_id in expected_items.keys() & actual_items.keys()
        if expected_items[shelter_id] != actual_items[shelter_id]
    ]

    print(f"\nグリッド: {grid_id}")
    print(f"  Python側のみ: {len(added)}件")
    print(f"  Web側のみ: {len(removed)}件")
    print(f"  同じIDで内容変更: {len(changed)}件")

    for shelter_id in sorted(added):
        print("  追加:", shelter_id, expected_items[shelter_id]["name"])

    for shelter_id in sorted(removed):
        print("  削除候補:", shelter_id, actual_items[shelter_id]["name"])

    for shelter_id in sorted(changed):
        print("  内容変更:", shelter_id)
        old = actual_items[shelter_id]
        new = expected_items[shelter_id]

        for key in new:
            if old.get(key) != new.get(key):
                print(f"    {key}: {old.get(key)} → {new.get(key)}")
