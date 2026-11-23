
import json
import shutil
from pathlib import Path
from apply_update import apply_changes, create_backup, rollback
from update import CSV_DIR, JSON_DIR, STAGING_DIR
from apply_update import run_update

TEST_DIR = Path("data/apply-test")


def main():
    # 前回のテスト環境を削除
    if TEST_DIR.exists():
        shutil.rmtree(TEST_DIR)

    # 更新対象を取得
    manifest = json.loads(
        (STAGING_DIR / "manifest.json").read_text(
            encoding="utf-8"
        )
    )

    # テスト用フォルダを作成
    for folder in ("prefectures", "prefectures-json", "grids"):
        (TEST_DIR / folder).mkdir(parents=True, exist_ok=True)

    # 更新前のCSV・JSONをコピー
    for name in manifest["updated_prefectures"]:
        shutil.copy2(
            CSV_DIR / f"{name}.csv",
            TEST_DIR / "prefectures" / f"{name}.csv"
        )

        shutil.copy2(
            JSON_DIR / f"{name}.json",
            TEST_DIR / "prefectures-json" / f"{name}.json"
        )

    print("テスト環境を作成しました")
    print("保存先:", TEST_DIR)


        # 更新前の状態を記録
    old_csv = (TEST_DIR / "prefectures" / "tokyo.csv").read_bytes()
    old_json = (TEST_DIR / "prefectures-json" / "tokyo.json").read_bytes()

    try:
        # 1ファイル更新した時点で意図的にエラーを発生
        run_update(TEST_DIR, fail_after=1)

    except RuntimeError as e:
        print("想定どおりのエラー:", e)

    # 更新前の状態に戻ったか確認
    assert (TEST_DIR / "prefectures" / "tokyo.csv").read_bytes() == old_csv
    assert (TEST_DIR / "prefectures-json" / "tokyo.json").read_bytes() == old_json

    grid_path = TEST_DIR / "grids" / "1786_6962.json"
    assert not grid_path.exists()

    print("一括更新・自動復元テスト: OK")
        # エラーを発生させずに更新
    run_update(TEST_DIR)

    # 更新後のCSVとJSONがstagingと一致するか確認
    assert (
        (TEST_DIR / "prefectures" / "tokyo.csv").read_bytes()
        == (STAGING_DIR / "csv" / "tokyo.csv").read_bytes()
    )

    assert (
        (TEST_DIR / "prefectures-json" / "tokyo.json").read_bytes()
        == (STAGING_DIR / "json" / "tokyo.json").read_bytes()
    )

    # グリッドも更新されているか確認
    grid_path = TEST_DIR / "grids" / "1786_6962.json"
    assert grid_path.exists()

    assert (
        grid_path.read_bytes()
        == (STAGING_DIR / "grids" / "1786_6962.json").read_bytes()
    )

    print("正常更新テスト: OK")



if __name__ == "__main__":
    main()
