import json
import shutil
import tempfile
from pathlib import Path

from apply_update import rollback


def main():
    # 一時的なテスト環境を作る
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        data_dir = root / "data"
        backup_dir = data_dir / "backups" / "test"

        original = data_dir / "prefectures" / "tokyo.csv"
        new_file = data_dir / "grids" / "1786_6962.json"

        original.parent.mkdir(parents=True)
        new_file.parent.mkdir(parents=True)

        # 更新前のファイルを用意
        original.write_text("更新前", encoding="utf-8")

        backup_file = backup_dir / "prefectures" / "tokyo.csv"
        backup_file.parent.mkdir(parents=True)
        shutil.copy2(original, backup_file)

        # バックアップ情報を保存
        manifest = {
            "existing_files": ["prefectures/tokyo.csv"],
            "missing_files": ["grids/1786_6962.json"]
        }      
        
        (backup_dir / "backup_manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False),
            encoding="utf-8"
        )

        # 更新途中の状態を再現
        original.write_text("更新後", encoding="utf-8")
        new_file.write_text("新規グリッド", encoding="utf-8")

        # ロールバック実行
        rollback(backup_dir, data_dir=data_dir)

        # 復元結果を確認
        assert original.read_text(encoding="utf-8") == "更新前"
        assert not new_file.exists()

        print("ロールバックテスト: OK")


if __name__ == "__main__":
    main()