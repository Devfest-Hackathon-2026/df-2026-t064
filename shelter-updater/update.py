import argparse
import csv
import hashlib
import json
import math
import shutil
from collections import defaultdict
from pathlib import Path

import requests

GRID_SIZE = 0.02

BASE_DIR = Path("data")
CSV_DIR = BASE_DIR / "prefectures"
JSON_DIR = BASE_DIR / "prefectures-json"
STAGING_DIR = BASE_DIR / "staging"

BASE_URL = (
    "https://hinanmap.gsi.go.jp/"
    "hinanjocp/defaultFtpData/csv"
)

# 47都道府県のコード
PREFECTURES = {
    "hokkaido": "01000", "aomori": "02000",
    "iwate": "03000", "miyagi": "04000",
    "akita": "05000", "yamagata": "06000",
    "fukushima": "07000", "ibaraki": "08000",
    "tochigi": "09000", "gunma": "10000",
    "saitama": "11000", "chiba": "12000",
    "tokyo": "13000", "kanagawa": "14000",
    "niigata": "15000", "toyama": "16000",
    "ishikawa": "17000", "fukui": "18000",
    "yamanashi": "19000", "nagano": "20000",
    "gifu": "21000", "shizuoka": "22000",
    "aichi": "23000", "mie": "24000",
    "shiga": "25000", "kyoto": "26000",
    "osaka": "27000", "hyogo": "28000",
    "nara": "29000", "wakayama": "30000",
    "tottori": "31000", "shimane": "32000",
    "okayama": "33000", "hiroshima": "34000",
    "yamaguchi": "35000", "tokushima": "36000",
    "kagawa": "37000", "ehime": "38000",
    "kochi": "39000", "fukuoka": "40000",
    "saga": "41000", "nagasaki": "42000",
    "kumamoto": "43000", "oita": "44000",
    "miyazaki": "45000", "kagoshima": "46000",
    "okinawa": "47000"
}

HAZARD_COLUMNS = {
    "earthquake": "地震",
    "flood": "洪水",
    "fire": "大規模な火事",
    "tsunami": "津波",
    "landslide": "崖崩れ、土石流及び地滑り",
    "stormSurge": "高潮",
    "inlandFlood": "内水氾濫",
    "volcano": "火山現象"
}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def to_bool(value):
    value = value.strip()
    if value == "1":
        return True
    if value == "0":
        return False
    if value == "":
        return None
    raise ValueError(f"不明な災害種別の値: {value}")


def get_grid_id(shelter):
    lat = math.floor(shelter["lat"] / GRID_SIZE)
    lng = math.floor(shelter["lng"] / GRID_SIZE)
    return f"{lat}_{lng}"


def convert_csv(csv_path):
    shelters = []

    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        required = {
            "共通ID", "施設・場所名", "住所", "緯度", "経度",
            *HAZARD_COLUMNS.values()
        }

        if not required.issubset(set(reader.fieldnames or [])):
            raise ValueError(f"CSVの列が不足: {csv_path}")

        for row in reader:
            if not row["緯度"] or not row["経度"]:
                raise ValueError("緯度・経度が空欄です")

            shelters.append({
                "id": row["共通ID"],
                "name": row["施設・場所名"],
                "address": row["住所"],
                "lat": float(row["緯度"]),
                "lng": float(row["経度"]),
                "hazards": {
                    key: to_bool(row[column])
                    for key, column in HAZARD_COLUMNS.items()
                }
            })

    ids = [s["id"] for s in shelters]

    if not shelters or len(ids) != len(set(ids)):
        raise ValueError(f"空データまたはID重複: {csv_path}")

    return shelters


def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def find_affected_grids(old_shelters, new_shelters):
    old_dict = {s["id"]: s for s in old_shelters}
    new_dict = {s["id"]: s for s in new_shelters}

    affected = set()

    for sid in old_dict.keys() | new_dict.keys():
        old = old_dict.get(sid)
        new = new_dict.get(sid)

        if old == new:
            continue

        if old is not None:
            affected.add(get_grid_id(old))

        if new is not None:
            affected.add(get_grid_id(new))

    return affected


def run_test():
    print("=== 差分更新テスト開始 ===")

    # 保存済みの東京都JSONを読み込む
    old_shelters = read_json(
        JSON_DIR / "tokyo.json"
    )

    # 元データを変更しないようにコピー
    import copy
    new_shelters = copy.deepcopy(old_shelters)

    # ① 施設名を変更し、別グリッドへ移動
    new_shelters[0]["name"] += "（テスト）"
    new_shelters[0]["lat"] += 0.05

    # ② 施設を1件削除
    deleted = new_shelters.pop(1)

    # ③ 施設を1件追加
    added = copy.deepcopy(new_shelters[0])
    added["id"] = "TEST001"
    added["name"] = "テスト避難場所"
    added["lat"] += 0.05
    new_shelters.append(added)

    # 差分から対象グリッドを特定
    affected_grids = find_affected_grids(
        old_shelters, new_shelters
    )

    print("更新対象グリッド:", sorted(affected_grids))

    # テスト結果の保存先
    test_dir = BASE_DIR / "test-updated-grids"
    test_dir.mkdir(parents=True, exist_ok=True)

    # 全国のデータを読み込む
    all_shelters = []

    for name in PREFECTURES:
        if name == "tokyo":
            all_shelters.extend(new_shelters)
        else:
            all_shelters.extend(
                read_json(JSON_DIR / f"{name}.json")
            )

    # 更新対象グリッドだけ再生成
    for grid_id in sorted(affected_grids):
        items = [
            shelter for shelter in all_shelters
            if get_grid_id(shelter) == grid_id
        ]

        output_path = test_dir / f"{grid_id}.json"

        if items:
            output_path.write_text(
                json.dumps(items, ensure_ascii=False),
                encoding="utf-8"
            )
        elif output_path.exists():
            output_path.unlink()

        print(f"{grid_id}: {len(items)}件")

    print("全国避難場所数:", len(all_shelters))
    # 生成したグリッドの内容を検証
    for grid_id in affected_grids:
        expected = {
            s["id"]: s
            for s in all_shelters
            if get_grid_id(s) == grid_id
        }

        output_path = test_dir / f"{grid_id}.json"

        if output_path.exists():
            actual_list = read_json(output_path)
        else:
            actual_list = []

        actual = {s["id"]: s for s in actual_list}

        assert len(actual) == len(actual_list), (
            f"{grid_id}: IDが重複しています"
        )

        assert actual == expected, (
            f"{grid_id}: データが一致しません"
        )

    print("全グリッドの内容検証: OK")
    print("差分更新テスト完了！")

def main():
    # 前回のテスト結果だけ削除
    if STAGING_DIR.exists():
        shutil.rmtree(STAGING_DIR)

    staged_csv = STAGING_DIR / "csv"
    staged_json = STAGING_DIR / "json"
    staged_grids = STAGING_DIR / "grids"

    for directory in (staged_csv, staged_json, staged_grids):
        directory.mkdir(parents=True, exist_ok=True)

    updated_prefectures = []
    affected_grids = set()

    print("=== 47都道府県の更新チェック ===")

    # ① CSVをすべて取得・検証
    with requests.Session() as session:
        for name, code in PREFECTURES.items():
            url = f"{BASE_URL}/{code}_2.csv"

            response = session.get(url, timeout=60)
            response.raise_for_status()

            new_bytes = response.content
            old_csv_path = CSV_DIR / f"{name}.csv"
            old_json_path = JSON_DIR / f"{name}.json"

            if not old_csv_path.exists() or not old_json_path.exists():
                raise FileNotFoundError(
                    f"前回データがありません: {name}"
                )

            old_bytes = old_csv_path.read_bytes()

            if sha256(old_bytes) == sha256(new_bytes):
                print(f"{name}: 更新なし")
                continue

            print(f"{name}: 更新あり")

            new_csv_path = staged_csv / f"{name}.csv"
            new_csv_path.write_bytes(new_bytes)

            new_shelters = convert_csv(new_csv_path)
            old_shelters = read_json(old_json_path)

            affected_grids.update(
                find_affected_grids(old_shelters, new_shelters)
            )

            new_json_path = staged_json / f"{name}.json"
            new_json_path.write_text(
                json.dumps(new_shelters, ensure_ascii=False),
                encoding="utf-8"
            )

            updated_prefectures.append(name)

    if not updated_prefectures:
        print("\n更新なし。処理終了！")
        return

    # ② 全国の最新データから対象グリッドを構築
    print("\n=== 対象グリッドを再生成 ===")

    grids = defaultdict(list)
    total = 0

    for name in PREFECTURES:
        staged_path = staged_json / f"{name}.json"
        current_path = JSON_DIR / f"{name}.json"

        # 更新された県だけ新JSONを使う
        source_path = (
            staged_path if staged_path.exists() else current_path
        )

        shelters = read_json(source_path)
        total += len(shelters)

        for shelter in shelters:
            grid_id = get_grid_id(shelter)

            if grid_id in affected_grids:
                grids[grid_id].append(shelter)

    # ③ 更新対象のグリッドだけ出力
    for grid_id in sorted(affected_grids):
        items = grids.get(grid_id, [])

        # 0件ならファイルを作らない
        if items:
            output_path = staged_grids / f"{grid_id}.json"
            output_path.write_text(
                json.dumps(items, ensure_ascii=False),
                encoding="utf-8"
            )

    # 空になったグリッドも記録
    deleted_grids = sorted(
        grid_id for grid_id in affected_grids
        if not grids.get(grid_id)
    )

    # ④ 更新内容を記録
    manifest = {
        "updated_prefectures": updated_prefectures,
        "affected_grids": sorted(affected_grids),
        "deleted_grids": deleted_grids,
        "national_shelter_count": total
    }

    (STAGING_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("\n=== 更新準備完了 ===")
    print("更新都道府県:", updated_prefectures)
    print("全国避難場所数:", total)
    print("更新対象グリッド数:", len(affected_grids))
    print("削除対象グリッド数:", len(deleted_grids))
    print("出力先:", STAGING_DIR)
    print("※ 本番データは変更していません")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--test",
        action="store_true",
        help="元データを変更せず差分更新をテスト"
    )
    args = parser.parse_args()

    try:
        if args.test:
            run_test()
        else:
            main()
    except Exception as e:
        print(f"\n処理を中止しました: {e}")
        raise