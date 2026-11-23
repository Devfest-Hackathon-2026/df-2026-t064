import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from google.cloud import storage
import sync_cloud_storage as cloud_sync

PREFIX = "test/sync-check"


def main():
    client = storage.Client(project=cloud_sync.PROJECT_ID)
    bucket = client.bucket(cloud_sync.BUCKET_NAME)

    run_id = uuid4().hex
    update_id = f"update_{run_id}"
    delete_id = f"delete_{run_id}"
    fail_id = f"fail_{run_id}"

    initial_data = [{"version": 1}]
    updated_data = [{"version": 2}]

    # テスト専用の既存ファイルを2件作る
    for grid_id in [update_id, delete_id]:
        blob = bucket.blob(f"{PREFIX}/{grid_id}.json")
        blob.upload_from_string(
            json.dumps(initial_data),
            content_type="application/json",
            if_generation_match=0,
        )

    try:
        with tempfile.TemporaryDirectory() as temp:
            staging = Path(temp)
            (staging / "grids").mkdir()

            # 上書き用データ
            (staging / "grids" / f"{update_id}.json").write_text(
                json.dumps(updated_data),
                encoding="utf-8",
            )

            # 3件目は存在しないファイルを指定して、
            # 2件処理後に例外を起こす
            (staging / "grids" / f"{fail_id}.json").write_text(
                json.dumps(updated_data),
                encoding="utf-8",
            )

            (staging / "manifest.json").write_text(
                json.dumps({
                    "test_only": True,
                    "affected_grids": [update_id, delete_id, fail_id],
                    "deleted_grids": [delete_id],
                }),
                encoding="utf-8",
            )

            with patch.object(cloud_sync, "STAGING_DIR", staging):
                try:
                    cloud_sync.sync_cloud_storage(
                        dry_run=False,
                        object_prefix=PREFIX,
                        fail_after=2,
                    )
                except RuntimeError as e:
                    if "テスト用エラー" not in str(e):
                        raise
                    print("想定どおりエラー発生:", e)
                else:
                    raise AssertionError("エラーが発生しませんでした")

        # 上書き・削除されたファイルが元に戻ったか確認
        for grid_id in [update_id, delete_id]:
            blob = bucket.blob(f"{PREFIX}/{grid_id}.json")
            data = json.loads(blob.download_as_text())

            if data != initial_data:
                raise AssertionError(f"復元失敗: {grid_id}")

            print("復元確認OK:", grid_id)

        # 3件目は処理前なので存在しないこと
        if bucket.blob(f"{PREFIX}/{fail_id}.json").exists():
            raise AssertionError("未処理のファイルが存在します")

        print("✅ 上書き・削除の自動ロールバックテスト成功！")

    finally:
        # テスト専用ファイルだけ後片付け
        for grid_id in [update_id, delete_id, fail_id]:
            blob = bucket.blob(f"{PREFIX}/{grid_id}.json")
            if blob.exists():
                blob.delete()


if __name__ == "__main__":
    main()