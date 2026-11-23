import json
from pathlib import Path
from uuid import uuid4

from google.api_core.exceptions import NotFound
from google.cloud import storage

from update import main as prepare_update
from apply_update import validate_update
from sync_cloud_storage import sync_cloud_storage

PROJECT_ID = "devfest-2026-d129d"
BUCKET_NAME = "hinanjo-grids-001"

STATE_PREFIX = "updater-state"
POINTER_NAME = f"{STATE_PREFIX}/current.json"
MANIFEST_PATH = Path("data/staging/manifest.json")


def main():
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(BUCKET_NAME)

    print("=== Cloud Run 自動更新開始 ===", flush=True)

    # ① 前回の比較元データの参照先を取得
    pointer_blob = bucket.blob(POINTER_NAME)

    try:
        pointer_blob.reload()
        pointer_generation = pointer_blob.generation
        state = json.loads(pointer_blob.download_as_text())
        print("保存済みの更新状態を使用", flush=True)

    except NotFound:
        pointer_generation = 0

        names = sorted(
            p.stem for p in Path("data/prefectures").glob("*.csv")
        )

        if len(names) != 47:
            raise RuntimeError("初期CSVが47件ありません")

        state = {
            "csv": {
                name: f"{STATE_PREFIX}/prefectures/{name}.csv"
                for name in names
            },
            "json": {
                name: f"{STATE_PREFIX}/prefectures-json/{name}.json"
                for name in names
            }
        }

        print("初期データを使用", flush=True)

    # ② CSV・JSONをCloud Storageから取得
    for kind, folder in [
        ("csv", "data/prefectures"),
        ("json", "data/prefectures-json")
    ]:
        target_dir = Path(folder)
        target_dir.mkdir(parents=True, exist_ok=True)

        if len(state[kind]) != 47:
            raise RuntimeError(f"比較元{kind}が47件ありません")

        for name, object_name in state[kind].items():
            extension = "csv" if kind == "csv" else "json"
            destination = target_dir / f"{name}.{extension}"

            bucket.blob(object_name).download_to_filename(
                str(destination)
            )

        print(f"比較元{kind} 47件取得完了", flush=True)

    # ③ 最新CSVを確認
    if MANIFEST_PATH.exists():
        MANIFEST_PATH.unlink()

    prepare_update()

    if not MANIFEST_PATH.exists():
        print("変更なし。終了！", flush=True)
        return

    manifest = json.loads(
        MANIFEST_PATH.read_text(encoding="utf-8")
    )

    if manifest.get("test_only") is True:
        raise RuntimeError("テスト用データは使用できません")

    if not validate_update():
        raise RuntimeError("更新データの検証に失敗しました")

    # ④ 新しい比較元データを別の場所に保存
    revision = uuid4().hex
    new_state = {
        "csv": dict(state["csv"]),
        "json": dict(state["json"])
    }

    for name in manifest["updated_prefectures"]:
        for kind in ("csv", "json"):
            source = Path("data/staging") / kind / f"{name}.{kind}"

            if not source.is_file():
                raise FileNotFoundError(source)

            object_name = (
                f"{STATE_PREFIX}/revisions/{revision}/"
                f"{kind}/{name}.{kind}"
            )

            bucket.blob(object_name).upload_from_filename(
                str(source),
                content_type=(
                    "text/csv" if kind == "csv"
                    else "application/json"
                ),
                if_generation_match=0
            )

            new_state[kind][name] = object_name

    print("新しい比較元データを保存完了", flush=True)

    # ⑤ 公開グリッドを差分同期
    sync_cloud_storage(
        dry_run=False,
        object_prefix="grids"
    )

    print("公開グリッド同期完了", flush=True)

    # ⑥ 全処理成功後、比較元の参照先を切り替え
    pointer_blob.upload_from_string(
        json.dumps(new_state, ensure_ascii=False),
        content_type="application/json",
        if_generation_match=pointer_generation
    )

    print("比較元データの切り替え完了", flush=True)
    print("=== Cloud Run 自動更新完了 ===", flush=True)


if __name__ == "__main__":
    main()