from google.cloud import storage

# Google Cloudに接続
client = storage.Client(project="devfest-2026-d129d")

# バケットを取得
bucket = client.bucket("hinanjo-grids-001")

# アップロード済みのJSONを指定
blob = bucket.blob("grids/1786_6962.json")

# JSONを読み取る
data = blob.download_as_text()

print("Cloud Storageへの接続成功！")
print("取得したデータの文字数:", len(data))
print("データの先頭:", data[:200])

# オブジェクトのメタデータを取得
blob.reload()

print("世代番号:", blob.generation)
print("更新日時:", blob.updated)