import json
from uuid import uuid4

from google.cloud import storage

PROJECT_ID = "devfest-2026-d129d"
BUCKET_NAME = "hinanjo-grids-001"

client = storage.Client(project=PROJECT_ID)
bucket = client.bucket(BUCKET_NAME)

# 本番グリッドとは別の専用テストファイル
object_name = f"test/rollback-{uuid4().hex}.json"
blob = bucket.blob(object_name)

try:
    # ① 最初のデータをアップロード
    blob.upload_from_string(
        json.dumps({"version": 1}),
        content_type="application/json",
        if_generation_match=0
    )
    old_generation = blob.generation
    print("更新前の世代:", old_generation)

    # ② 同じファイルを上書き
    blob.upload_from_string(
        json.dumps({"version": 2}),
        content_type="application/json",
        if_generation_match=old_generation
    )
    new_generation = blob.generation
    print("更新後の世代:", new_generation)

    # ③ Soft Deleteされた古い世代を復元
    # ③ Soft Deleteされた古い世代を復元
    bucket.restore_blob(
            object_name,
            generation=old_generation,
            if_generation_match=new_generation
        )

    # ④ 元のデータに戻ったか確認
    restored = json.loads(
        bucket.blob(object_name).download_as_text()
    )

    print("復元後のデータ:", restored)

    if restored != {"version": 1}:
        raise RuntimeError("復元結果が一致しません")

    print("ロールバックテスト成功！")

finally:
    # テスト用ファイルを削除
    current_blob = bucket.blob(object_name)
    if current_blob.exists():
        current_blob.delete()
        print("テストファイルを削除しました")