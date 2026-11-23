import json
from pathlib import Path
from google.cloud import storage
from google.api_core.exceptions import NotFound
from datetime import datetime, timezone


PROJECT_ID = "devfest-2026-d129d"

STAGING_DIR = Path("data/staging")
BUCKET_NAME = "hinanjo-grids-001"


def preview_cloud_sync():
    manifest_path = STAGING_DIR / "manifest.json"

    if not manifest_path.exists():
        print("更新データがありません")
        return

    manifest = json.loads(
        manifest_path.read_text(encoding="utf-8")
    )

    # 許可する保存先を限定
    if object_prefix not in ("grids", "test/sync-check"):
        raise ValueError("許可されていない保存先です")

    is_test = object_prefix == "test/sync-check"

    # テストデータを本番に反映させない
    if is_test:
        if manifest.get("test_only") is not True:
            raise ValueError("テスト用manifestが必要です")
    else:
        if manifest.get("test_only") is True:
            raise ValueError("テスト用データは本番同期できません")

    affected = manifest["affected_grids"]
    deleted = set(manifest["deleted_grids"])

    # アップロード予定のJSONが存在するか検証
    for grid_id in affected:
        if grid_id in deleted:
            continue

        source = STAGING_DIR / "grids" / f"{grid_id}.json"

        if not source.is_file():
            raise FileNotFoundError(
                f"同期元のJSONがありません: {source}"
            )

        # JSONとして正しく読み込めるか確認
        with source.open(encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError(
                f"グリッドJSONの形式が不正です: {grid_id}"
            )

    print("同期対象のJSON検証OK")

    print("Cloud Storage 同期プレビュー")
    print("対象バケット:", BUCKET_NAME)

    for grid_id in affected:
        if grid_id in deleted:
            print(f"[DELETE] grids/{grid_id}.json")
        else:
            print(f"[UPLOAD] grids/{grid_id}.json")

    print(f"対象グリッド数: {len(affected)}")

    print("\n更新前のCloud Storage世代情報")

    generations = {}

    for grid_id in affected:
        blob = bucket.blob(f"{object_prefix}/{grid_id}.json")

        try:
            blob.reload()
            generations[grid_id] = blob.generation
            print(f"{grid_id}: generation={blob.generation}")

        except NotFound:
            generations[grid_id] = None
            print(f"{grid_id}: 新規追加")

    # 更新前の状態を保存
    backup_dir = Path("data/cloud-backups")
    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"generations_{timestamp}.json"

    backup_data = {
        "bucket": BUCKET_NAME,
        "created_at": timestamp,
        "generations": generations
    }

    backup_path.write_text(
        json.dumps(backup_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("世代情報の保存先:", backup_path)

    print("※ Cloud Storageにはまだ変更を加えていません")

def sync_cloud_storage(dry_run=True,object_prefix="grids",fail_after=None):
    manifest_path = STAGING_DIR / "manifest.json"

    if not manifest_path.exists():
        print("更新データがありません")
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    # if manifest.get("test_only") is True:
    #     raise ValueError("テスト用データは本番同期できません")

    affected = list(dict.fromkeys(manifest["affected_grids"]))
    deleted = set(manifest["deleted_grids"])

    if not deleted.issubset(set(affected)):
        raise ValueError("削除対象が更新対象に含まれていません")

    # 全ファイルを事前に検証
    for grid_id in affected:
        if grid_id in deleted:
            continue

        source = STAGING_DIR / "grids" / f"{grid_id}.json"

        if not source.is_file():
            raise FileNotFoundError(source)

        data = json.loads(source.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError(f"JSON形式が不正: {grid_id}")

    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(BUCKET_NAME)

    # 同期前の状態を記録
    generations = {}

    for grid_id in affected:
        blob = bucket.blob(f"{object_prefix}/{grid_id}.json")

        try:
            blob.reload()
            generations[grid_id] = blob.generation
        except NotFound:
            generations[grid_id] = None

    backup_dir = Path("data/cloud-backups")
    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    backup_path = backup_dir / f"sync_{timestamp}.json"

    backup_path.write_text(
        json.dumps({
            "bucket": BUCKET_NAME,
            "object_prefix": object_prefix,
            "generations": generations,
            "affected_grids": affected,
            "deleted_grids": sorted(deleted),
        }, indent=2),
        encoding="utf-8"
    )

    print("更新前の世代情報:", backup_path)

    if dry_run:
        for grid_id in affected:
            operation = "DELETE" if grid_id in deleted else "UPLOAD"
            print(f"[DRY RUN] {operation}: {object_prefix}/{grid_id}.json")

        print("テストモード：クラウドへの変更なし")
        return

    # 同期処理
    completed = []

    def check_failure():
        if fail_after is not None and len(completed) >= fail_after:
            raise RuntimeError(
                f"テスト用エラー: {len(completed)}件の同期後"
            )

    try:
        for grid_id in affected:
            object_name = f"{object_prefix}/{grid_id}.json"
            blob = bucket.blob(object_name)
            old_generation = generations[grid_id]

            # 他の処理による変更を検出する
            expected_generation = (
                old_generation if old_generation is not None else 0
            )

            if grid_id in deleted:
                if old_generation is not None:
                    blob.delete(if_generation_match=old_generation)
                    print("削除:", object_name)
                    completed.append((grid_id, None))
                    check_failure()
            else:
                source = STAGING_DIR / "grids" / f"{grid_id}.json"
                blob.upload_from_filename(
                    str(source),
                    content_type="application/json",
                    if_generation_match=expected_generation,
                )

                print("更新:", object_name)
                completed.append((grid_id, blob.generation))
                check_failure()

    except Exception:
        print("同期失敗。ロールバックを開始します")

        rollback_errors = []

        for grid_id, written_generation in reversed(completed):
            object_name = f"{object_prefix}/{grid_id}.json"
            old_generation = generations[grid_id]

            try:
                if old_generation is None:
                    # 同期で新規追加されたファイルだけ削除
                    bucket.blob(object_name).delete(
                        if_generation_match=written_generation
                    )
                else:
                    # 上書き・削除された元の世代を復元
                    kwargs = {"generation": old_generation}

                    if written_generation is not None:
                        kwargs["if_generation_match"] = written_generation
                    else:
                        kwargs["if_generation_match"] = 0

                    bucket.restore_blob(object_name, **kwargs)

                print("復元:", object_name)

            except Exception as rollback_error:
                rollback_errors.append((object_name, rollback_error))
                print("復元失敗:", object_name, rollback_error)

        if rollback_errors:
            raise RuntimeError(
                f"同期失敗後、{len(rollback_errors)}件の復元にも失敗しました。"
                f"世代情報を確認してください: {backup_path}"
            )

        raise

    print(f"Cloud Storageへの差分同期完了: {len(completed)}件")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--test-generation",
        action="store_true",
        help="既存グリッドの世代番号を取得するテスト"
    )

    parser.add_argument(
        "--sync",
        action="store_true",
        help="Cloud Storageへの差分同期をプレビューする"
    )

    args = parser.parse_args()

    if args.test_generation:
        client = storage.Client(project=PROJECT_ID)
        bucket = client.bucket(BUCKET_NAME)

        test_ids = [
            "1786_6962",
            "9999_9999"
        ]

        generations = {}

        for grid_id in test_ids:
            blob = bucket.blob(f"{object_prefix}/{grid_id}.json")

            try:
                blob.reload()
                generations[grid_id] = blob.generation
                print(f"{grid_id}: generation={blob.generation}")

            except NotFound:
                generations[grid_id] = None
                print(f"{grid_id}: 新規追加")

        backup_dir = Path("data/cloud-backups")
        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        backup_path = backup_dir / f"generations_test_{timestamp}.json"

        backup_path.write_text(
            json.dumps(
                {
                    "bucket": BUCKET_NAME,
                    "test_only": True,
                    "generations": generations
                },
                ensure_ascii=False,
                indent=2
            ),
            encoding="utf-8"
        )

        print("世代情報の保存先:", backup_path)

    elif args.sync:
        sync_cloud_storage(dry_run=True)

    else:
        preview_cloud_sync()