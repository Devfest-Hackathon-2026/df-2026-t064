import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from google.cloud import storage
import sync_cloud_storage as cloud_sync

BUCKET = "hinanjo-grids-001"
PREFIX = "test/sync-check"


def main():
    client = storage.Client(project="devfest-2026-d129d")
    bucket = client.bucket(BUCKET)

    # 他のテストと衝突しない専用ID
    test_id = f"rollback_{uuid4().hex}"
    object_name = f"{PREFIX}/{test_id}.json"

    with tempfile.TemporaryDirectory() as temp:
        staging = Path(temp)
        (staging / "grids").mkdir()

        # アップロードするテストデータ
        (staging / "grids" / f"{test_id}.json").write_text(
            json.dumps([{"id": test_id, "name": "テスト避難所"}]),
            encoding="utf-8"
        )

        (staging / "manifest.json").write_text(
            json.dumps({
                "test_only": True,
                "affected_grids": [test_id],
                "deleted_grids": []
            }),
            encoding="utf-8"
        )

        try:
            with patch.object(cloud_sync, "STAGING_DIR", staging):
                # まず対象ファイルをプレビュー
                cloud_sync.sync_cloud_storage(
                    dry_run=True,
                    object_prefix=PREFIX
                )

                # 1件アップロード後に意図的に失敗させる
                try:
                    cloud_sync.sync_cloud_storage(
                        dry_run=False,
                        object_prefix=PREFIX,
                        fail_after=1
                    )
                except RuntimeError as e:
                    if "テスト用エラー" not in str(e):
                        raise
                    print("想定どおりエラー発生:", e)
                else:
                    raise AssertionError("意図的なエラーが発生していません")

            # 新規追加したファイルがロールバックで消えたか確認
            if bucket.blob(object_name).exists():
                raise AssertionError("ロールバック失敗：ファイルが残っています")

            print("✅ 差分同期・自動ロールバックテスト成功！")

        finally:
            # 万一残ってもテスト専用ファイルだけ削除
            blob = bucket.blob(object_name)
            if blob.exists():
                blob.delete()
                print("テストファイルを後片付けしました")


if __name__ == "__main__":
    main()