import argparse
import json
from pathlib import Path

from update import main as prepare_update
from apply_update import run_update, run_production_update
from sync_cloud_storage import sync_cloud_storage

TEST_DIR = Path("data/apply-test")
MANIFEST_PATH = Path("data/staging/manifest.json")


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--test",
        action="store_true",
        help="既存のテスト用stagingを使用する"
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help="実データをローカル本番フォルダへ反映する"
    )

    parser.add_argument(
        "--cloud-sync",
        action="store_true",
        help="ローカル更新後にCloud Storageへ同期する"
    )

    args = parser.parse_args()

    if args.test and args.apply:
        parser.error("--test と --apply は同時に指定できません")

    if args.cloud_sync and not args.apply:
        parser.error("--cloud-sync は --apply と一緒に指定してください")

    print("=== 避難所データ更新パイプライン開始 ===")

    if not args.test:
        # 古いmanifestを誤って使わない
        if MANIFEST_PATH.exists():
            MANIFEST_PATH.unlink()

        # 最新CSVを取得し、更新データを生成
        prepare_update()

    if not MANIFEST_PATH.exists():
        print("変更なし：更新は不要です")
        return

    manifest = json.loads(
        MANIFEST_PATH.read_text(encoding="utf-8")
    )

    if args.test:
        if manifest.get("test_only") is not True:
            raise ValueError("テスト用データではありません")

        run_update(TEST_DIR)

    elif args.apply:
        if manifest.get("test_only") is True:
            raise ValueError("テスト用データは本番に反映できません")

        run_production_update()

        if args.cloud_sync:
            print("=== Cloud Storageへの同期開始 ===")
            try:
                sync_cloud_storage(
                    dry_run=False,
                    object_prefix="grids"
                )
            except Exception:
                print("クラウド同期失敗。ローカル更新は完了済みです。")
                print("状態を確認するまで再実行しないでください。")
                raise

    else:
        print("更新データを生成しました。反映はまだ行いません。")

    print("=== 更新パイプライン完了 ===")


if __name__ == "__main__":
    main()