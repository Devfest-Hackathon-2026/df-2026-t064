import json
from google.cloud import storage

client = storage.Client(project="devfest-2026-d129d")
bucket = client.bucket("hinanjo-grids-001")

# 本番グリッドとは別のテスト用パス
blob = bucket.blob("test/python-upload-test.json")

data = {
    "message": "Pythonからのアップロード成功",
    "test": True
}

# 既存ファイルがあれば上書きせずエラーにする
blob.upload_from_string(
    json.dumps(data, ensure_ascii=False),
    content_type="application/json",
    if_generation_match=0
)

print("テスト用JSONのアップロード成功！")