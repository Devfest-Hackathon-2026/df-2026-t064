
import json
from pathlib import Path
from update import JSON_DIR, PREFECTURES, get_grid_id
import shutil
from datetime import datetime
from update import convert_csv

STAGING_DIR = Path("data/staging")


def validate_update():
    manifest_path = STAGING_DIR / "manifest.json"

    if not manifest_path.exists():
        print("更新データがありません")
        return False

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    updated_prefectures = manifest["updated_prefectures"]
    affected_grids = manifest["affected_grids"]
    deleted_grids = manifest["deleted_grids"]

    print("=== 更新内容の検証 ===")
    print("更新都道府県:", updated_prefectures)
    print("更新対象グリッド数:", len(affected_grids))
    print("削除対象グリッド数:", len(deleted_grids))

    # 更新された都道府県のCSV・JSONを確認
    for name in updated_prefectures:
        csv_path = STAGING_DIR / "csv" / f"{name}.csv"
        json_path = STAGING_DIR / "json" / f"{name}.json"

        if not csv_path.exists():
            raise FileNotFoundError(f"CSVがありません: {name}")

        if not json_path.exists():
            raise FileNotFoundError(f"JSONがありません: {name}")

        with open(json_path, encoding="utf-8") as f:
            shelters = json.load(f)

        ids = [s["id"] for s in shelters]

        if len(ids) != len(set(ids)):
            raise ValueError(f"ID重複: {name}")

        for shelter in shelters:
            lat = shelter["lat"]
            lng = shelter["lng"]

            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                raise ValueError(f"座標が不正: {name}")

        # CSVを再変換して、更新予定JSONと比較する
        csv_path = STAGING_DIR / "csv" / f"{name}.csv"

        converted_shelters = convert_csv(csv_path)

        if converted_shelters != shelters:
            raise ValueError(
                f"{name}: CSVとJSONの内容が一致しません"
            )
        print(f"{name}: {len(shelters)}件 OK")

    # 再生成されたグリッドの存在確認
    for grid_id in affected_grids:
        grid_path = STAGING_DIR / "grids" / f"{grid_id}.json"

        if grid_id in deleted_grids:
            if grid_path.exists():
                raise ValueError(
                    f"削除対象なのにファイルがあります: {grid_id}"
                )
        elif not grid_path.exists():
            raise FileNotFoundError(
                f"グリッドがありません: {grid_id}"
            )

        # 全国の最新データを使ってグリッドを検証
    print("=== グリッド内容の検証 ===")

    expected_grids = {
        grid_id: [] for grid_id in affected_grids
    }

    total = 0

    for name in PREFECTURES:
        staged_path = STAGING_DIR / "json" / f"{name}.json"
        saved_path = JSON_DIR / f"{name}.json"

        # 更新県は新JSON、それ以外は保存済みJSON
        source_path = (
            staged_path if staged_path.exists() else saved_path
        )

        shelters = json.loads(
            source_path.read_text(encoding="utf-8")
        )

        total += len(shelters)

        for shelter in shelters:
            grid_id = get_grid_id(shelter)

            if grid_id in expected_grids:
                expected_grids[grid_id].append(shelter)

    # 全国の施設数を確認
    if total != manifest["national_shelter_count"]:
        raise ValueError("全国の避難場所数が一致しません")

    # グリッドごとに内容を比較
    for grid_id in affected_grids:
        expected = expected_grids[grid_id]
        grid_path = STAGING_DIR / "grids" / f"{grid_id}.json"

        actual = (
            json.loads(grid_path.read_text(encoding="utf-8"))
            if grid_path.exists() else []
        )

        expected_by_id = {s["id"]: s for s in expected}
        actual_by_id = {s["id"]: s for s in actual}

        if len(actual) != len(actual_by_id):
            raise ValueError(f"ID重複: {grid_id}")

        if expected_by_id != actual_by_id:
            raise ValueError(
                f"グリッド内容が一致しません: {grid_id}"
            )

        print(f"{grid_id}: {len(actual)}件 OK")

    print("グリッド内容の検証: OK")

    print("\n=== 反映予定ファイル ===")

    for name in updated_prefectures:
        print(f"CSV更新: data/prefectures/{name}.csv")
        print(f"JSON更新: data/prefectures-json/{name}.json")

    for grid_id in affected_grids:
        if grid_id in deleted_grids:
            print(f"グリッド削除: data/grids/{grid_id}.json")
        else:
            print(f"グリッド更新: data/grids/{grid_id}.json")

    print("更新データの検証: OK")
    return True

def create_backup(data_dir=Path("data")):
    data_dir = Path(data_dir)
    manifest_path = STAGING_DIR / "manifest.json"

    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    backup_dir = Path("data/backups") / timestamp

    updated_prefectures = manifest["updated_prefectures"]
    affected_grids = manifest["affected_grids"]

    # バックアップするファイルの一覧
    files = []

    files = []

    for name in updated_prefectures:
        files.append((
            data_dir / "prefectures" / f"{name}.csv",
            backup_dir / "prefectures" / f"{name}.csv"
        ))

        files.append((
            data_dir / "prefectures-json" / f"{name}.json",
            backup_dir / "prefectures-json" / f"{name}.json"
        ))

    for grid_id in affected_grids:
        files.append((
            data_dir / "grids" / f"{grid_id}.json",
            backup_dir / "grids" / f"{grid_id}.json"
        ))

    # 元ファイルが存在するものだけコピー
    # 更新前に存在していたファイルを記録
    existing_files = []
    missing_files = []

    for source, destination in files:
        if source.exists():
            destination.parent.mkdir(
                parents=True,
                exist_ok=True
            )
            shutil.copy2(source, destination)

            existing_files.append(str(source.relative_to(data_dir)))
            print(f"バックアップ: {source}")
        else:
            missing_files.append(str(source.relative_to(data_dir)))
            print(f"元ファイルなし: {source}")

    # 復元に必要な情報を保存
    backup_manifest = {
        "existing_files": existing_files,
        "missing_files": missing_files
    }

    (backup_dir / "backup_manifest.json").write_text(
        json.dumps(backup_manifest, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("バックアップ完了！")
    return backup_dir

def rollback(backup_dir, data_dir=Path("data")):
    backup_dir = Path(backup_dir)
    data_dir = Path(data_dir)

    manifest_path = backup_dir / "backup_manifest.json"

    with open(manifest_path, encoding="utf-8") as f:
        backup_manifest = json.load(f)

    print("=== ロールバック開始 ===")

    # 元から存在していたファイルを復元
    for file_path in backup_manifest["existing_files"]:
        relative_path = Path(file_path)

        source = backup_dir / relative_path
        destination = data_dir / relative_path

        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

        print(f"復元: {destination}")

    # 元から存在しなかったファイルを削除
    for file_path in backup_manifest["missing_files"]:
        relative_path = Path(file_path)
        target = data_dir / relative_path

        if target.exists():
            target.unlink()
            print(f"削除: {target}")

    print("ロールバック完了！")


def apply_changes(data_dir, fail_after=None):
    data_dir = Path(data_dir)

    manifest = json.loads(
        (STAGING_DIR / "manifest.json").read_text(
            encoding="utf-8"
        )
    )

    # テストデータ以外の反映を防ぐ
    if manifest.get("test_only") is not True:
        raise ValueError("テスト専用の更新データではありません")

    print("=== 更新反映開始 ===")


    updated_count = 0

    def count_update():
        nonlocal updated_count
        updated_count += 1

        if fail_after is not None and updated_count >= fail_after:
            raise RuntimeError(
                f"テスト用エラー: {updated_count}ファイル更新後"
            )
        
    # CSVとJSONを更新
    for name in manifest["updated_prefectures"]:
        for folder, target_folder in [
            ("csv", "prefectures"),
            ("json", "prefectures-json")
        ]:
            extension = "csv" if folder == "csv" else "json"
            source = STAGING_DIR / folder / f"{name}.{extension}"
            destination = data_dir / target_folder / source.name

            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)

            print(f"更新: {destination}")
            count_update()

    # グリッドを更新または削除
    for grid_id in manifest["affected_grids"]:
        destination = data_dir / "grids" / f"{grid_id}.json"

        if grid_id in manifest["deleted_grids"]:
            if destination.exists():
                destination.unlink()
                print(f"削除: {destination}")
                count_update()
        else:
            source = STAGING_DIR / "grids" / f"{grid_id}.json"
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
            print(f"更新: {destination}")
            count_update()

    print("更新反映完了！")


def run_update(data_dir, fail_after=None):
    data_dir = Path(data_dir)

    # 本番データへの誤反映を防ぐ
    if data_dir.resolve() != Path("data/apply-test").resolve():
        raise ValueError("現在はテスト用フォルダのみ更新できます")

    # ① 更新データの検証
    if not validate_update():
        print("更新データがないため終了します")
        return

    # ② 更新前のバックアップ
    backup_dir = create_backup(data_dir=data_dir)

    try:
        # ③ 更新を実行
        apply_changes(data_dir, fail_after=fail_after)

    except Exception as e:
        # ④ 失敗した場合は復元
        print("更新中にエラーが発生:", e)
        rollback(backup_dir, data_dir=data_dir)
        raise

    print("更新処理が正常に完了しました")

def get_production_paths():
    base = Path(__file__).resolve().parent

    return {
        "csv": base / "data" / "prefectures",
        "json": base / "data" / "prefectures-json",
        "grids": base.parent / "public" / "data" / "grids",
    }

def create_production_backup():
    manifest = json.loads(
        (STAGING_DIR / "manifest.json").read_text(
            encoding="utf-8"
        )
    )

    paths = get_production_paths()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    backup_dir = Path("data/backups/production") / timestamp

    files = []

    for name in manifest["updated_prefectures"]:
        files.append(("csv", f"{name}.csv"))
        files.append(("json", f"{name}.json"))

    for grid_id in manifest["affected_grids"]:
        files.append(("grids", f"{grid_id}.json"))

    existing_files = []
    missing_files = []

    for folder, filename in files:
        source = paths[folder] / filename
        destination = backup_dir / folder / filename

        if source.exists():
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
            existing_files.append([folder, filename])
            print("バックアップ:", source)
        else:
            missing_files.append([folder, filename])
            print("元ファイルなし:", source)

    backup_dir.mkdir(parents=True, exist_ok=True)

    (backup_dir / "backup_manifest.json").write_text(
        json.dumps({
            "existing_files": existing_files,
            "missing_files": missing_files
        }, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    return backup_dir


def rollback_production(backup_dir):
    paths = get_production_paths()

    manifest = json.loads(
        (backup_dir / "backup_manifest.json").read_text(
            encoding="utf-8"
        )
    )

    print("=== 本番ロールバック開始 ===")

    for folder, filename in manifest["existing_files"]:
        source = backup_dir / folder / filename
        destination = paths[folder] / filename

        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

    for folder, filename in manifest["missing_files"]:
        destination = paths[folder] / filename

        if destination.exists():
            destination.unlink()

    print("本番ロールバック完了！")


def show_production_targets():
    manifest_path = STAGING_DIR / "manifest.json"

    if not manifest_path.exists():
        print("更新データがありません")
        return

    manifest = json.loads(
        manifest_path.read_text(encoding="utf-8")
    )

    paths = get_production_paths()

    print("=== 本番更新対象 ===")

    for name in manifest["updated_prefectures"]:
        print("CSV:", paths["csv"] / f"{name}.csv")
        print("JSON:", paths["json"] / f"{name}.json")

    for grid_id in manifest["affected_grids"]:
        path = paths["grids"] / f"{grid_id}.json"

        if grid_id in manifest["deleted_grids"]:
            print("削除:", path)
        else:
            print("更新:", path)

def run_production_update(fail_after=None):
    manifest_path = STAGING_DIR / "manifest.json"

    if not manifest_path.exists():
        print("更新データがありません")
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    # 架空のテストデータを本番に反映しない
    if manifest.get("test_only") is True:
        raise ValueError("テスト用データは本番に反映できません")

    # 更新データの整合性を確認
    if not validate_update():
        print("検証できる更新データがありません")
        return

    paths = get_production_paths()

    # バックアップを作成
    backup_dir = create_production_backup()
    print("バックアップ先:", backup_dir)
    updated_count = 0

    def count_update():
        nonlocal updated_count
        updated_count += 1

        if fail_after is not None and updated_count >= fail_after:
            raise RuntimeError(
                f"テスト用エラー: {updated_count}ファイル更新後"
            )
    try:
        # CSV・JSONを更新
        for name in manifest["updated_prefectures"]:
            for folder, extension in [("csv", "csv"), ("json", "json")]:
                source = STAGING_DIR / folder / f"{name}.{extension}"
                destination = paths[folder] / source.name

                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, destination)
                print("更新:", destination)
                count_update()

        # 公開グリッドを更新・削除
        # 公開グリッドを更新・削除
        for grid_id in manifest["affected_grids"]:
            destination = paths["grids"] / f"{grid_id}.json"

            if grid_id in manifest["deleted_grids"]:
                if destination.exists():
                    destination.unlink()
                    print("削除:", destination)
                    count_update()
            else:
                source = STAGING_DIR / "grids" / f"{grid_id}.json"
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, destination)
                print("更新:", destination)
                count_update()

    except Exception as e:
        print("更新失敗:", e)
        rollback_production(backup_dir)
        raise

    print("本番用データの更新が完了しました！")

if __name__ == "__main__":
    validate_update()
    create_backup()


