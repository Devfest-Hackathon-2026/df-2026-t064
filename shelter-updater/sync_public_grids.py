
import argparse
import json
import math
import shutil
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent
JSON_DIR = BASE / "data" / "prefectures-json"
PUBLIC_DIR = BASE.parent / "public" / "data" / "grids"
BACKUP_DIR = BASE / "data" / "public-backups"

GRID_SIZE = 0.02


def build_expected():
    expected = {}

    for path in JSON_DIR.glob("*.json"):
        shelters = json.loads(path.read_text(encoding="utf-8"))

        for shelter in shelters:
            lat = math.floor(shelter["lat"] / GRID_SIZE)
            lng = math.floor(shelter["lng"] / GRID_SIZE)
            grid_id = f"{lat}_{lng}"

            expected.setdefault(grid_id, []).append(shelter)

    return expected


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    expected = build_expected()
    actual_files = {
        path.stem: path
        for path in PUBLIC_DIR.glob("*.json")
    }

    changed = []
    deleted = []

    for grid_id, shelters in expected.items():
        path = actual_files.get(grid_id)

        if path is None:
            changed.append(grid_id)
            continue

        actual = json.loads(path.read_text(encoding="utf-8"))

        if sorted(actual, key=lambda s: s["id"]) != sorted(
            shelters, key=lambda s: s["id"]
        ):
            changed.append(grid_id)

    for grid_id in actual_files:
        if grid_id not in expected:
            deleted.append(grid_id)

    print("=== 公開グリッド同期 ===")
    print("更新・追加:", len(changed))
    print("削除:", len(deleted))

    if not args.apply:
        print("確認モード：ファイルは変更していません")
        return

    if not changed and not deleted:
        print("変更なし")
        return

    backup = BACKUP_DIR / datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    backup.mkdir(parents=True, exist_ok=False)

    # 変更前のファイルをバックアップ
    for grid_id in changed + deleted:
        path = actual_files.get(grid_id)
        if path is not None:
            shutil.copy2(path, backup / path.name)

    print("バックアップ:", backup)

    # 更新・追加
    for grid_id in changed:
        path = PUBLIC_DIR / f"{grid_id}.json"
        path.write_text(
            json.dumps(expected[grid_id], ensure_ascii=False),
            encoding="utf-8"
        )

    # 削除
    for grid_id in deleted:
        actual_files[grid_id].unlink()

    print("公開グリッド同期完了！")


if __name__ == "__main__":
    main()
